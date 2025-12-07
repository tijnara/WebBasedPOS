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

function BreakBulk({ products, onSuccess }) {
    // Only show products configured as "Children" (have a parent)
    const childProducts = products.filter(p => p.parent_product_id && p.conversion_rate > 1);
    const { user, addToast } = useStore();

    const handleBreak = async (child) => {
        // Find parent locally to check basic stock availability
        const parent = products.find(p => p.id === child.parent_product_id);
        if (!parent || parent.stock_quantity < 1) {
            addToast({ title: 'No Stock', description: `No ${parent?.name || 'parent pack'} available to open.`, variant: 'destructive' });
            return;
        }
        try {
            const { error } = await supabase.rpc('break_bulk_stock', {
                p_parent_id: parent.id,
                p_child_id: child.id,
                p_quantity_cases: 1,
                p_staff_id: user?.id
            });
            if (error) throw error;
            addToast({
                title: 'Case Opened',
                description: `Converted 1 ${parent.name} into ${child.conversion_rate} ${child.name}s`,
                variant: 'success'
            });
            onSuccess();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <h3 className="font-bold text-blue-900">Unit Conversions</h3>
                <p className="text-sm text-blue-700">Open cases to replenish single units.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childProducts.map(child => {
                    const parent = products.find(p => p.id === child.parent_product_id);
                    return (
                        <Card key={child.id} className="border shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-lg text-gray-800">{child.name}</div>
                                        <div className="text-sm text-gray-500">Stock: {child.stock_quantity} units</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">Rate: {child.conversion_rate}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm">
                                    <span className="text-gray-500">Parent:</span> <span className="font-medium">{parent?.name || 'Unknown'}</span>
                                    <div className="text-xs text-gray-500 mt-1">Available Cases: {parent?.stock_quantity || 0}</div>
                                </div>
                                <Button
                                    onClick={() => handleBreak(child)}
                                    disabled={!parent || parent.stock_quantity < 1}
                                    className="w-full btn--primary"
                                >
                                    Open 1 Case (+{child.conversion_rate})
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
                {childProducts.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        No convertible products found. Go to Product Management to link Single units to Cases.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function InventoryPage() {
    const [barcode, setBarcode] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQty, setAddQty] = useState('');
    const [expiry, setExpiry] = useState('');
    const { user, addToast } = useStore();
    const [mode, setMode] = useState('restock'); // 'restock' or 'adjust'

    // --- FIX: Fetch products for Break Bulk feature ---
    // We use fetchAll: true so we can see all parent/child relationships
    const { data: productsData, refetch } = useProducts({ fetchAll: true });
    const products = productsData?.products || [];
    // --------------------------------------------------

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
            refetch(); // Refresh local list
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
            refetch(); // Refresh local list
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
                <Button onClick={() => setMode('convert')} variant={mode === 'convert' ? 'primary' : 'outline'}>Break Bulk</Button>
            </div>

            {mode !== 'convert' && (
                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder="Scan Barcode"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}>Search</Button>
                </div>
            )}

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

            {mode === 'convert' && (
                <BreakBulk products={products} onSuccess={refetch} />
            )}
        </div>
    );
}