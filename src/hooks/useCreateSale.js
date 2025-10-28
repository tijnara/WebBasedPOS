import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        // 1. The function that performs the API call
        mutationFn: async (salePayload) => {
            console.log('useCreateSale: Starting sale transaction with payload:', salePayload);

            // Step 1: Prepare and insert the main sale data into the 'sales' table
            // This object contains all the summary fields
            const saleDataToInsert = {
                saleTimestamp: salePayload.saleTimestamp,
                totalAmount: salePayload.totalAmount,
                customerId: salePayload.customerId,
                customerName: salePayload.customerName,
                paymentMethod: salePayload.paymentMethod,
                amountReceived: salePayload.amountReceived,
                changeGiven: salePayload.changeGiven,
                status: salePayload.status,
            };

            // Insert into 'sales' and get the new 'id' back
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert(saleDataToInsert) // Insert the main sale data
                .select('id')             // Get the ID of the new sale
                .single();

            if (saleError) {
                console.error('useCreateSale: Error creating sale entry:', saleError);
                throw new Error(`Failed to create sale: ${saleError.message}`);
            }

            const newSaleId = saleData.id;
            console.log('useCreateSale: Sale entry created with ID:', newSaleId);

            // Step 2: Prepare the 'sale_items' records
            // This maps over the cart items from the payload
            const itemsToInsert = salePayload.items.map(item => ({
                saleid: newSaleId, // Use the ID from Step 1
                productid: item.productId,
                productname: item.productName,
                quantity: item.quantity,
                priceatsale: item.priceAtSale,
                subtotal: item.subtotal
            }));

            // Check if there are any items to insert
            if (itemsToInsert.length === 0) {
                console.warn("useCreateSale: Sale created, but no items were included.");
                return { ...saleData, items: [] }; // Return the main sale data
            }

            // Step 3: Insert all 'sale_items' in one batch
            console.log('useCreateSale: Inserting sale items:', itemsToInsert);
            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(itemsToInsert); // Insert the array of items

            if (itemsError) {
                // This is a partial failure. The 'sale' was created, but 'items' failed.
                // In a real production app, you'd use a database transaction (RPC function)
                // to roll back the sale if this step fails.
                console.error('useCreateSale: Error inserting sale items:', itemsError);
                throw new Error(`Sale created (ID: ${newSaleId}), but failed to save items: ${itemsError.message}`);
            }

            console.log('useCreateSale: Sale and items created successfully.');
            // Return the full sale object (ID from saleData, items from itemsToInsert)
            return { ...saleData, items: itemsToInsert };
        },

        // 2. After the mutation succeeds
        onSuccess: (data) => {
            console.log('useCreateSale: Sale created! Invalidating queries.', data);
            // Invalidate 'sales' query to update the History page
            queryClient.invalidateQueries({ queryKey: ['sales'] });

            // Invalidate 'products' query to update stock levels (if you implement that logic)
            // queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            console.error('useCreateSale: Mutation failed:', error);
            // Error toast is handled in POSPage.jsx
        }
    });
}