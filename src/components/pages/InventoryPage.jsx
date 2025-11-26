import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabaseClient';
import { Button, Input, Card, CardContent } from '../ui';
import { useStore } from '../../store/useStore';

export default function InventoryPage() {
    const [barcode, setBarcode] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQty, setAddQty] = useState('');
    const [expiry, setExpiry] = useState('');
    const { user, addToast } = useStore();

    // Fetch product when barcode is entered (you can adapt useProducts logic here)
    const handleSearch = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('barcode', barcode)
            .single();

        if (data) setSelectedProduct(data);
        else addToast({ title: 'Product not found', variant: 'destructive' });
    };

    const handleRestock = async () => {
        if (!selectedProduct || !addQty) return;

        const qty = parseInt(addQty);

        // 1. Log Movement
        const { error: moveError } = await supabase.from('stock_movements').insert({
            product_id: selectedProduct.id,
            quantity_change: qty,
            type: 'restock',
            expiry_date: expiry || null,
            staff_id: user?.id
        });

        // 2. Update Product Stock
        const { error: prodError } = await supabase.from('products')
            .update({ stock_quantity: selectedProduct.stock_quantity + qty })
            .eq('id', selectedProduct.id);

        if (!moveError && !prodError) {
            addToast({ title: 'Success', description: `Added ${qty} to ${selectedProduct.name}`, variant: 'success' });
            setSelectedProduct(null);
            setBarcode('');
            setAddQty('');
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Receive Inventory</h1>
            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="Scan Barcode"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>Search</Button>
            </div>

            {selectedProduct && (
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                        <p className="text-gray-500">Current Stock: {selectedProduct.stock_quantity}</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Quantity to Add</label>
                                <Input type="number" value={addQty} onChange={e => setAddQty(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Expiry Date</label>
                                <Input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
                            </div>
                        </div>

                        <Button onClick={handleRestock} className="w-full btn--success">Confirm Restock</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

