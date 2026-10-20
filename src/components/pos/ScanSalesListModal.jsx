// src/components/pos/ScanSalesListModal.jsx
import React, { useState, useRef } from 'react';
import { Camera, Trash2, Check, Loader2, FileImage } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import currency from 'currency.js';

// Client-side image compressor: shrinks 10MB photos to ~150KB in milliseconds
const compressImage = (file, maxWidth = 1280, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export default function ScanSalesListModal({ isOpen, onClose, products = [], onSuccess }) {
    const { user, addToast } = useStore();
    const [imagePreview, setImagePreview] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const cameraInputRef = useRef(null);
    const uploadInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsAnalyzing(true);
            setParsedItems([]);

            // Compress image on client
            const compressedBase64 = await compressImage(file);
            setImagePreview(compressedBase64);

            await processImage(compressedBase64);
        } catch (err) {
            console.error(err);
            setIsAnalyzing(false);
            addToast({ title: 'Image Error', description: 'Failed to process image.', variant: 'destructive' });
        }
    };

    const processImage = async (base64String) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout guard

        try {
            const res = await fetch('/api/scan-sales-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    imageBase64: base64String,
                    mimeType: 'image/jpeg',
                    products: products.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: Number(p.price) || 0
                    }))
                })
            });

            clearTimeout(timeoutId);
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to extract sales');

            setParsedItems(result.data || []);
            if (!result.data || result.data.length === 0) {
                addToast({ title: 'No entries detected', description: 'Could not detect clear sales rows in this photo.', variant: 'warning' });
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error(err);
            const msg = err.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message;
            addToast({ title: 'Scan Error', description: msg, variant: 'destructive' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const updateItem = (index, field, value) => {
        setParsedItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                const qty = Number(field === 'quantity' ? value : updated[index].quantity) || 0;
                const price = Number(field === 'unit_price' ? value : updated[index].unit_price) || 0;
                updated[index].total_amount = qty * price;
            }
            return updated;
        });
    };

    const removeItem = (index) => {
        setParsedItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmAndRecord = async () => {
        if (!parsedItems.length) return;
        setIsSaving(true);

        try {
            const now = new Date();
            const manilaIso = format(now, "yyyy-MM-dd'T'HH:mm:ss'+08:00'");

            for (const item of parsedItems) {
                const qty = Number(item.quantity) || 1;
                const unitPrice = Number(item.unit_price) || 0;
                const total = Number(item.total_amount) || (qty * unitPrice);
                const customerName = (item.customer_name || 'Walk-in').trim();

                const { data: saleData, error: saleErr } = await supabase
                    .from('sales')
                    .insert([{
                        customername: customerName,
                        totalamount: total,
                        paymentmethod: item.payment_method || 'Cash',
                        status: 'Completed',
                        saletimestamp: manilaIso,
                        created_by: user?.id || null
                    }])
                    .select('id')
                    .single();

                if (saleErr) throw saleErr;

                if (item.product_id) {
                    const { error: itemErr } = await supabase
                        .from('sale_items')
                        .insert([{
                            sale_id: saleData.id,
                            product_id: item.product_id,
                            quantity: qty,
                            price: unitPrice
                        }]);
                    if (itemErr) throw itemErr;
                }
            }

            addToast({
                title: 'Sales Recorded',
                description: `Successfully logged ${parsedItems.length} transactions from photo!`,
                variant: 'success'
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Batch save error:', err);
            addToast({ title: 'Recording Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const grandTotal = parsedItems.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header with Seaside Logo */}
                <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm overflow-hidden shrink-0">
                            <img
                                src="/seasidelogo_.png"
                                alt="Seaside Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight">Scan Sales Sheet / Log</h2>
                            <p className="text-xs text-emerald-100">AI auto-extracts customer orders from paper lists</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-white/80 hover:text-white text-lg font-bold p-1 leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Capture / Upload Buttons */}
                    {!imagePreview && (
                        <div className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-gray-50/50">
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <input
                                ref={uploadInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 p-2 overflow-hidden">
                                <img
                                    src="/seasidelogo_.png"
                                    alt="Seaside Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm mb-1">Scan or Upload Delivery Log</h3>
                            <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
                                Point your camera at a notebook list or upload a photo to auto-record orders.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    <Camera className="w-4 h-4" /> Take Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => uploadInputRef.current?.click()}
                                    className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    <FileImage className="w-4 h-4 text-emerald-600" /> Upload Image
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Image Preview & Status */}
                    {imagePreview && (
                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <img src={imagePreview} alt="Log preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                                <div>
                                    <p className="text-xs font-bold text-gray-800">
                                        {isAnalyzing ? 'Analyzing photo...' : `Extracted ${parsedItems.length} transactions`}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        {isAnalyzing ? 'Reading handwriting & calculating totals' : 'Review rows below before saving'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isAnalyzing || isSaving}
                                onClick={() => {
                                    setImagePreview(null);
                                    setParsedItems([]);
                                }}
                                className="text-xs text-gray-500 hover:text-red-600 font-semibold px-2 py-1"
                            >
                                Retake
                            </button>
                        </div>
                    )}

                    {/* Loader */}
                    {isAnalyzing && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            <p className="text-sm font-semibold text-gray-700">Gemini is parsing the log...</p>
                            <p className="text-xs text-gray-400">Detecting names, quantities, and matching refill prices</p>
                        </div>
                    )}

                    {/* Editable Review Table */}
                    {!isAnalyzing && parsedItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                <span className="font-bold uppercase tracking-wider">Review & Edit Items</span>
                                <span>Total: <strong className="text-emerald-700 font-bold">{currency(grandTotal, { symbol: '₱' }).format()}</strong></span>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                                {parsedItems.map((item, idx) => (
                                    <div key={idx} className="p-3 flex items-center gap-2 hover:bg-gray-50/70 transition-colors">
                                        {/* Customer Name */}
                                        <div className="flex-1 min-w-[110px]">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Customer</label>
                                            <input
                                                type="text"
                                                value={item.customer_name}
                                                onChange={(e) => updateItem(idx, 'customer_name', e.target.value)}
                                                className="w-full text-xs font-semibold bg-transparent border-b border-gray-200 focus:border-emerald-500 outline-none pb-0.5"
                                            />
                                        </div>

                                        {/* Product Select */}
                                        <div className="flex-1 min-w-[130px]">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Product</label>
                                            <select
                                                value={item.product_id || ''}
                                                onChange={(e) => {
                                                    const pid = parseInt(e.target.value);
                                                    const prod = products.find(p => p.id === pid);
                                                    if (prod) {
                                                        updateItem(idx, 'product_id', prod.id);
                                                        updateItem(idx, 'product_name', prod.name);
                                                        updateItem(idx, 'unit_price', Number(prod.price) || 0);
                                                    }
                                                }}
                                                className="w-full text-xs bg-transparent border-b border-gray-200 focus:border-emerald-500 outline-none pb-0.5 truncate"
                                            >
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Qty */}
                                        <div className="w-14 text-center">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                className="w-full text-xs font-bold text-center bg-gray-50 rounded py-1 border border-gray-200 outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Row Total */}
                                        <div className="w-16 text-right pr-1">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Total</label>
                                            <span className="text-xs font-bold text-emerald-600">
                                                ₱{Number(item.total_amount || 0).toFixed(0)}
                                            </span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"
                                            title="Remove entry"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirmAndRecord}
                        disabled={isSaving || isAnalyzing || parsedItems.length === 0}
                        className="flex-1 max-w-xs px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving Sales...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> Save {parsedItems.length} Sales ({currency(grandTotal, { symbol: '₱' }).format()})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}