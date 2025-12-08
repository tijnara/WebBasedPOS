// src/components/pages/InventoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useProducts } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabaseClient';
import { Button, Input, Card, CardContent, Select } from '../ui';
import { useStore } from '../../store/useStore';
import { PackageIcon } from '../Icons';
import Pagination from '../Pagination';

// --- Icons ---
const SearchIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ArrowRightIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

// --- Sub-Component: Adjustment Form (Compact) ---
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
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="shadow-lg border-0 ring-1 ring-gray-100 overflow-hidden">
                <div className="bg-red-50 px-5 py-3 border-b border-red-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-base font-bold text-red-800">Remove Stock</h2>
                        <p className="text-red-600 text-xs">Record loss, damage, or usage</p>
                    </div>
                    <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
                        <span className="text-lg font-bold">-</span>
                    </div>
                </div>

                <CardContent className="p-5 space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="h-10 w-10 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                            <PackageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Current Stock:</span>
                                <span className="font-mono font-bold text-gray-900 bg-gray-200 px-1.5 py-0.5 rounded">{product.stock}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Quantity to Remove</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                autoFocus
                                className="text-base font-medium h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Reason</label>
                            <Select
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="h-10 text-sm"
                            >
                                <option value="damaged">Damaged / Broken</option>
                                <option value="expired">Expired</option>
                                <option value="theft">Theft / Loss</option>
                                <option value="consumed">Staff Consumption</option>
                                <option value="correction">Inventory Correction</option>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button onClick={onCancel} variant="outline" className="flex-1 h-10 text-sm">Cancel</Button>
                        <Button onClick={handleAdjust} className="flex-1 h-10 text-sm btn--danger shadow-sm">
                            Confirm Removal
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Sub-Component: Restock Form (Compact) ---
function RestockForm({ product, onRestock, onCancel }) {
    const [addQty, setAddQty] = useState('');
    const [expiry, setExpiry] = useState('');
    const { addToast } = useStore();

    const handleConfirm = () => {
        const qty = parseInt(addQty);
        if (isNaN(qty) || qty <= 0) {
            addToast({ title: 'Invalid Quantity', variant: 'destructive' });
            return;
        }
        onRestock(qty, expiry);
    };

    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="shadow-lg border-0 ring-1 ring-gray-100 overflow-hidden">
                <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-base font-bold text-blue-800">Restock Inventory</h2>
                        <p className="text-blue-600 text-xs">Add new stock from supplier</p>
                    </div>
                    <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                        <span className="text-lg font-bold">+</span>
                    </div>
                </div>

                <CardContent className="p-5 space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="h-10 w-10 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                            <PackageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Current Stock:</span>
                                <span className="font-mono font-bold text-gray-900 bg-gray-200 px-1.5 py-0.5 rounded">{product.stock}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Quantity to Add</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={addQty}
                                onChange={e => setAddQty(e.target.value)}
                                autoFocus
                                className="text-base font-medium h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Expiry Date (Optional)</label>
                            <Input
                                type="date"
                                value={expiry}
                                onChange={e => setExpiry(e.target.value)}
                                className="h-10 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button onClick={onCancel} variant="outline" className="flex-1 h-10 text-sm">Cancel</Button>
                        <Button onClick={handleConfirm} className="flex-1 h-10 text-sm btn--success shadow-sm">
                            Confirm Restock
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Sub-Component: Break Bulk Grid (Compact) ---
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

    if (childProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-50 p-3 rounded-full mb-3">
                    <PackageIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">No Convertible Products</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-md text-center">
                    Go to Product Management and link single items to parent cases (e.g., Bottle linked to Case) to enable bulk breaking.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in">
            <div className="bg-gradient-to-r from-violet-50 to-white p-4 rounded-xl border border-violet-100 flex items-start gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm text-primary">
                    <PackageIcon className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-bold text-primary text-base">Bulk Conversion</h3>
                    <p className="text-gray-600 text-xs mt-0.5">
                        Open larger packs (Parent) to restock individual units (Child).
                        Stock will automatically deduct from parent and add to child.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childProducts.map(child => {
                    const parent = products.find(p => p.id === child.parent_product_id);
                    const canBreak = parent && parent.stock >= 1;

                    return (
                        <Card key={child.id} className={`group hover:shadow-md transition-all duration-200 border-0 ring-1 ring-gray-200 ${!canBreak ? 'opacity-70 bg-gray-50' : 'bg-white'}`}>
                            <CardContent className="p-0">
                                {/* Header / Child Info */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-base text-gray-900 leading-tight">{child.name}</div>
                                        <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                            x{child.conversion_rate} Units
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-3">Current Stock: <span className="font-semibold text-gray-700">{child.stock}</span></div>

                                    {/* Parent Source Box */}
                                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 relative">
                                        <div className="absolute -top-2 left-2.5 bg-white px-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider border border-gray-100 rounded-sm">
                                            Source (Parent)
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-medium text-gray-800 text-xs truncate pr-2">{parent?.name || 'Unknown'}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${parent?.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {parent?.stock || 0} left
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="px-4 pb-4">
                                    <Button
                                        onClick={() => handleBreak(child)}
                                        disabled={!canBreak}
                                        className={`w-full h-9 text-sm shadow-sm ${canBreak ? 'btn--primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200'}`}
                                    >
                                        {canBreak ? (
                                            <span className="flex items-center gap-2">
                                                Open 1 Case <ArrowRightIcon className="w-3 h-3" /> <span className="font-bold">+{child.conversion_rate}</span>
                                            </span>
                                        ) : (
                                            'No Cases Available'
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function InventoryPage() {
    const router = useRouter();
    // --- UPDATED STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Added debounce
    const [currentPage, setCurrentPage] = useState(1); // Added pagination state
    const itemsPerPage = 10;

    const [selectedProduct, setSelectedProduct] = useState(null);
    const { user, addToast } = useStore();
    const [mode, setMode] = useState('restock'); // 'restock', 'adjust', 'convert'

    const { restockProductId } = router.query;

    useEffect(() => {
        const fetchProductForRestock = async () => {
            if (!restockProductId) return;

            // Use Supabase directly to fetch specific product since it might not be in the current paginated list
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', restockProductId)
                .single();

            if (data && !error) {
                const formattedProduct = {
                    id: data.id,
                    name: data.name,
                    stock: data.stock_quantity,
                };
                setSelectedProduct(formattedProduct);
                setMode('restock');

                // Optional: remove the query param so refresh doesn't trigger it again
                router.replace('/inventory', undefined, { shallow: true });
            }
        };

        if (router.isReady && restockProductId) {
            fetchProductForRestock();
        }
    }, [router.isReady, restockProductId, router]);

    // --- DEBOUNCE EFFECT ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset page on search
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- UPDATED QUERY ---
    // Fetch all ONLY if mode is 'convert' (Break Bulk needs parent links), otherwise use pagination
    const { data: productsData, refetch, isLoading } = useProducts({
        searchTerm: debouncedSearchTerm,
        page: currentPage,
        itemsPerPage: itemsPerPage,
        fetchAll: mode === 'convert' // Optimization: Only fetch all for conversion mode
    });

    const products = productsData?.products || [];
    const totalPages = productsData?.totalPages || 1;

    // Filter logic is now handled by the hook (server-side) EXCEPT for 'convert' mode
    // If 'convert' mode, products contains ALL, so filtering is optional/client-side if needed,
    // but typically BreakBulk view shows specialized cards.
    // For 'restock'/'adjust' modes, 'products' is already the paginated slice.

    const handleRestock = async (qty, expiry) => {
        if (!selectedProduct) return;

        const { error: moveError } = await supabase.from('stock_movements').insert({
            product_id: selectedProduct.id,
            quantity_change: qty,
            type: 'restock',
            expiry_date: expiry || null,
            staff_id: user?.id
        });

        const { error: prodError } = await supabase.rpc('increment_stock', {
            p_product_id: selectedProduct.id,
            p_quantity: qty
        });

        if (!moveError && !prodError) {
            addToast({ title: 'Success', description: `Added ${qty} to ${selectedProduct.name}`, variant: 'success' });
            setSelectedProduct(null);
            refetch();
        } else {
            console.error(moveError, prodError);
            addToast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
        }
    };

    const handleAdjustment = async (qty, reason) => {
        if (!selectedProduct) return;

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
            console.error(moveError, prodError);
            addToast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
        }
    };

    // Helper for tabs
    const TabButton = ({ id, label, active }) => (
        <button
            onClick={() => {
                setMode(id);
                setSelectedProduct(null);
                setSearchTerm('');
                setCurrentPage(1); // Reset page on tab switch
            }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                active
                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5 font-semibold'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
                    <p className="text-gray-500 text-xs mt-0.5">Track stock, manage restocks, and handle adjustments.</p>
                </div>

                {/* Compact Segmented Control (Auto-width) */}
                <div className="flex bg-gray-100/80 p-1 rounded-lg w-fit">
                    <TabButton id="restock" label="Restock" active={mode === 'restock'} />
                    <TabButton id="adjust" label="Adjust" active={mode === 'adjust'} />
                    <TabButton id="convert" label="Break Bulk" active={mode === 'convert'} />
                </div>
            </div>

            {/* CONTENT AREA */}

            {/* 1. BREAK BULK MODE (Uses fetchAll=true) */}
            {mode === 'convert' && (
                <BreakBulk products={products} onSuccess={refetch} />
            )}

            {/* 2. RESTOCK & ADJUST MODES (Paginated) */}
            {mode !== 'convert' && (
                <>
                    {/* If NO product selected, show List & Search */}
                    {!selectedProduct && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            {/* Search Bar */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <SearchIcon className="h-4 w-4" />
                                </div>
                                <Input
                                    placeholder={`Search product to ${mode === 'restock' ? 'restock' : 'adjust'}...`}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 text-sm shadow-sm border-gray-200 focus:border-primary focus:ring-primary rounded-lg"
                                />
                            </div>

                            {/* Product List Table */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">Product Name</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">Current Stock</th>
                                            <th className="px-4 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                        {isLoading ? (
                                            <tr><td colSpan="4" className="px-4 py-8 text-center text-muted">Loading inventory...</td></tr>
                                        ) : products.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <SearchIcon className="h-6 w-6 text-gray-300" />
                                                        <p className="text-xs">No products found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map(product => {
                                                // Status Logic
                                                const isLow = product.stock <= product.minStock;
                                                const isOut = product.stock === 0;

                                                return (
                                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {product.name}
                                                            {product.barcode && <div className="text-[10px] text-gray-400 font-mono">{product.barcode}</div>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isOut ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Out</span>
                                                            ) : isLow ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Low</span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">OK</span>
                                                            )}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-mono font-bold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                                                            {product.stock}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant={mode === 'restock' ? 'primary' : 'outline'}
                                                                onClick={() => setSelectedProduct(product)}
                                                                className={`h-8 text-xs px-3 ${mode === 'adjust' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'btn--primary shadow-sm'}`}
                                                            >
                                                                {mode === 'restock' ? 'Select' : 'Adjust'}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={page => setCurrentPage(page)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Forms */}
                    {selectedProduct && mode === 'restock' && (
                        <RestockForm
                            product={selectedProduct}
                            onRestock={handleRestock}
                            onCancel={() => setSelectedProduct(null)}
                        />
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