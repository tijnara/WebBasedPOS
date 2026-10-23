// src/hooks/useSales.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';
import currency from 'currency.js';

const MOCK_SALES = [
    {
        id: 'mock-s-1',
        saleTimestamp: new Date('2026-10-23T09:00:00'),
        totalAmount: 60.00,
        amountReceived: 100.00,
        customerId: 'mock-c-1',
        customerName: 'Demo Customer A',
        sale_items: [
            { productName: 'Mock Alkaline (5 Gal)', productPrice: 35.00, quantity: 1 },
            { productName: 'Mock Purified (5 Gal)', productPrice: 25.00, quantity: 1 }
        ],
        items: [
            { productName: 'Mock Alkaline (5 Gal)', productPrice: 35.00, quantity: 1 },
            { productName: 'Mock Purified (5 Gal)', productPrice: 25.00, quantity: 1 }
        ],
        paymentMethod: 'Cash',
        status: 'Completed',
        createdBy: 'Demo Staff A'
    },
    {
        id: 'mock-s-2',
        saleTimestamp: new Date('2026-10-22T15:30:00'),
        totalAmount: 99.00,
        amountReceived: 100.00,
        customerId: 'mock-c-2',
        customerName: 'Demo Customer B',
        sale_items: [
            { productName: 'Mock Product B', productPrice: 99.00, quantity: 1 }
        ],
        items: [
            { productName: 'Mock Product B', productPrice: 99.00, quantity: 1 }
        ],
        paymentMethod: 'GCash',
        status: 'Completed',
        createdBy: 'Demo Staff B'
    }
];

export function useSales({ searchTerm, startDate, endDate, productName, productId, page = 1, itemsPerPage = 10, fetchAll = false } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['sales', isDemo, searchTerm, startDate, endDate, productName, productId, page, itemsPerPage, fetchAll],
        queryFn: async () => {
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                let filtered = MOCK_SALES;
                if (searchTerm) {
                    const term = searchTerm.trim().toLowerCase();
                    filtered = filtered.filter(s =>
                        (s.customerName && s.customerName.toLowerCase().includes(term)) ||
                        (s.status && s.status.toLowerCase().includes(term)) ||
                        (s.paymentMethod && s.paymentMethod.toLowerCase().includes(term)) ||
                        (s.createdBy && s.createdBy.toLowerCase().includes(term))
                    );
                }
                if (productId) {
                    filtered = filtered.filter(s =>
                        s.sale_items && s.sale_items.some(i => String(i.product_id) === String(productId))
                    );
                } else if (productName) {
                    const pName = productName.trim().toLowerCase();
                    filtered = filtered.filter(s =>
                        s.sale_items && s.sale_items.some(i => i.productName.toLowerCase().includes(pName))
                    );
                }
                if (startDate) {
                    filtered = filtered.filter(s => s.saleTimestamp >= startDate);
                }
                if (endDate) {
                    filtered = filtered.filter(s => s.saleTimestamp <= endDate);
                }

                const totalCount = filtered.length;
                const totalPages = fetchAll ? 1 : Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = fetchAll ? 0 : (page - 1) * itemsPerPage;
                const endIdx = fetchAll ? totalCount : startIdx + itemsPerPage;
                const paginated = filtered.slice(startIdx, endIdx);
                return { sales: paginated, totalPages, totalCount };
            }

            try {
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage - 1;

                const hasProductFilter = productId || productName;
                const selectString = `
                    *,
                    sale_items${hasProductFilter ? '!inner' : ''} ( *, product:products ( name, price, track_stock ) ),
                    users:created_by ( name, color )
                `;

                let query = supabase
                    .from('sales')
                    .select(selectString, { count: 'exact' })
                    .order('saletimestamp', { ascending: false });

                if (!fetchAll) {
                    query = query.range(startIndex, endIndex);
                }

                if (searchTerm) {
                    const term = searchTerm.trim().toLowerCase();
                    query = query.or(
                        `customername.ilike.%${term}%,status.ilike.%${term}%,paymentmethod.ilike.%${term}%`
                    );
                }
                if (productId) {
                    query = query.eq('sale_items.product_id', productId);
                } else if (productName) {
                    const pName = productName.trim().toLowerCase();
                    query = query.ilike('sale_items.product_name', `%${pName}%`);
                }
                if (startDate) {
                    query = query.gte('saletimestamp', startDate.toISOString());
                }
                if (endDate) {
                    query = query.lte('saletimestamp', endDate.toISOString());
                }

                const { data, error, count } = await query;
                if (error) {
                    console.error("useSales Error:", error);
                    throw error;
                }

                if (!data || !Array.isArray(data)) return { sales: [], totalPages: 1, totalCount: 0 };

                const sales = data.map(s => ({
                    id: s.id,
                    saleTimestamp: s.saletimestamp ? new Date(s.saletimestamp) : new Date(),
                    totalAmount: currency(s.totalamount).value || 0,
                    amountReceived: currency(s.amountreceived).value || 0,
                    changeGiven: currency(s.changegiven).value || 0,
                    customerId: s.customerid || s.customerId,
                    customerName: s.customername || 'Walk-in',
                    createdBy: s.users?.name || s.created_by || 'N/A',
                    userColor: s.users?.color || '#374151',
                    sale_items: Array.isArray(s.sale_items) ? s.sale_items.map(item => ({
                        ...item,
                        productId: item.product_id,
                        productName: item.product?.name || item.product_name || '',
                        price_at_sale: item.price_at_sale || 0,
                        track_stock: item.product?.track_stock
                    })) : [],
                    paymentMethod: s.paymentmethod || 'Cash',
                    status: s.status || 'Completed'
                }));

                const totalCount = count || 0;
                const totalPages = fetchAll ? 1 : Math.max(1, Math.ceil(totalCount / itemsPerPage));
                return { sales, totalPages, totalCount };
            } catch (error) {
                throw error;
            }
        },
        staleTime: 1000 * 60 * 2,
    });
}

export function useSettleSale() {
    const queryClient = useQueryClient();
    const { addToast, user } = useStore();

    return useMutation({
        mutationFn: async ({ saleId, customerId, amount }) => {
            const payAmount = Number(amount);

            // 1. Update Sale Status
            const { error: saleError } = await supabase
                .from('sales')
                .update({
                    status: 'Completed',
                    amountreceived: payAmount,
                    changegiven: 0
                })
                .eq('id', saleId);

            if (saleError) throw saleError;

            // 2. Settle customer_debts record if linked
            await supabase
                .from('customer_debts')
                .update({
                    remaining_balance: 0,
                    status: 'Paid'
                })
                .eq('sale_id', saleId);

            // 3. Reduce Customer Debt
            if (customerId) {
                const { data: cust } = await supabase
                    .from('customers')
                    .select('credit_balance')
                    .eq('id', customerId)
                    .single();

                if (cust) {
                    const newBal = Math.max(0, Number(cust.credit_balance || 0) - payAmount);
                    await supabase
                        .from('customers')
                        .update({ credit_balance: newBal })
                        .eq('id', customerId);
                }
            }

            // 4. Log Audit
            logActivity({
                user,
                action: 'SETTLE_SALE',
                entity_type: 'SALE',
                description: `Settled unpaid transaction #${saleId} (₱${payAmount.toFixed(2)})`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['customer_debts'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
            addToast({ title: 'Payment Settled', description: 'Transaction updated to Completed.', variant: 'success' });
        }
    });
}

// Admin: Delete Transaction with inventory restocking and utang reversal
export function useDeleteSale() {
    const queryClient = useQueryClient();
    const { addToast, user } = useStore();

    return useMutation({
        mutationFn: async (sale) => {
            const saleId = sale.id;

            // 1. Restock physical tracked items
            if (Array.isArray(sale.sale_items)) {
                for (const item of sale.sale_items) {
                    if (item.product_id && item.track_stock !== false && Number(item.quantity) > 0) {
                        const { data: prod } = await supabase
                            .from('products')
                            .select('stock_quantity, track_stock')
                            .eq('id', item.product_id)
                            .single();

                        if (prod && prod.track_stock !== false && prod.stock_quantity !== null) {
                            await supabase
                                .from('products')
                                .update({
                                    stock_quantity: Number(prod.stock_quantity) + Number(item.quantity)
                                })
                                .eq('id', item.product_id);
                        }
                    }
                }
            }

            // 2. Reverse credit / utang if sale was charged
            if (sale.paymentMethod === 'Charge') {
                // Delete from customer_debts ledger
                await supabase
                    .from('customer_debts')
                    .delete()
                    .eq('sale_id', saleId);

                // Deduct from customer credit balance
                if (sale.customerId) {
                    const { data: cust } = await supabase
                        .from('customers')
                        .select('credit_balance')
                        .eq('id', sale.customerId)
                        .single();

                    if (cust) {
                        const newBal = Math.max(0, Number(cust.credit_balance || 0) - Number(sale.totalAmount || 0));
                        await supabase
                            .from('customers')
                            .update({ credit_balance: newBal })
                            .eq('id', sale.customerId);
                    }
                }
            }

            // 3. Delete sale items
            const { error: itemsErr } = await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', saleId);

            if (itemsErr) throw itemsErr;

            // 4. Delete the sale record
            const { error: saleErr } = await supabase
                .from('sales')
                .delete()
                .eq('id', saleId);

            if (saleErr) throw saleErr;

            // 5. Activity Log Audit
            logActivity({
                user,
                action: 'DELETE_SALE',
                entity_type: 'SALE',
                description: `Admin ${user?.name || 'Admin'} deleted sale #${saleId} (Customer: ${sale.customerName}, ₱${Number(sale.totalAmount).toFixed(2)})`
            });

            return saleId;
        },
        onSuccess: (saleId) => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['customer_debts'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
            queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
            addToast({ title: 'Sale Deleted', description: `Transaction #${saleId} has been deleted and inventory restored.`, variant: 'success' });
        },
        onError: (err) => {
            addToast({ title: 'Deletion Failed', description: err.message, variant: 'destructive' });
        }
    });
}

// Admin: Edit Transaction details (Status, Payment Method, Customer, Notes)
export function useUpdateSale() {
    const queryClient = useQueryClient();
    const { addToast, user } = useStore();

    return useMutation({
        mutationFn: async ({ saleId, originalSale, updates }) => {
            const newPaymentMethod = updates.paymentMethod || originalSale.paymentMethod;
            const newStatus = updates.status || originalSale.status;
            const newAmountReceived = updates.amountReceived !== undefined ? Number(updates.amountReceived) : originalSale.amountReceived;
            const newChangeGiven = updates.changeGiven !== undefined ? Number(updates.changeGiven) : originalSale.changeGiven;
            const newCustomerName = updates.customerName || originalSale.customerName;

            // 1. Handle payment method transition (Charge <-> Cash/GCash)
            if (originalSale.paymentMethod === 'Charge' && newPaymentMethod !== 'Charge') {
                // Was utang, converted to paid: delete or settle debt
                await supabase
                    .from('customer_debts')
                    .update({ status: 'Paid', remaining_balance: 0 })
                    .eq('sale_id', saleId);

                if (originalSale.customerId) {
                    const { data: cust } = await supabase.from('customers').select('credit_balance').eq('id', originalSale.customerId).single();
                    if (cust) {
                        const newBal = Math.max(0, Number(cust.credit_balance || 0) - Number(originalSale.totalAmount || 0));
                        await supabase.from('customers').update({ credit_balance: newBal }).eq('id', originalSale.customerId);
                    }
                }
            } else if (originalSale.paymentMethod !== 'Charge' && newPaymentMethod === 'Charge') {
                // Was paid, converted to utang: add debt
                if (originalSale.customerId) {
                    await supabase.from('customer_debts').insert({
                        customer_id: originalSale.customerId,
                        sale_id: saleId,
                        amount: originalSale.totalAmount,
                        remaining_balance: originalSale.totalAmount,
                        staff_id: user?.id,
                        staff_name: user?.name || 'Admin',
                        incurred_at: originalSale.saleTimestamp?.toISOString?.() || new Date().toISOString(),
                        status: 'Unpaid',
                        notes: `Converted to Charge by Admin ${user?.name || ''}`
                    });

                    const { data: cust } = await supabase.from('customers').select('credit_balance').eq('id', originalSale.customerId).single();
                    if (cust) {
                        await supabase.from('customers').update({ credit_balance: Number(cust.credit_balance || 0) + Number(originalSale.totalAmount) }).eq('id', originalSale.customerId);
                    }
                }
            }

            // 2. Update the sale record
            const { error: updateErr } = await supabase
                .from('sales')
                .update({
                    paymentmethod: newPaymentMethod,
                    status: newStatus,
                    amountreceived: newAmountReceived,
                    changegiven: newChangeGiven,
                    customername: newCustomerName,
                    ...(updates.saleTimestamp ? { saletimestamp: updates.saleTimestamp.toISOString() } : {})
                })
                .eq('id', saleId);

            if (updateErr) throw updateErr;

            // 3. Log Audit
            logActivity({
                user,
                action: 'UPDATE_SALE',
                entity_type: 'SALE',
                description: `Admin ${user?.name || 'Admin'} updated sale #${saleId} (Status: ${newStatus}, Payment: ${newPaymentMethod})`
            });

            return saleId;
        },
        onSuccess: (saleId) => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['customer_debts'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
            addToast({ title: 'Sale Updated', description: `Transaction #${saleId} details updated successfully.`, variant: 'success' });
        },
        onError: (err) => {
            addToast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
        }
    });
}