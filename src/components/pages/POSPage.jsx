// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCreateCustomer';
import {
    Button, Input
} from '../ui';
import MobileLogoutButton from '../MobileLogoutButton';
import TabBar from '../TabBar';
import POSCart from '../pos/POSCart';
import POSProductGrid from '../pos/POSProductGrid';
import CustomerSelectionModal from '../pos/CustomerSelectionModal';
import PaymentModal from '../pos/PaymentModal';
import CustomSaleModal from '../pos/CustomSaleModal';
import MobileCartBar from '../pos/MobileCartBar';
import CartDrawer from '../pos/CartDrawer';

export default function POSPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({ searchTerm: '', page: currentPage, itemsPerPage });
    const products = productsData.products;
    const totalPages = productsData.totalPages || 1;

    const {
        currentSale, addItemToSale, clearSale, getTotalAmount,
        currentCustomer
    } = useStore();

    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    const productSearchInputRef = useRef(null);

    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

    const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [saleTime, setSaleTime] = useState(() => new Date().toTimeString().slice(0,5));


    const subtotal = getTotalAmount();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

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
        if (!searchTerm) return;
        const trimmed = searchTerm.trim();
        const scannedProduct = products.find(p => p.barcode === trimmed);
        if (scannedProduct) {
            handleAdd(scannedProduct);
            setSearchTerm('');
            productSearchInputRef.current?.focus();
        }
    }, [searchTerm, products]);

    useEffect(() => {
        if (!(isCustomerModalOpen || isPaymentModalOpen) || !debouncedSearchTerm) {
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
                    .ilike('name', `%${debouncedSearchTerm}%`)
                    .limit(10);
                if (error) {
                    setCustomerSearchResults([]);
                    return;
                }
                setCustomerSearchResults(data || []);
            } catch (error) {
                console.error("Failed to search customers:", error);
                setCustomerSearchResults([]);
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        searchCustomers();
    }, [debouncedSearchTerm, isCustomerModalOpen, isPaymentModalOpen]);

    const handleAdd = (product) => {
        if (!product) return;
        const itemKey = `${product.id}__${Number(product.price).toFixed(2)}`;
        const currentQtyInCart = currentSale[itemKey]?.quantity || 0;
        if (currentQtyInCart + 1 > product.stock) {
            addToast({ title: 'Stock Limit', description: `Cannot add more than the ${product.stock} available.`, variant: 'warning' });
            return;
        }
        addItemToSale(product, 1);
    };

    const openPaymentModal = () => {
        if (Object.keys(currentSale).length === 0) {
            addToast({ title: 'Empty Cart', description: 'Add items before proceeding.', variant: 'warning' });
            return;
        }
        setAmountReceived(subtotal.toFixed(2));
        setPaymentMethod('Cash');
        const now = new Date();
        setSaleTime(now.toTimeString().slice(0,5));
        setIsPaymentModalOpen(true);
    };

    const handleFinalizeSale = async () => {
        if (!selectedCustomer) {
            return;
        }
        const items = Object.values(currentSale).map(i => ({
            productId: i.productId,
            productName: i.name,
            quantity: i.quantity,
            priceAtSale: i.price,
            subtotal: currency(i.price).multiply(i.quantity).value
        }));
        const received = currency(amountReceived || 0).value;
        const changeCalculated = currency(received).subtract(subtotal).value;

        try {
            const saleTimestamp = saleDate && saleTime
                ? new Date(`${saleDate}T${saleTime}:00`).toISOString()
                : new Date().toISOString();
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
                created_by: useStore(s => s.user)?.id || null
            };
            await createSaleMutation.mutateAsync(payload);
            clearSale();
            setSelectedCustomer(null);
            setAmountReceived('');
            setPaymentMethod('Cash');
            setSearchTerm('');
            setCustomerSearchResults([]);
            setIsPaymentModalOpen(false);
        } catch (e) {
        }
    };

    return (
        <div className="pos-page">
            <MobileLogoutButton />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Point of Sale</h1>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial sm:w-full sm:max-w-xs">
                        <Input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Scan or search (F1)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button variant="primary" onClick={() => setIsCustomSaleModalOpen(true)} className="rounded-lg shadow-md font-semibold whitespace-nowrap">
                        + Custom
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full relative items-start">
                <POSProductGrid
                    isLoading={isLoadingProducts}
                    products={products}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
                <div
                    className="hidden md:flex w-full md:w-1/3 xl:w-1/4 flex-shrink-0 flex-col sticky top-20"
                    style={{ height: 'calc(100vh - 6rem)' }}
                >
                    <POSCart
                        currentSale={currentSale}
                        clearSale={clearSale}
                        subtotal={subtotal}
                        handleDecreaseQuantity={() => {}}
                        handleRemoveItem={() => {}}
                        openPaymentModal={() => {}}
                        createSaleMutation={createSaleMutation}
                        lastCustomer={null}
                    />
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={isCustomerModalOpen}
                setIsOpen={setIsCustomerModalOpen}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerFromModal={(customer) => setSelectedCustomer(customer)}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                handleAddCustomer={(name) => createCustomerMutation.mutateAsync({ name })}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                setIsOpen={setIsPaymentModalOpen}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerInPayment={(customer) => setSelectedCustomer(customer)}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                handleAddCustomer={(name) => createCustomerMutation.mutateAsync({ name })}
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
            />

            <CustomSaleModal
                isOpen={isCustomSaleModalOpen}
                onClose={() => setIsCustomSaleModalOpen(false)}
                products={products}
                onAddItem={(product, quantity, price) => addItemToSale(product, quantity, price)}
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
                handleIncreaseQuantity={() => {}}
                handleDecreaseQuantity={() => {}}
                handleRemoveItem={() => {}}
                openPaymentModal={openPaymentModal}
                createSaleMutation={createSaleMutation}
            />

            <TabBar />
        </div>
    );
}