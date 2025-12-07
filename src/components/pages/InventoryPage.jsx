import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabaseClient';
import { Button, Input, Card, CardContent, Select } from '../ui';
import { useStore } from '../../store/useStore';
import { PackageIcon } from '../Icons'; // <-- Fixed: Import from your local Icons file

// --- Helper Icon: Search ---
const SearchIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

// --- Sub-Component: Adjustment Form ---
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
        <Card className="animate-in fade-in slide-in-from-bottom-4">
            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-red-700">Adjust Stock (Remove)</h2>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-gray-600">Current Stock: <span className="font-mono font-bold">{product.stock}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Quantity to Remove</label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Reason</label>
                        <Select value={reason} onChange={e => setReason(e.target.value)}>
                            <option value="damaged">Damaged</option>
                            <option value="expired">Expired</option>
                            <option value="theft">Theft/Loss</option>
                            <option value="consumed">Staff Consumption</option>
                        </Select>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button onClick={onCancel} variant="outline" className="w-1/3">Back</Button>
                    <Button onClick={handleAdjust} className="w-2/3 btn--danger">Confirm Adjustment</Button>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Sub-Component: Break Bulk Grid ---
function BreakBulk({ products, onSuccess }) {
    const childProducts = products.filter(p => p.parent_product_id && p.conversion_rate > 1);
    const { user, addToast } = useStore();

    const handleBreak = async (child) => {
        const parent = products.find(p => p.id === child.parent_product_id);
        if (!parent || parent.stock < 1) {
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
                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                    <PackageIcon className="w-5 h-5"/> Bulk Conversion
                </h3>
                <p className="text-sm text-blue-700">Open larger packs (Cases) to sell individual units (Pieces).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childProducts.map(child => {
                    const parent = products.find(p => p.id === child.parent_product_id);
                    const canBreak = parent && parent.stock >= 1;

                    return (
                        <Card key={child.id} className={`border shadow-sm ${canBreak ? 'bg-white' : 'bg-gray-50 opacity-75'}`}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-lg text-gray-800">{child.name}</div>
                                        <div className="text-sm text-gray-500">Current Stock: {child.stock}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            1 Case = {child.conversion_rate} Units
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-100 p-3 rounded-md mb-4 text-sm border border-gray-200">
                                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Source (Parent)</div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900">{parent?.name || 'Unknown'}</span>
                                        <span className={`font-bold ${parent?.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {parent?.stock || 0} avail
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleBreak(child)}
                                    disabled={!canBreak}
                                    className={`w-full ${canBreak ? 'btn--primary' : 'bg-gray-300 cursor-not-allowed'}`}
                                >
                                    {canBreak ? `Open 1 Case (+${child.conversion_rate})` : 'No Cases Available'}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
                {childProducts.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 font-medium">No convertible products found.</p>
                        <p className="text-gray-400 text-sm mt-1">Go to Product Management and link single items to parent cases.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function InventoryPage() {
    const [barcode, setBarcode] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQty, setAddQty] = useState('');
    const [expiry, setExpiry] = useState('');
    const { user, addToast } = useStore();
    const [mode, setMode] = useState('restock'); // 'restock', 'adjust', 'convert'

    // Fetch all products so we can list them
    const { data: productsData, refetch } = useProducts({ fetchAll: true });
    const products = productsData?.products || [];

    // Filter products for the list view
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );

    // Handle searching via barcode specifically
    const handleBarcodeSearch = async () => {
        const found = products.find(p => p.barcode === barcode);
        if (found) {
            setSelectedProduct(found);
            setBarcode(''); // clear input
        } else {
            addToast({ title: 'Product not found', variant: 'destructive' });
        }
    };

    const handleRestock = async () => {
        if (!selectedProduct || !addQty) return;
        const qty = parseInt(addQty);

        const { error: moveError } = await supabase.from('stock_movements').insert({
            product_id: selectedProduct.id,
            quantity_change: qty,
            type: 'restock',
            expiry_date: expiry || null,
            staff_id: user?.id
        });

        const { error: prodError } = await supabase.from('products')
            .update({ stock_quantity: selectedProduct.stock + qty })
            .eq('id', selectedProduct.id);

        if (!moveError && !prodError) {
            addToast({ title: 'Success', description: `Added ${qty} to ${selectedProduct.name}`, variant: 'success' });
            setSelectedProduct(null);
            setAddQty('');
            setExpiry('');
            refetch();
        } else {
            addToast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
        }
    };

    const handleAdjustment = async (quantity, reason) => {
        if (!selectedProduct || !quantity) return;
        const qty = parseInt(quantity);

        const { error: moveError } = await supabase.from('stock_movements').insert({
            product_id: selectedProduct.id,
            quantity_change: -qty,
            type: reason,
            staff_id: user?.id
        });

        const { error: prodError } = await supabase.rpc('decrement_stock', {
            p_product_id: selectedProduct.id,
            p_quantity: qty
        });

        if (!moveError && !prodError) {
            addToast({ title: 'Success', description: `Removed ${qty} from stock`, variant: 'success' });
            setSelectedProduct(null);
            refetch();
        } else {
            addToast({ title: 'Error', description: moveError?.message || prodError?.message, variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">

            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setMode('restock'); setSelectedProduct(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'restock' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Restock (Add)
                    </button>
                    <button
                        onClick={() => { setMode('adjust'); setSelectedProduct(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'adjust' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Adjust (Remove)
                    </button>
                    <button
                        onClick={() => { setMode('convert'); setSelectedProduct(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'convert' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Break Bulk
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}

            {/* 1. BREAK BULK MODE */}
            {mode === 'convert' && (
                <BreakBulk products={products} onSuccess={refetch} />
            )}

            {/* 2. RESTOCK & ADJUST MODES */}
            {mode !== 'convert' && (
                <>
                    {/* If NO product selected, show List & Search */}
                    {!selectedProduct && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <SearchIcon className="h-4 w-4" />
                                    </div>
                                    <Input
                                        placeholder="Search product by name or barcode..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-500">Product Name</th>
                                        <th className="px-4 py-3 font-medium text-gray-500">Stock</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                    {filteredProducts.slice(0, 10).map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                                            <td className={`px-4 py-3 ${product.stock <= product.minStock ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                {product.stock}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedProduct(product)}
                                                >
                                                    Select
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                                No products found matching "{searchTerm}"
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* If Product IS selected: Show Forms */}
                    {selectedProduct && mode === 'restock' && (
                        <Card className="animate-in fade-in slide-in-from-bottom-4">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-blue-700">Restock (Add Inventory)</h2>
                                    <Button variant="ghost" onClick={() => setSelectedProduct(null)}>Cancel</Button>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                                    <p className="text-gray-600">Current Stock: <span className="font-mono font-bold">{selectedProduct.stock}</span></p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Quantity to Add</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={addQty}
                                            onChange={e => setAddQty(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Expiry Date (Optional)</label>
                                        <Input
                                            type="date"
                                            value={expiry}
                                            onChange={e => setExpiry(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button onClick={() => setSelectedProduct(null)} variant="outline" className="w-1/3">Back</Button>
                                    <Button onClick={handleRestock} className="w-2/3 btn--success">Confirm Restock</Button>
                                </div>
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
                </>
            )}
        </div>
    );
}