// src/hooks/useCreateSale.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';
import currency from 'currency.js';

export function useCreateSale() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async (salePayload) => {
            console.log('useCreateSale: Starting sale transaction with payload:', salePayload);

            // --- 0. HANDLE DEMO MODE ---
            if (user?.isDemo) {
                console.log("Demo Mode detected. Simulating transaction...");
                await new Promise(resolve => setTimeout(resolve, 800));

                if (salePayload.paymentMethod === 'Cash') {
                    const shiftKey = `demo_shift_${user.id}`;
                    const storedShift = sessionStorage.getItem(shiftKey);
                    if (storedShift) {
                        const shiftData = JSON.parse(storedShift);
                        shiftData.demo_sales = (shiftData.demo_sales || 0) + salePayload.totalAmount;
                        sessionStorage.setItem(shiftKey, JSON.stringify(shiftData));
                    }
                }

                return {
                    id: `demo-sale-${Date.now()}`,
                    ...salePayload,
                    items: salePayload.items.map(item => ({ ...item, sale_id: `demo-sale-${Date.now()}` }))
                };
            }

            // --- 1. HANDLE CREDIT (UTANG) LOGIC ---
            if (salePayload.paymentMethod === 'Charge') {
                if (!salePayload.customerId) {
                    throw new Error("A registered customer is required for 'Charge to Account' transactions.");
                }

                const { error: creditError } = await supabase.rpc('update_customer_credit', {
                    p_customer_id: salePayload.customerId,
                    p_amount: salePayload.totalAmount
                });

                if (creditError) {
                    console.error('Credit update failed:', creditError);
                    throw new Error(`Failed to update credit balance: ${creditError.message}`);
                }
            }

            // --- 2. Insert Sale Record ---
            const saleDataToInsert = {
                saletimestamp: salePayload.saleTimestamp,
                totalamount: salePayload.totalAmount,
                customerid: salePayload.customerId,
                customername: salePayload.customerName,
                paymentmethod: salePayload.paymentMethod,
                amountreceived: salePayload.paymentMethod === 'Charge' ? 0 : salePayload.amountReceived,
                changegiven: salePayload.paymentMethod === 'Charge' ? 0 : salePayload.changeGiven,
                status: salePayload.paymentMethod === 'Charge' ? 'Unpaid' : salePayload.status,
                created_by: user?.id || null,
            };

            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert(saleDataToInsert)
                .select('id')
                .single();

            if (saleError) {
                console.error('useCreateSale: Error creating sale entry:', saleError);
                throw new Error(`Failed to create sale: ${saleError.message}`);
            }

            const newSaleId = saleData.id;

            // --- 3. Prepare Items (Safely map custom / unlisted items to product_id: null) ---
            const itemsToInsert = salePayload.items.map(item => {
                const base = item.basePrice || item.priceAtSale;
                const unitDiscount = currency(base).subtract(item.priceAtSale).value;
                const totalLineDiscount = currency(unitDiscount).multiply(item.quantity).value;

                const isCustom = Boolean(
                    item.is_custom ||
                    !item.productId ||
                    isNaN(Number(item.productId)) ||
                    String(item.productId).startsWith('custom_')
                );

                return {
                    sale_id: newSaleId,
                    product_id: isCustom ? null : Number(item.productId),
                    product_name: item.productName || item.name,
                    quantity: item.quantity,
                    price_at_sale: item.priceAtSale,
                    subtotal: item.subtotal,
                    cost_at_sale: item.cost_at_sale || 0,
                    notes: item.note || null,
                    discount_amount: Math.max(0, totalLineDiscount),
                    is_custom: isCustom
                };
            });

            if (itemsToInsert.length === 0) {
                console.warn("useCreateSale: Sale created, but no items were included.");
                return { ...saleData, items: [] };
            }

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(itemsToInsert);

            if (itemsError) {
                console.error('useCreateSale: Error inserting sale items:', itemsError);
                throw new Error(`Sale created (ID: ${newSaleId}), but failed to save items: ${itemsError.message}`);
            }

            // --- 4. Decrement Stock (Only for physical tracked catalog products) ---
            for (const item of salePayload.items) {
                const isCustom = Boolean(
                    item.is_custom ||
                    !item.productId ||
                    isNaN(Number(item.productId)) ||
                    String(item.productId).startsWith('custom_')
                );

                if (!isCustom && item.track_stock !== false && item.productId && item.quantity > 0) {
                    const { error: stockError } = await supabase.rpc('decrement_stock', {
                        product_id: Number(item.productId),
                        quantity_sold: item.quantity,
                        staff_id_input: user?.id || null
                    });
                    if (stockError) {
                        console.error('useCreateSale: Failed to decrement stock for product', item.productId, stockError.message);
                    }
                }
            }

            // --- 5. Log Activity ---
            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'SALE',
                description: `Processed POS transaction for ${saleDataToInsert.customername || 'Walk-in'} (₱${saleDataToInsert.totalamount})`
            });

            return { ...saleData, items: itemsToInsert };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['sales', 'active-shift'] });
        },
        onError: (error) => {
            console.error('useCreateSale: Mutation failed:', error);
        }
    });
}