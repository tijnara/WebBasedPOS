import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabaseClient';
import { Button, Input, Card, CardContent, Select } from '../ui';
import { useStore } from '../../store/useStore';

function InventoryAdjustment({ product, onAdjust, onCancel }) {
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('damaged');
    const { addToast } = useStore();

    const handleAdjust = async () => {
        const adjQty = parseInt(quantity);
        if (isNaN(adjQty) || adjQty <= 0) {
            addToast({ title: 'Invalid Quantity', variant: 'destructive' });
            return;
        }
        await onAdjust(adjQty, reason);
    };

    return (
        <Card>
            <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Adjust Stock: {product.name}</h2>
                <p className="text-gray-500">Current Stock: {product.stock_quantity}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Quantity to Remove</label>
                        <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Reason</label>
                        <Select value={reason} onChange={e => setReason(e.target.value)}>
                            <option value="damaged">Damaged</option>
                            <option value="expired">Expired</option>
                            <option value="theft">Theft/Loss</option>
                        </Select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={onCancel} variant="outline">Cancel</Button>
                    <Button onClick={handleAdjust} className="w-full btn--danger">Confirm Adjustment</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function InventoryPage() {
    const [barcode, setBarcode] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQty, setAddQty] = useState('');
    const [expiry, setExpiry] = useState('');
    const { user, addToast } = useStore();
    const [mode, setMode] = useState('restock'); // 'restock' or 'adjust'

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

    const handleAdjustment = async (quantity, reason) => {
        if (!selectedProduct || !quantity) return;

        const qty = parseInt(quantity);

        // 1. Log Movement (negative quantity)
        const { error: moveError } = await supabase.from('stock_movements').insert({
            product_id: selectedProduct.id,
            quantity_change: -qty,
            type: reason, // 'damaged', 'expired', 'theft'
            staff_id: user?.id
        });

        // 2. Update Product Stock
        const { error: prodError } = await supabase.rpc('decrement_stock', {
            p_product_id: selectedProduct.id,
            p_quantity: qty
        });

        if (!moveError && !prodError) {
            addToast({ title: 'Success', description: `Removed ${qty} of ${selectedProduct.name}`, variant: 'success' });
            setSelectedProduct(null);
            setBarcode('');
            setMode('restock');
        } else {
            addToast({ title: 'Error', description: moveError?.message || prodError?.message, variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
            <div className="flex gap-2 mb-4">
                <Button onClick={() => setMode('restock')} variant={mode === 'restock' ? 'primary' : 'outline'}>Restock</Button>
                <Button onClick={() => setMode('adjust')} variant={mode === 'adjust' ? 'primary' : 'outline'}>Adjust Stock</Button>
            </div>
            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="Scan Barcode"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>Search</Button>
            </div>

            {selectedProduct && mode === 'restock' && (
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

            {selectedProduct && mode === 'adjust' && (
                <InventoryAdjustment
                    product={selectedProduct}
                    onAdjust={handleAdjustment}
                    onCancel={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
}
