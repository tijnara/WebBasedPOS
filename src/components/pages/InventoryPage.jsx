// src/components/pages/InventoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useProducts } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabaseClient';
import {
    Button, Input, Card, CardContent, Select, Label,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui';
import { useStore } from '../../store/useStore';
import { PackageIcon } from '../Icons';
import Pagination from '../Pagination';
import { useQueryClient } from '@tanstack/react-query';
import {
    Plus, Minus, Search, AlertTriangle, CheckCircle2,
    Boxes, ArrowRight, Layers, XCircle, Calendar
} from 'lucide-react';

// --- Sub-Component: Break Bulk Grid ---
function BreakBulk({ products, onSuccess, isDemo }) {
    const childProducts = products.filter(p => p.parent_product_id && p.conversion_rate > 1);
    const { user, addToast } = useStore();
    const queryClient = useQueryClient();

    const handleBreak = async (child) => {
        const parent = products.find(p => p.id === child.parent_product_id);
        if (!parent || parent.stock < 1) {
            addToast({
                title: 'No Stock Available',
                description: `No ${parent?.name || 'parent pack'} left to unbox.`,
                variant: 'destructive'
            });
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
                title: 'Case Unboxed Successfully',
                description: `Converted 1 ${parent.name} into ${child.conversion_rate} ${child.name}s.`,
                variant: 'success'
            });
            await queryClient.invalidateQueries(['products']);
            onSuccess();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    if (childProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-lime-50 dark:bg-lime-950/50 text-[#8DB600] dark:text-lime-400 flex items-center justify-center mb-3">
                    <Boxes className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No Convertible Bulk Products</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm text-center">
                    Link individual items to parent wholesale packs in Product Management to enable instant bulk unboxing.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-lime-50 via-white to-lime-50/30 dark:from-lime-950/40 dark:via-slate-900 dark:to-lime-950/20 p-4 rounded-2xl border border-lime-200 dark:border-lime-900/60 flex items-start gap-3.5 shadow-2xs transition-colors">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-xs text-[#8DB600] dark:text-lime-400 border border-lime-100 dark:border-slate-700">
                    <Boxes className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Case Conversion & Bulk Breaking</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                        Open master packaging (Parent) to restock individual saleable units (Child). Stock will deduct automatically.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childProducts.map(child => {
                    const parent = products.find(p => p.id === child.parent_product_id);
                    const canBreak = parent && parent.stock >= 1;

                    return (
                        <Card key={child.id} className={`rounded-2xl transition-all duration-200 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md ${!canBreak ? 'opacity-70 bg-slate-50/50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}`}>
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">{child.name}</h4>
                                        <span className="text-[10px] font-black bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 px-2 py-0.5 rounded-full whitespace-nowrap border border-lime-200 dark:border-lime-900/60">
                                            x{child.conversion_rate} Units
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                                        <span>Current Stock:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">{child.stock}</span>
                                    </div>

                                    {/* Parent Source Card */}
                                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/80 mb-4">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                            Source Wholesale Pack
                                        </span>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate pr-2">{parent?.name || 'Unknown'}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${parent?.stock > 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'}`}>
                                                {parent?.stock || 0} cases left
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleBreak(child)}
                                    disabled={!canBreak || isDemo}
                                    className={`w-full h-9 text-xs font-bold rounded-xl shadow-xs transition-all ${canBreak ? 'bg-[#8DB600] hover:bg-[#7ca000] text-white active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
                                >
                                    {canBreak ? (
                                        <span className="flex items-center justify-center gap-1.5">
                                            Open 1 Case <ArrowRight className="w-3.5 h-3.5" /> <span className="font-black">+{child.conversion_rate} Units</span>
                                        </span>
                                    ) : (
                                        'No Cases Available'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function InventoryPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, addToast } = useStore();
    const isDemo = user?.isDemo;

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('inventory'); // 'inventory' | 'convert'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'low' | 'out'
    const itemsPerPage = 10;

    // Modals
    const [restockModal, setRestockModal] = useState({ isOpen: false, product: null, qty: '', expiry: '' });
    const [adjustModal, setAdjustModal] = useState({ isOpen: false, product: null, qty: '', reason: 'damaged' });

    const { restockProductId } = router.query;

    // Handle deep linked restock from router
    useEffect(() => {
        const fetchProductForRestock = async () => {
            if (!restockProductId) return;

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', restockProductId)
                .single();

            if (data && !error) {
                setRestockModal({
                    isOpen: true,
                    product: { id: data.id, name: data.name, stock: data.stock_quantity, minStock: data.min_stock || 10 },
                    qty: '',
                    expiry: ''
                });
                router.replace('/inventory', undefined, { shallow: true });
            }
        };

        if (router.isReady && restockProductId) {
            fetchProductForRestock();
        }
    }, [router.isReady, restockProductId, router]);

    // Search debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const { data: productsData, refetch, isLoading } = useProducts({
        searchTerm: debouncedSearchTerm,
        page: currentPage,
        itemsPerPage: itemsPerPage,
        fetchAll: viewMode === 'convert'
    });

    const rawProducts = productsData?.products || [];
    const totalPages = productsData?.totalPages || 1;

    // Filter by low/out stock
    const filteredProducts = rawProducts.filter(p => {
        if (statusFilter === 'low') return p.stock <= (p.minStock || 10) && p.stock > 0;
        if (statusFilter === 'out') return p.stock === 0;
        return true;
    });

    // KPI Metrics calculation
    const totalSKUs = rawProducts.length;
    const outOfStockCount = rawProducts.filter(p => p.stock === 0).length;
    const lowStockCount = rawProducts.filter(p => p.stock <= (p.minStock || 10) && p.stock > 0).length;
    const healthyStockCount = rawProducts.filter(p => p.stock > (p.minStock || 10)).length;

    // Restock submit
    const handleConfirmRestock = async (e) => {
        e.preventDefault();
        const { product, qty, expiry } = restockModal;
        const addQty = parseInt(qty, 10);

        if (!product || isNaN(addQty) || addQty <= 0) {
            addToast({ title: 'Invalid Quantity', description: 'Enter a valid positive number.', variant: 'destructive' });
            return;
        }

        const { error: moveError } = await supabase.from('stock_movements').insert({
            product_id: product.id,
            quantity_change: addQty,
            type: 'restock',
            expiry_date: expiry || null,
            staff_id: user?.id
        });

        const { error: prodError } = await supabase.rpc('increment_stock', {
            p_product_id: product.id,
            p_quantity: addQty
        });

        if (!moveError && !prodError) {
            addToast({ title: 'Stock Updated', description: `Added ${addQty} units to ${product.name}.`, variant: 'success' });
            setRestockModal({ isOpen: false, product: null, qty: '', expiry: '' });
            await queryClient.invalidateQueries(['products']);
            refetch();
        } else {
            addToast({ title: 'Error', description: 'Failed to record restock.', variant: 'destructive' });
        }
    };

    // Adjustment submit
    const handleConfirmAdjustment = async (e) => {
        e.preventDefault();
        const { product, qty, reason } = adjustModal;
        const adjQty = parseInt(qty, 10);

        if (!product || isNaN(adjQty) || adjQty <= 0) {
            addToast({ title: 'Invalid Quantity', description: 'Enter a valid positive quantity.', variant: 'destructive' });
            return;
        }

        if (adjQty > product.stock) {
            addToast({ title: 'Quantity Exceeds Stock', description: `Cannot remove more than the current stock (${product.stock}).`, variant: 'destructive' });
            return;
        }

        const { error: moveError } = await supabase.from('stock_movements').insert({
            product_id: product.id,
            quantity_change: -adjQty,
            type: reason,
            staff_id: user?.id
        });

        const { error: prodError } = await supabase.rpc('decrement_stock', {
            p_product_id: product.id,
            p_quantity: adjQty
        });

        if (!moveError && !prodError) {
            addToast({ title: 'Stock Adjusted', description: `Deducted ${adjQty} units from ${product.name}.`, variant: 'success' });
            setAdjustModal({ isOpen: false, product: null, qty: '', reason: 'damaged' });
            await queryClient.invalidateQueries(['products']);
            refetch();
        } else {
            addToast({ title: 'Error', description: 'Failed to record adjustment.', variant: 'destructive' });
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 responsive-page transition-colors">

            {/* Header & Main Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Inventory Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Monitor station levels, record deliveries, and manage stock losses.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl w-full sm:w-auto border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <button
                        onClick={() => { setViewMode('inventory'); setSearchTerm(''); }}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            viewMode === 'inventory'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                        Stock Items
                    </button>
                    <button
                        onClick={() => { setViewMode('convert'); setSearchTerm(''); }}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            viewMode === 'convert'
                                ? 'bg-white dark:bg-slate-900 text-[#8DB600] dark:text-lime-400 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                        <Boxes className="w-3.5 h-3.5" />
                        Break Bulk
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            {viewMode === 'inventory' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total SKUs</span>
                            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{totalSKUs}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Healthy Stock</span>
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{healthyStockCount}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Low Stock</span>
                            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{lowStockCount}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Out of Stock</span>
                            <span className="text-xl font-black text-rose-600 dark:text-rose-400">{outOfStockCount}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <XCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            )}

            {/* Break Bulk View */}
            {viewMode === 'convert' && (
                <BreakBulk products={rawProducts} onSuccess={refetch} isDemo={isDemo} />
            )}

            {/* Standard Inventory Table View */}
            {viewMode === 'inventory' && (
                <div className="space-y-4">
                    {/* Controls Row: Search + Quick Filter Pills */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <Input
                                placeholder="Search by item name or barcode..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl shadow-2xs focus:border-[#8DB600] focus:ring-[#8DB600]"
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            {[
                                { id: 'all', label: 'All Items' },
                                { id: 'low', label: 'Low Stock Only' },
                                { id: 'out', label: 'Out of Stock' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => setStatusFilter(filter.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                        statusFilter === filter.id
                                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                            : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-5 py-3.5">Product Name</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5 text-right">Min Stock</th>
                                    <th className="px-4 py-3.5 text-right">Current Stock</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                                            Loading station inventory...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <PackageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No matching items found</p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">Try adjusting your search or active filter</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map(product => {
                                        const minStock = product.minStock || 10;
                                        const isOut = product.stock === 0;
                                        const isLow = product.stock <= minStock && !isOut;

                                        return (
                                            <tr key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-slate-100">{product.name}</div>
                                                    {product.barcode && (
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{product.barcode}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {isOut ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full">
                                                            <XCircle className="w-3 h-3" /> OUT
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2.5 py-0.5 rounded-full">
                                                            <AlertTriangle className="w-3 h-3" /> LOW
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                                                            <CheckCircle2 className="w-3 h-3" /> OK
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-slate-400 dark:text-slate-500">
                                                    {minStock}
                                                </td>
                                                <td className={`px-4 py-3.5 text-right font-mono font-black text-sm ${isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                    {product.stock.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setRestockModal({ isOpen: true, product, qty: '', expiry: '' })}
                                                            className="h-8 px-2.5 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 active:scale-95 transition-all"
                                                            disabled={isDemo}
                                                            title="Add Stock from Supplier"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Restock</span>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setAdjustModal({ isOpen: true, product, qty: '', reason: 'damaged' })}
                                                            className="h-8 px-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900 font-bold text-xs rounded-lg flex items-center gap-1 active:scale-95 transition-all"
                                                            disabled={isDemo}
                                                            title="Record Breakage, Loss, or Correction"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                            <span>Adjust</span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={page => setCurrentPage(page)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* RESTOCK DIALOG MODAL */}
            <Dialog
                open={restockModal.isOpen}
                onOpenChange={(open) => !open && setRestockModal(prev => ({ ...prev, isOpen: false }))}
            >
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:[color-scheme:dark]">
                    <DialogHeader className="border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#8DB600] dark:text-lime-400 flex items-center justify-center">
                                <Plus className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span>Restock Item: {restockModal.product?.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleConfirmRestock} className="p-4 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Current Stock on Hand:</span>
                            <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                                {restockModal.product?.stock} units
                            </span>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantity to Add</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 50"
                                value={restockModal.qty}
                                onChange={e => setRestockModal(prev => ({ ...prev, qty: e.target.value }))}
                                autoFocus
                                required
                                className="h-10 mt-1 font-mono font-bold text-base bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                            />
                            {/* Quick Increment Chips */}
                            <div className="flex items-center gap-2 mt-2">
                                {[5, 10, 25, 50, 100].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setRestockModal(prev => ({ ...prev, qty: String(val) }))}
                                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-lime-100 dark:hover:bg-lime-950/60 hover:text-[#5f7d00] dark:hover:text-lime-400 transition-colors cursor-pointer"
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiry Date (Optional)</Label>
                            <Input
                                type="date"
                                value={restockModal.expiry}
                                onChange={e => setRestockModal(prev => ({ ...prev, expiry: e.target.value }))}
                                className="h-10 mt-1 bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                            />
                        </div>

                        <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRestockModal(prev => ({ ...prev, isOpen: false }))}
                                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold"
                            >
                                Confirm Restock
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ADJUSTMENT DIALOG MODAL */}
            <Dialog
                open={adjustModal.isOpen}
                onOpenChange={(open) => !open && setAdjustModal(prev => ({ ...prev, isOpen: false }))}
            >
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:[color-scheme:dark]">
                    <DialogHeader className="border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                <Minus className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span>Remove / Adjust Stock: {adjustModal.product?.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleConfirmAdjustment} className="p-4 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Current Stock on Hand:</span>
                            <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                                {adjustModal.product?.stock} units
                            </span>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantity to Deduct</Label>
                            <Input
                                type="number"
                                min="1"
                                max={adjustModal.product?.stock || 9999}
                                placeholder="e.g. 2"
                                value={adjustModal.qty}
                                onChange={e => setAdjustModal(prev => ({ ...prev, qty: e.target.value }))}
                                autoFocus
                                required
                                className="h-10 mt-1 font-mono font-bold text-base bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason for Adjustment</Label>
                            <Select
                                value={adjustModal.reason}
                                onChange={e => setAdjustModal(prev => ({ ...prev, reason: e.target.value }))}
                                className="h-10 mt-1 text-xs bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                            >
                                <option value="damaged" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Damaged / Leaking Jug</option>
                                <option value="expired" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Expired Sealed Water</option>
                                <option value="theft" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Theft / Unaccounted Loss</option>
                                <option value="consumed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Staff / Office Consumption</option>
                                <option value="correction" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Audit / Inventory Correction</option>
                            </Select>
                        </div>

                        <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))}
                                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                            >
                                Confirm Removal
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}