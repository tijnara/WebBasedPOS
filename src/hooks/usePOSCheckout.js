// src/hooks/usePOSCheckout.js
import { useState } from 'react';
import { useStore } from '../store/useStore';
import currency from 'currency.js';
import { SALE_TIMESTAMP_TOLERANCE_MS } from '../config/constants';

// Asia/Manila (UTC+8) Helpers
export const getLocalDateString = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' });
    return formatter.format(new Date());
};

export const getLocalTimeString = () => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return formatter.format(new Date());
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

        // Map cart items with custom item awareness
        const items = Object.values(currentSale).map(i => {
            const isCustom = Boolean(
                i.is_custom ||
                !i.productId ||
                isNaN(Number(i.productId)) ||
                String(i.productId).startsWith('custom_') ||
                String(i.id).startsWith('custom_')
            );

            return {
                productId: isCustom ? null : Number(i.productId || i.id),
                productName: i.name,
                quantity: i.quantity,
                priceAtSale: i.price,
                cost_at_sale: i.cost || 0,
                subtotal: currency(i.price).multiply(i.quantity).value,
                basePrice: i.basePrice || i.price,
                note: i.note || null,
                is_custom: isCustom,
                track_stock: isCustom ? false : (i.track_stock !== false)
            };
        });

        const received = currency(amountReceived || 0).value;
        const changeCalculated = currency(received).subtract(subtotal).value;

        try {
            const now = new Date();
            // Align constructed date with Asia/Manila (+08:00)
            const constructedDate = new Date(`${saleDate}T${saleTime}:00+08:00`);
            let finalSaleTimestamp;

            if (Math.abs(now.getTime() - constructedDate.getTime()) < SALE_TIMESTAMP_TOLERANCE_MS) {
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
            addToast({ title: 'Sale Completed', description: 'Transaction recorded successfully.', variant: 'success' });
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