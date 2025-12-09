// src/hooks/useCreateSale.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
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
                await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

                // Return mock success response
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

                // Call RPC to increment balance (Positive amount adds to debt)
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

            // --- 3. Prepare Items with Notes & Discounts ---
            const itemsToInsert = salePayload.items.map(item => {
                const base = item.basePrice || item.priceAtSale;
                const unitDiscount = currency(base).subtract(item.priceAtSale).value;
                const totalLineDiscount = currency(unitDiscount).multiply(item.quantity).value;

                return {
                    sale_id: newSaleId,
                    product_id: item.productId,
                    product_name: item.productName,
                    quantity: item.quantity,
                    price_at_sale: item.priceAtSale,
                    subtotal: item.subtotal,
                    cost_at_sale: item.cost_at_sale || 0,
                    notes: item.note || null,
                    discount_amount: Math.max(0, totalLineDiscount)
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

            // --- 4. Decrement Stock ---
            for (const item of salePayload.items) {
                if (item.productId && item.quantity > 0) {
                    const { error: stockError } = await supabase.rpc('decrement_stock', {
                        product_id: item.productId,
                        quantity_sold: item.quantity,
                        staff_id_input: user?.id || null
                    });
                    if (stockError) {
                        console.error('useCreateSale: Failed to decrement stock for product', item.productId, stockError.message);
                    }
                }
            }

            return { ...saleData, items: itemsToInsert };
        },

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onError: (error) => {
            console.error('useCreateSale: Mutation failed:', error);
        }
    });
}