// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCustomerMutations';
import { useProductByBarcode } from '../../hooks/useProductByBarcode';
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton } from '../ui';
import { useZxing } from 'react-zxing'; // Requires 'npm install react-zxing'

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
import currency from 'currency.js';

// --- Barcode Scanner Component ---
const BarcodeScannerModal = ({ isOpen, onClose, onScan }) => {
    const [error, setError] = useState('');
    
    // useZxing hook setup
    const { ref } = useZxing({
        onDecodeResult(result) {
            onScan(result.getText());
        },
        onError(err) {
            console.error(err);
            setError(`Camera Error: ${err.name}`);
        },
        constraints: { 
            video: { 
                facingMode: { exact: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        }
    });

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm bg-black text-white border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Scan Barcode</DialogTitle>
                    <DialogCloseButton onClick={onClose} className="text-white hover:bg-white/20" />
                </DialogHeader>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden mt-2">
                    <video 
                        ref={ref} 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover" 
                    />
                    {/* Overlay Target Box */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-40 border-2 border-red-500 rounded-lg shadow-[0_0_0_999px_rgba(0,0,0,0.5)]"></div>
                        <div className="absolute top-1/2 w-full h-0.5 bg-red-500/50"></div>
                    </div>
                </div>
                <div className="text-center text-sm text-gray-400 mt-4 min-h-[20px]">
                    {error || "Point camera at a barcode"}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function POSPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [categoryFilter, setCategoryFilter] = useState('All');
    const [availableCategories, setAvailableCategories] = useState(['All']);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [debouncedCustomerSearchTerm, setDebouncedCustomerSearchTerm] = useState('');

    // --- SCANNER STATE ---
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Fetch unique categories
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('category')
                .not('category', 'is', null);

            if (!error && data) {
                const uniqueCats = Array.from(new Set(data.map(item => item.category || 'General')));
                setAvailableCategories(['All', ...uniqueCats.sort()]);
            }
        };
        fetchCategories();
    }, []);

    // Debounce Effects
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!/^[0-9]{3,}$/.test(searchTerm)) {
                setDebouncedSearchTerm(searchTerm);
            } else {
                setDebouncedSearchTerm('');
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCustomerSearchTerm(customerSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [customerSearchTerm]);

    // Data Fetching
    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({
        searchTerm: debouncedSearchTerm,
        category: categoryFilter,
        page: currentPage,
        itemsPerPage
    });
    const products = productsData.products || [];
    const totalPages = productsData.totalPages || 1;

    // Barcode Lookup logic
    const isBarcodeScan = /^[0-9]{3,}$/.test(searchTerm.trim());
    const { data: scannedProduct } = useProductByBarcode(isBarcodeScan ? searchTerm.trim() : null);

    const {
        currentSale, addItemToSale, clearSale, getTotalAmount, addToast,
        currentCustomer, setCurrentCustomer, updateCartItem
    } = useStore();

    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [editItemKey, setEditItemKey] = useState(null);

    const productSearchInputRef = useRef(null);
    const customerPaymentInputRef = useRef(null);

    const [lastCustomer, setLastCustomer] = useState(() => {
        try {
            const stored = localStorage.getItem('lastCustomer');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [saleTime, setSaleTime] = useState(() => new Date().toTimeString().slice(0,5));

    useEffect(() => {
        setSelectedCustomer(currentCustomer);
    }, [currentCustomer]);

    const handleSetSelectedCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCurrentCustomer(customer);
    };

    const subtotal = getTotalAmount();

    // Handle Barcode Scan Result
    const handleScanResult = (code) => {
        setIsScannerOpen(false); // Close modal immediately
        setSearchTerm(code); // Trigger lookup via existing useEffect
        addToast({ title: 'Scanned', description: `Searching for code: ${code}`, variant: 'info' });
    };

    // Effect to add scanned product
    useEffect(() => {
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Added', description: `${scannedProduct.name} added to cart.`, variant: 'success' });
            setSearchTerm(''); // Clear to ready next scan
            productSearchInputRef.current?.focus();
        }
    }, [scannedProduct]);

    // Shortcuts
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

    // Customer Search Effect
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
                    .limit(10);
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
            return;
        }

        addItemToSale({ ...product }, 1);
    };

    // ... (Keep handleIncreaseQuantity, handleDecreaseQuantity, handleRemoveItem, handleSelectCustomer, handleAddCustomer logic same as original) ...
    const handleIncreaseQuantity = (key) => { const item = currentSale[key]; if (item) addItemToSale({ ...item, id: item.productId }, 1); };
    const handleDecreaseQuantity = (key) => { const item = currentSale[key]; if (item) addItemToSale({ ...item, id: item.productId }, -1); };
    const handleRemoveItem = (key) => { useStore.getState().removeItemFromSale(key); };
    
    const handleSelectCustomerFromModal = (c) => { handleSetSelectedCustomer(c); setCustomerSearchTerm(''); setIsCustomerModalOpen(false); };
    const handleSelectCustomerInPayment = (c) => { handleSetSelectedCustomer(c); setCustomerSearchTerm(''); setDebouncedCustomerSearchTerm(''); setCustomerSearchResults([]); setIsSearchingCustomers(false); };
    const handleAddCustomer = async (name) => {
        if(!name?.trim()) return;
        try {
            const added = await createCustomerMutation.mutateAsync({ name: name.trim() });
            handleSelectCustomerFromModal(added);
            if(isPaymentModalOpen) handleSelectCustomerInPayment(added);
        } catch(e) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    };

    const openPaymentModal = () => {
        if (Object.keys(currentSale).length === 0) {
            addToast({ title: 'Empty Cart', description: 'Add items before proceeding.', variant: 'warning' });
            return;
        }
        setAmountReceived(subtotal.toFixed(2));
        setPaymentMethod('Cash');
        setSaleTime(new Date().toTimeString().slice(0,5));
        setCustomerSearchTerm('');
        setCustomerSearchResults([]);
        setIsPaymentModalOpen(true);
    };

    const user = useStore(s => s.user);

    const handleFinalizeSale = async () => {
        if (!selectedCustomer) {
            addToast({ title: 'Customer Required', description: 'Please select a customer.', variant: 'warning' });
            return;
        }
        const items = Object.values(currentSale).map(i => ({
            productId: i.productId,
            productName: i.name,
            quantity: i.quantity,
            priceAtSale: i.price,
            cost_at_sale: i.cost || 0,
            subtotal: currency(i.price).multiply(i.quantity).value,
            basePrice: i.basePrice,
            note: i.note
        }));
        const received = currency(amountReceived || 0).value;
        const changeCalculated = currency(received).subtract(subtotal).value;

        try {
            const saleTimestamp = saleDate && saleTime ? new Date(`${saleDate}T${saleTime}:00`).toISOString() : new Date().toISOString();
            const payload = {
                saleTimestamp,
                totalAmount: subtotal,
                customerId: selectedCustomer?.id || null,
                customerName: selectedCustomer?.name || 'Walk-in',
                items,
                status: 'Completed',
                paymentMethod: paymentMethod,
                amountReceived: received,
                changeGiven: Math.max(0, changeCalculated),
                created_by: user?.id || null
            };
            await createSaleMutation.mutateAsync(payload);
            addToast({ title: 'Sale Completed', description: `Sale recorded.`, variant: 'success' });
            clearSale();
            handleSetSelectedCustomer(null);
            setLastCustomer(selectedCustomer);
            localStorage.setItem('lastCustomer', JSON.stringify(selectedCustomer));
            setAmountReceived('');
            setPaymentMethod('Cash');
            setSearchTerm('');
            setIsPaymentModalOpen(false);
        } catch (e) {
            addToast({ title: 'Checkout Error', description: e.message, variant: 'destructive' });
        }
    };

    return (
        <div className="pos-page">

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
                        {/* --- CAMERA SCAN BUTTON --- */}
                        <Button 
                            variant="secondary" 
                            className="px-3" 
                            onClick={() => setIsScannerOpen(true)}
                            title="Open Camera Scanner"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                        </Button>
                    </div>
                    <Button variant="primary" onClick={() => setIsCustomSaleModalOpen(true)} className="rounded-lg shadow-md font-semibold whitespace-nowrap">
                        + Custom
                    </Button>
                </div>
            </div>

            {/* --- CATEGORY BAR --- */}
            <div className="category-bar-container mb-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 pb-2">
                    {availableCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                            className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 ${
                                categoryFilter === cat ? 'bg-primary-soft border-primary text-primary shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
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

                <div className="hidden md:flex w-full md:w-1/3 xl:w-1/4 flex-shrink-0 flex-col sticky top-4" style={{ height: '70vh' }}>
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
                        onEditItem={(key) => setEditItemKey(key)}
                    />
                </div>
            </div>

            {/* --- MODALS --- */}
            <CustomerSelectionModal
                isOpen={isCustomerModalOpen}
                setIsOpen={setIsCustomerModalOpen}
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
                setIsOpen={setIsPaymentModalOpen}
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
                onClose={() => setIsCustomSaleModalOpen(false)}
                products={products}
                onAddItem={(product, quantity, price) => addItemToSale(product, quantity, price)}
            />

            {editItemKey && (
                <EditCartItemModal
                    isOpen={!!editItemKey}
                    onClose={() => setEditItemKey(null)}
                    item={currentSale[editItemKey]}
                    onSave={(updatedItem) => updateCartItem(editItemKey, updatedItem)}
                />
            )}

            {/* --- SCANNER MODAL --- */}
            <BarcodeScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleScanResult} 
            />

            {!(isCartDrawerOpen || isPaymentModalOpen) && (
                <MobileCartBar
                    itemCount={Object.keys(currentSale).length}
                    subtotal={subtotal}
                    onOpenCart={() => setIsCartDrawerOpen(true)}
                />
            )}

            <CartDrawer
                isOpen={isCartDrawerOpen}
                onClose={() => setIsCartDrawerOpen(false)}
                currentSale={currentSale}
                subtotal={subtotal}
                handleIncreaseQuantity={handleIncreaseQuantity}
                handleDecreaseQuantity={handleDecreaseQuantity}
                handleRemoveItem={handleRemoveItem}
                openPaymentModal={openPaymentModal}
                createSaleMutation={createSaleMutation}
                clearSale={clearSale}
                onEditItem={(key) => setEditItemKey(key)}
            />

            <TabBar />
        </div>
    );
}
