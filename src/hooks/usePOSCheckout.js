// src/hooks/usePOSCheckout.js
import { useState } from 'react';
import { useStore } from '../store/useStore';
import currency from 'currency.js';

export const getLocalDateString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
};

export const getLocalTimeString = () => {
    return new Date().toTimeString().slice(0, 5);
};

export function usePOSCheckout({
    subtotal,
    selectedCustomer,
    createSaleMutation,
    handleSetSelectedCustomer,
    setLastCustomer,
    closePaymentModal,
    setSearchTerm
}) {
    const { currentSale, clearSale, addToast, user } = useStore();
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [saleDate, setSaleDate] = useState(getLocalDateString());
    const [saleTime, setSaleTime] = useState(getLocalTimeString());

    const handleFinalizeSale = async () => {
        if (paymentMethod === 'Charge' && !selectedCustomer) {
            addToast({ title: 'Customer Required', description: 'Please select a customer for Charge transactions.', variant: 'warning' });
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
            const now = new Date();
            const constructedDate = new Date(`${saleDate}T${saleTime}:00`);
            let finalSaleTimestamp;

            if (Math.abs(now - constructedDate) < 5 * 60 * 1000) {
                finalSaleTimestamp = now.toISOString();
            } else {
                finalSaleTimestamp = constructedDate.toISOString();
            }

            const payload = {
                saleTimestamp: finalSaleTimestamp,
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
            closePaymentModal();
        } catch (e) {
            addToast({ title: 'Checkout Error', description: e.message, variant: 'destructive' });
        }
    };

    return {
        paymentMethod,
        setPaymentMethod,
        amountReceived,
        setAmountReceived,
        saleDate,
        setSaleDate,
        saleTime,
        setSaleTime,
        handleFinalizeSale,
    };
}
