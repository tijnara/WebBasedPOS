// src/components/pos/BarcodeScannerModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton } from '../ui';
import { useZxing } from 'react-zxing';

const BarcodeScannerModal = ({ isOpen, onClose, onScan }) => {
    const [error, setError] = useState('');
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch all available cameras when the modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const initializeCamera = async () => {
            try {
                // 1. Force the browser/mobile to ask for permission FIRST with a flexible request
                let stream;
                try {
                    // Try to get the environment camera initially
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: { ideal: "environment" } } 
                    });
                } catch (e) {
                    console.warn("Could not get environment camera, falling back to any video device.");
                    // Fallback to any camera if the environment one fails
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                }

                // 2. Stop the temporary stream immediately so ZXing can take control
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }

                // 3. Now that we have permission, list the cameras properly
                const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = mediaDevices.filter((device) => device.kind === 'videoinput');

                if (isMounted) {
                    setDevices(videoDevices);

                    if (videoDevices.length > 0) {
                        // Check for previously saved preference
                        const preferredId = localStorage.getItem('preferredScannerId');
                        const isPreferredValid = videoDevices.some(d => d.deviceId === preferredId);

                        if (isPreferredValid && preferredId) {
                            setSelectedDeviceId(preferredId);
                        } else {
                            // Priority Detection Logic:
                            // A. Rear/Back camera (Mobile)
                            const backCamera = videoDevices.find(d => 
                                /back|rear|environment/i.test(d.label)
                            );
                            
                            // B. USB/External camera (Desktop/Handheld scanners)
                            const usbCamera = videoDevices.find(d => 
                                /usb|external|scanner|cam/i.test(d.label)
                            );

                            const bestCamera = backCamera || usbCamera || videoDevices[0];
                            setSelectedDeviceId(bestCamera.deviceId);
                            
                            // Save preference if it's a specific type
                            if (backCamera || usbCamera) {
                                localStorage.setItem('preferredScannerId', bestCamera.deviceId);
                            }
                        }
                    }
                    setIsInitialized(true);
                }
            } catch (err) {
                console.error("Camera Init Error:", err);
                if (isMounted) {
                    setError(err.name === 'NotAllowedError' || err.name === 'NotSupportedError'
                        ? 'Camera permission denied. Ensure you are on HTTPS or localhost.'
                        : `Camera Error: ${err.message || err.name}`
                    );
                }
            }
        };

        initializeCamera();

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    const { ref } = useZxing({
        paused: !isInitialized,
        onDecodeResult(result) {
            onScan(result.getText());
        },
        onError(err) {
            // Ignore the constant "NotFoundException" (which just means no barcode is in frame yet)
            if (err.name !== 'NotFoundException') {
                console.error("ZXing Error:", err);
                // Do not overwrite the main error if it's just a scanning loop fail
                if (!error && isInitialized) setError(`Camera Error: ${err.message || err.name}`);
            }
        },
        deviceId: selectedDeviceId || undefined,
        // Hint for mobile devices if no specific ID is selected yet
        constraints: !selectedDeviceId ? { video: { facingMode: { ideal: "environment" } } } : undefined,
    });

    const handleDeviceChange = (e) => {
        const id = e.target.value;
        setSelectedDeviceId(id);
        localStorage.setItem('preferredScannerId', id);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Barcode</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>

                {/* Camera selection and Error handling */}
                <div className="mt-4 space-y-2">
                    {devices.length > 0 && (
                        <select
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                            value={selectedDeviceId}
                            onChange={handleDeviceChange}
                        >
                            {devices.map((device, index) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${index + 1}`}
                                </option>
                            ))}
                        </select>
                    )}

                    {!isInitialized && !error && (
                        <div className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                            Requesting camera access...
                        </div>
                    )}

                    {error && (
                        <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                </div>

                <div className="relative aspect-square bg-black rounded-lg overflow-hidden mt-2 flex items-center justify-center">
                    <video
                        ref={ref}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-40 border-2 border-red-500 rounded-lg shadow-[0_0_0_999px_rgba(0,0,0,0.5)]"></div>
                        <div className="absolute top-1/2 w-full h-0.5 bg-red-500/50"></div>
                    </div>
                </div>
                <div className="text-center text-sm text-gray-500 mt-2 min-h-[20px] pb-2">
                    {!error && "Point camera at a barcode"}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BarcodeScannerModal;