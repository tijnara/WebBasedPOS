// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCustomerMutations';
import { useProductByBarcode } from '../../hooks/useProductByBarcode';
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton } from '../ui';
import { useZxing } from 'react-zxing';
import { usePOSModals } from '../../hooks/usePOSModals';
import { usePOSCheckout, getLocalDateString, getLocalTimeString } from '../../hooks/usePOSCheckout';
import { DEBOUNCE_DELAY_MS, DEFAULT_ITEMS_PER_PAGE, CUSTOMER_SEARCH_LIMIT } from '../../config/constants';

import TabBar from '../TabBar';
import POSCart from '../pos/POSCart';
import POSProductGrid from '../pos/POSProductGrid';
import CustomerSelectionModal from '../pos/CustomerSelectionModal';
import PaymentModal from '../pos/PaymentModal';
import CustomSaleModal from '../pos/CustomSaleModal';
import MobileCartBar from '../pos/MobileCartBar';
import CartDrawer from '../pos/CartDrawer';
import EditCartItemModal from '../pos/EditCartItemModal';
import { supabase } from '../../lib/supabaseClient';

// --- Barcode Scanner Component ---
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

export default function POSPage() {
    const {
        isCustomerModalOpen, closeCustomerModal,
        isCustomSaleModalOpen, openCustomSale, closeCustomSale,
        isPaymentModalOpen, openPaymentModal: openPaymentModalHandler, closePaymentModal,
        isCartDrawerOpen, openCartDrawer, closeCartDrawer,
        isScannerOpen, openScanner, closeScanner,
        editItemKey, openEditItem, closeEditItem
    } = usePOSModals();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

    const [categoryFilter, setCategoryFilter] = useState('All');
    const [availableCategories, setAvailableCategories] = useState(['All']);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [debouncedCustomerSearchTerm, setDebouncedCustomerSearchTerm] = useState('');
    const [stockWarningKey, setStockWarningKey] = useState(null);

    const triggerStockWarning = (key) => {
        setStockWarningKey(key);
        setTimeout(() => setStockWarningKey(null), 3000); // Clear after 3 seconds
    };

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('category')
                .not('category', 'is', null)
                .eq('is_hidden', false);

            if (!error && data) {
                const uniqueCats = Array.from(new Set(data.map(item => item.category || 'General')));
                setAvailableCategories(['All', ...uniqueCats.sort()]);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (!/^[0-9]{3,}$/.test(searchTerm)) {
                setDebouncedSearchTerm(searchTerm);
            } else {
                setDebouncedSearchTerm('');
            }
        }, DEBOUNCE_DELAY_MS);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCustomerSearchTerm(customerSearchTerm);
        }, DEBOUNCE_DELAY_MS);
        return () => clearTimeout(handler);
    }, [customerSearchTerm]);

    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({
        searchTerm: debouncedSearchTerm,
        category: categoryFilter,
        page: currentPage,
        itemsPerPage,
        excludeHidden: true
    });
    const products = productsData.products || [];
    const totalPages = productsData.totalPages || 1;

    const isBarcodeScan = /^[0-9]{3,}$/.test(searchTerm.trim());
    const { data: scannedProduct } = useProductByBarcode(isBarcodeScan ? searchTerm.trim() : null);

    const {
        currentSale, addItemToSale, clearSale, getTotalAmount, addToast,
        currentCustomer, setCurrentCustomer, updateCartItem
    } = useStore();

    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    const productSearchInputRef = useRef(null);
    const customerPaymentInputRef = useRef(null);

    const [lastCustomer, setLastCustomer] = useState(() => {
        try {
            const stored = localStorage.getItem('lastCustomer');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    useEffect(() => {
        setSelectedCustomer(currentCustomer);
    }, [currentCustomer]);

    const handleSetSelectedCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCurrentCustomer(customer);
    };

    const subtotal = getTotalAmount();
    const totalQty = Object.values(currentSale).reduce((sum, item) => sum + (item.quantity || 0), 0);

    const {
        paymentMethod, setPaymentMethod,
        amountReceived, setAmountReceived,
        saleDate, setSaleDate,
        saleTime, setSaleTime,
        handleFinalizeSale,
    } = usePOSCheckout({
        subtotal,
        selectedCustomer,
        createSaleMutation,
        handleSetSelectedCustomer,
        setLastCustomer,
        closePaymentModal,
        setSearchTerm,
    });

    const handleScanResult = (code) => {
        closeScanner();
        setSearchTerm(code);
        addToast({ title: 'Scanned', description: `Searching for code: ${code}`, variant: 'info' });
    };

    useEffect(() => {
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Added', description: `${scannedProduct.name} added to cart.`, variant: 'success' });
            setSearchTerm('');
            productSearchInputRef.current?.focus();
        }
    }, [scannedProduct]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'F1') {
                event.preventDefault();
                productSearchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!(isCustomerModalOpen || isPaymentModalOpen) || !debouncedCustomerSearchTerm) {
            setCustomerSearchResults([]);
            setIsSearchingCustomers(false);
            return;
        }
        const searchCustomers = async () => {
            setIsSearchingCustomers(true);
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .or(`name.ilike.%${debouncedCustomerSearchTerm}%,phone.ilike.%${debouncedCustomerSearchTerm}%`)
                    .limit(CUSTOMER_SEARCH_LIMIT);
                if (!error) setCustomerSearchResults(data || []);
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        searchCustomers();
    }, [debouncedCustomerSearchTerm, isCustomerModalOpen, isPaymentModalOpen]);

    const handleAdd = (product) => {
        if (!product) return;
        const itemKey = `${product.id}__${Number(product.price).toFixed(2)}`;
        const currentQtyInCart = currentSale[itemKey]?.quantity || 0;

        if (currentQtyInCart + 1 > product.stock) {
            addToast({ title: 'Stock Limit', description: `Cannot add more than the ${product.stock} available.`, variant: 'warning' });
            triggerStockWarning(itemKey);
            return;
        }

        addItemToSale({ ...product }, 1);
    };

    const handleIncreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) {
            const product = products.find(p => p.id === item.productId);
            if (product && item.quantity + 1 > product.stock) {
                addToast({ title: 'Stock Limit', description: `Cannot add more than the ${product.stock} available.`, variant: 'warning' });
                triggerStockWarning(key);
                return;
            }
            addItemToSale({ ...item, id: item.productId }, 1);
        }
    };
    const handleDecreaseQuantity = (key) => { const item = currentSale[key]; if (item) addItemToSale({ ...item, id: item.productId }, -1); };
    const handleRemoveItem = (key) => { useStore.getState().removeItemFromSale(key); };

    const handleSetQuantity = (key, qty) => {
        const item = currentSale[key];
        if (!item) return;

        const product = products.find(p => p.id === item.productId);
        let finalQty = qty;

        if (product && product.stock !== null && product.stock !== undefined) {
            if (qty > product.stock) {
                addToast({ title: 'Stock Limit', description: `Cannot add more than the ${product.stock} available.`, variant: 'warning' });
                triggerStockWarning(key);
                finalQty = product.stock;
            }
        }

        updateCartItem(key, { quantity: finalQty });
    };

    const handleSelectCustomerFromModal = (c) => { handleSetSelectedCustomer(c); setCustomerSearchTerm(''); closeCustomerModal(); };
    const handleSelectCustomerInPayment = (c) => { handleSetSelectedCustomer(c); setCustomerSearchTerm(''); setDebouncedCustomerSearchTerm(''); setCustomerSearchResults([]); setIsSearchingCustomers(false); };
    const handleAddCustomer = async (name) => {
        if (!name?.trim()) return;
        try {
            const added = await createCustomerMutation.mutateAsync({ name: name.trim() });
            handleSelectCustomerFromModal(added);
            if (isPaymentModalOpen) handleSelectCustomerInPayment(added);
        } catch (e) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    };

    const openPaymentModal = () => {
        const currentTotal = getTotalAmount();
        if (Object.keys(currentSale).length === 0) {
            addToast({ title: 'Empty Cart', description: 'Add items before proceeding.', variant: 'warning' });
            return;
        }

        setAmountReceived(currentTotal.toFixed(2));
        setPaymentMethod('Cash');
        setSaleDate(getLocalDateString());
        setSaleTime(getLocalTimeString());

        setCustomerSearchTerm('');
        setCustomerSearchResults([]);
        openPaymentModalHandler();
    };

    const handleCameraButtonClick = async () => {
        // MOBILE FIX: Mobile browsers disable mediaDevices entirely over HTTP.
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            addToast({
                title: 'Camera Blocked by Browser',
                description: 'Camera access requires a secure connection. If using a phone, access the site via HTTPS or localhost.',
                variant: 'destructive',
            });
            return;
        }

        openScanner();
    };

    return (
        <div className="pos-page responsive-page">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Point of Sale</h1>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial sm:w-full sm:max-w-xs flex gap-2">
                        <Input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Scan/Search (F1)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-0"
                        />
                        <Button
                            variant="secondary"
                            className="px-3"
                            onClick={handleCameraButtonClick}
                            title="Open Camera Scanner"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                        </Button>
                    </div>
                    <Button variant="primary" onClick={openCustomSale} className="rounded-lg shadow-md font-semibold whitespace-nowrap">
                        + Custom
                    </Button>
                </div>
            </div>

            <div className="category-bar-container mb-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 pb-2">
                    {availableCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                            className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 ${categoryFilter === cat ? 'bg-primary-soft border-primary text-primary shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full relative items-start">
                <POSProductGrid
                    isLoading={isLoadingProducts}
                    products={products}
                    handleAdd={handleAdd}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />

                <div className="hidden md:flex w-full md:w-1/3 xl:w-1/3 flex-shrink-0 flex-col sticky top-4" style={{ height: '70vh' }}>
                    <POSCart
                        currentSale={currentSale}
                        clearSale={clearSale}
                        subtotal={subtotal}
                        handleIncreaseQuantity={handleIncreaseQuantity}
                        handleDecreaseQuantity={handleDecreaseQuantity}
                        handleRemoveItem={handleRemoveItem}
                        openPaymentModal={openPaymentModal}
                        createSaleMutation={createSaleMutation}
                        lastCustomer={lastCustomer}
                        onEditItem={openEditItem}
                        handleSetQuantity={handleSetQuantity}
                        stockWarningKey={stockWarningKey}
                    />
                </div>
            </div>

            {/* --- MODALS --- */}
            <CustomerSelectionModal
                isOpen={isCustomerModalOpen}
                setIsOpen={closeCustomerModal}
                searchTerm={customerSearchTerm}
                setSearchTerm={setCustomerSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerFromModal={handleSelectCustomerFromModal}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                debouncedSearchTerm={debouncedCustomerSearchTerm}
                handleAddCustomer={handleAddCustomer}
                createCustomerMutation={createCustomerMutation}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                setIsOpen={closePaymentModal}
                searchTerm={customerSearchTerm}
                setSearchTerm={setCustomerSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerInPayment={handleSelectCustomerInPayment}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                handleAddCustomer={handleAddCustomer}
                createCustomerMutation={createCustomerMutation}
                lastCustomer={lastCustomer}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                amountReceived={amountReceived}
                setAmountReceived={setAmountReceived}
                subtotal={subtotal}
                saleDate={saleDate}
                setSaleDate={setSaleDate}
                saleTime={saleTime}
                setSaleTime={setSaleTime}
                handleFinalizeSale={handleFinalizeSale}
                createSaleMutation={createSaleMutation}
                customerPaymentInputRef={customerPaymentInputRef}
            />

            <CustomSaleModal
                isOpen={isCustomSaleModalOpen}
                onClose={closeCustomSale}
                products={products}
                onAddItem={(product, quantity, price) => addItemToSale(product, quantity, price)}
            />

            {editItemKey && (
                <EditCartItemModal
                    isOpen={!!editItemKey}
                    onClose={closeEditItem}
                    item={currentSale[editItemKey]}
                    onSave={(updatedItem) => {
                        const product = products.find(p => p.id === updatedItem.productId);
                        if (product && updatedItem.quantity > product.stock) {
                            addToast({ title: 'Stock Limit', description: `Limited to ${product.stock} items.`, variant: 'warning' });
                            updatedItem.quantity = product.stock;
                        }
                        updateCartItem(editItemKey, updatedItem);
                        closeEditItem();
                    }}
                />
            )}

            {/* --- SCANNER MODAL --- */}
            {isScannerOpen && (
                <BarcodeScannerModal
                    isOpen={isScannerOpen}
                    onClose={closeScanner}
                    onScan={handleScanResult}
                />
            )}

            {/* --- MOBILE CART BAR --- */}
            {!(isCartDrawerOpen || isPaymentModalOpen) && (
                <MobileCartBar
                    itemCount={Object.keys(currentSale).length}
                    totalQty={totalQty}
                    subtotal={subtotal}
                    onOpenCart={openCartDrawer}
                />
            )}

            <CartDrawer
                isOpen={isCartDrawerOpen}
                onClose={closeCartDrawer}
                currentSale={currentSale}
                subtotal={subtotal}
                handleIncreaseQuantity={handleIncreaseQuantity}
                handleDecreaseQuantity={handleDecreaseQuantity}
                handleRemoveItem={handleRemoveItem}
                openPaymentModal={openPaymentModal}
                createSaleMutation={createSaleMutation}
                clearSale={clearSale}
                onEditItem={openEditItem}
                handleSetQuantity={handleSetQuantity}
                stockWarningKey={stockWarningKey}
            />

            <TabBar />
        </div>
    );
}
