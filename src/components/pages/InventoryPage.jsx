// src/components/pages/InventoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useProducts } from '../../hooks/useProducts';
import { logActivity } from '../../hooks/useActivityLogs';
import { supabase } from '../../lib/supabaseClient';
import {
    Button, Input, Card, CardContent, Select, Label,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui';
import { useStore } from '../../store/useStore';
import { PackageIcon } from '../Icons';
import Pagination from '../Pagination';
import InventoryProductTour from '../inventory/InventoryProductTour';
import { useQueryClient } from '@tanstack/react-query';
import {
    Plus, Minus, Search, AlertTriangle, CheckCircle2,
    Boxes, ArrowRight, Layers, XCircle, X, Infinity as InfinityIcon
} from 'lucide-react';

const isServiceProduct = (product) =>
    product?.category === 'Refills/Services' || product?.track_stock === false;

const isValidCatalogItem = (product) => {
    const cleanName = (product?.name || '').trim().toLowerCase();
    return Boolean(cleanName) && cleanName !== 'unknown' && !cleanName.includes('removed');
};

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

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'INVENTORY',
                description: `Unboxed 1 case of ${parent.name} into +${child.conversion_rate} units of ${child.name}`
            });

            addToast({
                title: 'Case Unboxed Successfully',
                description: `Converted 1 ${parent.name} into ${child.conversion_rate} ${child.name}s.`,
                variant: 'success'
            });
            await queryClient.invalidateQueries({ queryKey: ['products'] });
            await queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            onSuccess();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    if (childProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 transition-colors">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-lime-50 dark:bg-lime-950/50 text-[#8DB600] dark:text-lime-400 flex items-center justify-center mb-3">
                    <Boxes className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">No Convertible Bulk Products</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm text-center">
                    Link individual items to parent wholesale packs in Product Management to enable instant bulk unboxing.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2.5 sm:space-y-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-lime-50 via-white to-lime-50/30 dark:from-lime-950/40 dark:via-slate-900 dark:to-lime-950/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-lime-200 dark:border-lime-900/60 flex items-start gap-3 shadow-2xs transition-colors">
                <div className="bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-xl shadow-xs text-[#8DB600] dark:text-lime-400 border border-lime-100 dark:border-slate-700 shrink-0">
                    <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">Case Conversion &amp; Bulk Breaking</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs mt-0.5">
                        Open master packaging (Parent) to restock individual saleable units (Child). Stock will deduct automatically.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {childProducts.map(child => {
                    const parent = products.find(p => p.id === child.parent_product_id);
                    const canBreak = parent && parent.stock >= 1;

                    return (
                        <Card key={child.id} className={`rounded-xl sm:rounded-2xl transition-all duration-200 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md ${!canBreak ? 'opacity-70 bg-slate-50/50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}`}>
                            <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
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
                                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2.5 sm:p-3 border border-slate-200/70 dark:border-slate-700/80 mb-3 sm:mb-4">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                                            Source Wholesale Pack
                                        </span>
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">{parent?.name || 'Unknown'}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${parent?.stock > 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'}`}>
                                                {parent?.stock || 0} cases left
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => handleBreak(child)}
                                    disabled={!canBreak || isDemo}
                                    className={`w-full h-9 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${canBreak ? 'bg-[#8DB600] hover:bg-[#7ca000] text-white active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
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
    const searchInputRef = useRef(null);

    // Modals
    const [restockModal, setRestockModal] = useState({ isOpen: false, product: null, qty: '', expiry: '' });
    const [adjustModal, setAdjustModal] = useState({ isOpen: false, product: null, qty: '', reason: 'damaged' });

    const { restockProductId } = router.query;

    const preventEnterReload = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    };

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
                    product: { id: data.id, name: data.name, stock: data.stock_quantity, minStock: data.min_stock_level || data.min_stock || 10 },
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

    // Keyboard shortcut (/) to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) searchInputRef.current.focus();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { data: productsData, refetch, isLoading } = useProducts({
        searchTerm: debouncedSearchTerm,
        page: currentPage,
        itemsPerPage: itemsPerPage,
        fetchAll: viewMode === 'convert'
    });

    const rawProducts = (productsData?.products || []).filter(isValidCatalogItem);
    const totalPages = productsData?.totalPages || 1;

    // Filter by low/out stock (excluding unlimited refill services)
    const filteredProducts = rawProducts.filter(p => {
        const isService = isServiceProduct(p);
        if (statusFilter === 'low') return !isService && p.stock <= (p.minStock || 10) && p.stock > 0;
        if (statusFilter === 'out') return !isService && p.stock === 0;
        return true;
    });

    // KPI Metrics calculation
    const totalSKUs = rawProducts.length;
    const outOfStockCount = rawProducts.filter(p => !isServiceProduct(p) && p.stock === 0).length;
    const lowStockCount = rawProducts.filter(p => !isServiceProduct(p) && p.stock <= (p.minStock || 10) && p.stock > 0).length;
    const healthyStockCount = rawProducts.filter(p => isServiceProduct(p) || p.stock > (p.minStock || 10)).length;

    // Restock submit
    const handleConfirmRestock = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Adding stock is disabled in demo mode.', variant: 'warning' });
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
            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'INVENTORY',
                description: `Restocked +${addQty} units of ${product.name}${expiry ? ` (Expiry: ${expiry})` : ''}`
            });

            addToast({ title: 'Stock Updated', description: `Added ${addQty} units to ${product.name}.`, variant: 'success' });
            setRestockModal({ isOpen: false, product: null, qty: '', expiry: '' });
            await queryClient.invalidateQueries({ queryKey: ['products'] });
            await queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            refetch();
        } else {
            addToast({ title: 'Error', description: 'Failed to record restock.', variant: 'destructive' });
        }
    };

    // Adjustment submit
    const handleConfirmAdjustment = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Adjusting stock is disabled in demo mode.', variant: 'warning' });
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
            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'INVENTORY',
                description: `Adjusted stock for ${product.name}: -${adjQty} units (Reason: ${reason})`
            });

            addToast({ title: 'Stock Adjusted', description: `Deducted ${adjQty} units from ${product.name}.`, variant: 'success' });
            setAdjustModal({ isOpen: false, product: null, qty: '', reason: 'damaged' });
            await queryClient.invalidateQueries({ queryKey: ['products'] });
            await queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            refetch();
        } else {
            addToast({ title: 'Error', description: 'Failed to record adjustment.', variant: 'destructive' });
        }
    };

    return (
        <div className="inventory-page w-full max-w-7xl mx-auto px-1.5 pt-2 pb-32 sm:px-5 sm:pt-5 sm:pb-32 md:p-6 space-y-2.5 sm:space-y-6 transition-colors">
            {/* Ensure full mobile bottom dock clearance (< 768px) and edge-to-edge fit (< 640px) */}
            <style jsx global>{`
                @media (max-width: 767px) {
                    .app:has(.inventory-page) .main,
                    .app:has(.inventory-page) .container {
                        padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px)) !important;
                    }
                }
                @media (max-width: 639px) {
                    .app:has(.inventory-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.inventory-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
                .inventory-page .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .inventory-page .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Header & Main Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 px-0.5 sm:px-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Inventory Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Monitor station levels, record deliveries, and manage stock losses.</p>
                </div>

                <div
                    id="tour-inv-mode-toggle"
                    className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl w-full sm:w-auto border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                >
                    <button
                        type="button"
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
                        type="button"
                        onClick={() => { setViewMode('convert'); setSearchTerm(''); }}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            viewMode === 'convert'
                                ? 'bg-white dark:bg-slate-900 text-[#8DB600] dark:text-lime-400 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Break Bulk</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            {viewMode === 'inventory' && (
                <div id="tour-inv-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0 transition-colors">
                        <div className="min-w-0">
                            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Total SKUs</span>
                            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 block mt-0.5 truncate">{totalSKUs}</span>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0 transition-colors">
                        <div className="min-w-0">
                            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Healthy / Service</span>
                            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate">{healthyStockCount}</span>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0 transition-colors">
                        <div className="min-w-0">
                            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Low Stock</span>
                            <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 block mt-0.5 truncate">{lowStockCount}</span>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0 transition-colors">
                        <div className="min-w-0">
                            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Out of Stock</span>
                            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 block mt-0.5 truncate">{outOfStockCount}</span>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                </div>
            )}

            {/* Break Bulk View */}
            {viewMode === 'convert' && (
                <div id="tour-inv-break-bulk">
                    <BreakBulk products={rawProducts} onSuccess={refetch} isDemo={isDemo} />
                </div>
            )}

            {/* Standard Inventory View */}
            {viewMode === 'inventory' && (
                <div className="space-y-2.5 sm:space-y-4">
                    {/* Controls Row: Search + Quick Filter Pills */}
                    <div
                        id="tour-inv-filters"
                        className="bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3"
                    >
                        <div className="relative flex items-center flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search by item name or barcode... (/)"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={preventEnterReload}
                                style={{
                                    paddingLeft: '2.5rem',
                                    paddingRight: searchTerm ? '2.25rem' : '0.875rem'
                                }}
                                className="!pl-10 h-9 sm:h-10 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-[#8DB600] focus:ring-[#8DB600]"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'all', label: 'All Items' },
                                { id: 'low', label: 'Low Stock Only' },
                                { id: 'out', label: 'Out of Stock' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => setStatusFilter(filter.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                                        statusFilter === filter.id
                                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Stock Cards (Prevents horizontal table cutoff on < 768px) */}
                    <div id="tour-inv-mobile-list" className="block md:hidden space-y-2">
                        {isLoading ? (
                            <div className="text-center text-slate-400 p-6 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                Loading station inventory...
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center text-slate-400 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                                <PackageIcon className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No matching items found</p>
                                <p className="text-[11px] text-slate-400">Try adjusting your search or active filter</p>
                            </div>
                        ) : (
                            filteredProducts.map(product => {
                                const isService = isServiceProduct(product);
                                const minStock = product.minStock || 10;
                                const isOut = !isService && product.stock === 0;
                                const isLow = !isService && product.stock <= minStock && !isOut;

                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                                    <span className="truncate">{product.category || 'General'}</span>
                                                    {product.barcode && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-mono">{product.barcode}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {isService ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/60 px-2 py-0.5 rounded-full shrink-0">
                                                    <InfinityIcon className="w-3 h-3" /> Service
                                                </span>
                                            ) : isOut ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-full shrink-0">
                                                    <XCircle className="w-3 h-3" /> OUT
                                                </span>
                                            ) : isLow ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-full shrink-0">
                                                    <AlertTriangle className="w-3 h-3" /> LOW
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full shrink-0">
                                                    <CheckCircle2 className="w-3 h-3" /> OK
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                                            <div className="flex items-baseline gap-2.5 min-w-0">
                                                <div>
                                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                                                        Stock
                                                    </span>
                                                    {isService ? (
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            Unlimited
                                                        </span>
                                                    ) : (
                                                        <span className={`font-mono font-black text-sm ${
                                                            isOut
                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                : isLow
                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                    : 'text-slate-900 dark:text-slate-100'
                                                        }`}>
                                                            {product.stock.toLocaleString()} <span className="text-[10px] font-semibold text-slate-400">/ min {minStock}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => setRestockModal({ isOpen: true, product, qty: '', expiry: '' })}
                                                    className="h-8 px-2.5 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                                    disabled={isDemo}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Restock</span>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setAdjustModal({ isOpen: true, product, qty: '', reason: 'damaged' })}
                                                    className="h-8 px-2.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                                    disabled={isDemo}
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                    <span>Adjust</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        <div className="pt-1.5">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={page => setCurrentPage(page)}
                            />
                        </div>
                    </div>

                    {/* Desktop Table Card */}
                    <div
                        id="tour-inv-desktop-table"
                        className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
                    >
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
                                        const isService = isServiceProduct(product);
                                        const minStock = product.minStock || 10;
                                        const isOut = !isService && product.stock === 0;
                                        const isLow = !isService && product.stock <= minStock && !isOut;

                                        return (
                                            <tr key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-slate-100">{product.name}</div>
                                                    {product.barcode && (
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{product.barcode}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {isService ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/60 px-2.5 py-0.5 rounded-full">
                                                            <InfinityIcon className="w-3 h-3" /> SERVICE
                                                        </span>
                                                    ) : isOut ? (
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
                                                    {isService ? '—' : minStock}
                                                </td>
                                                <td className={`px-4 py-3.5 text-right font-mono font-black text-sm ${
                                                    isService
                                                        ? 'text-slate-500 dark:text-slate-400 font-semibold text-xs'
                                                        : isOut
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : isLow
                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-slate-800 dark:text-slate-100'
                                                }`}>
                                                    {isService ? 'Unlimited' : product.stock.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => setRestockModal({ isOpen: true, product, qty: '', expiry: '' })}
                                                            className="h-8 px-2.5 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                                            disabled={isDemo}
                                                            title="Add Stock from Supplier"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Restock</span>
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setAdjustModal({ isOpen: true, product, qty: '', reason: 'damaged' })}
                                                            className="h-8 px-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900 font-bold text-xs rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
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
                <DialogContent className="w-[95vw] sm:w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl dark:[color-scheme:dark]">
                    <DialogHeader className="border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#8DB600] dark:text-lime-400 flex items-center justify-center shrink-0">
                                <Plus className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span className="truncate">Restock Item: {restockModal.product?.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div onKeyDown={preventEnterReload} className="p-4 space-y-4">
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
                                className="h-10 mt-1 font-mono font-bold text-base bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                            />
                            {/* Quick Increment Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
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
                                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmRestock}
                                className="bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold cursor-pointer"
                            >
                                Confirm Restock
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ADJUSTMENT DIALOG MODAL */}
            <Dialog
                open={adjustModal.isOpen}
                onOpenChange={(open) => !open && setAdjustModal(prev => ({ ...prev, isOpen: false }))}
            >
                <DialogContent className="w-[95vw] sm:w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl dark:[color-scheme:dark]">
                    <DialogHeader className="border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <Minus className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span className="truncate">Remove / Adjust Stock: {adjustModal.product?.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div onKeyDown={preventEnterReload} className="p-4 space-y-4">
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
                                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmAdjustment}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                            >
                                Confirm Removal
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <InventoryProductTour
                isInventoryLoading={isLoading}
                viewMode={viewMode}
            />
        </div>
    );
}