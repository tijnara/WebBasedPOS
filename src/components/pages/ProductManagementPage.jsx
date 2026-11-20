// src/components/pages/ProductManagementPage.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogTitle, DialogCloseButton, Select
} from '../ui';
import Pagination from '../Pagination';

import { useProducts } from '../../hooks/useProducts';
import {
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct
} from '../../hooks/useProductMutations';
import { useProduct3DAssets } from '../../hooks/useProduct3DAssets';

import currency from 'currency.js';
import { EditIcon, DeleteIcon } from '../Icons';
import {
    Eye, EyeOff, Download, Plus, Search, X,
    Layers, AlertTriangle, CheckCircle2, TrendingUp, Boxes, Sparkles
} from 'lucide-react';

import Product3DVisual, {
    resolveProduct3DType,
    BUILTIN_WRS_3D_ASSETS
} from '../pos/Product3DVisual';
import Product3DIconPicker from '../pos/Product3DIconPicker';

export default function ProductManagementPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: productsData = { products: [], totalPages: 1 }, isLoading } = useProducts({
        page: currentPage,
        itemsPerPage,
        searchTerm: debouncedSearchTerm,
        category: categoryFilter,
        isHidden: true
    });

    const { data: all3DAssets = BUILTIN_WRS_3D_ASSETS } = useProduct3DAssets();

    const products = productsData.products || [];
    const totalPages = productsData.totalPages || 1;

    const addToast = useStore(s => s.addToast);
    const user = useStore(s => s.user);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.isadmin || user.is_admin || user.isSuperAdmin) return true;
        const role = String(user.role?.name || user.role || user.position || user.user_type || '')
            .toLowerCase()
            .trim();
        return ['admin', 'administrator', 'owner', 'superadmin', 'manager'].some(k => role.includes(k));
    }, [user]);
    const isDemo = user?.isDemo;

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [cost, setCost] = useState('0');
    const [selected3DKey, setSelected3DKey] = useState('refill-25');
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('Refills/Services');
    const [stock, setStock] = useState(0);
    const [minStock, setMinStock] = useState(5);
    const [trackStock, setTrackStock] = useState(false);
    const [parentId, setParentId] = useState(null);
    const [conversionRate, setConversionRate] = useState('');
    const [isHidden, setIsHidden] = useState(false);

    const searchInputRef = useRef(null);

    const [customCategories, setCustomCategories] = useState(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem('pos_custom_categories') || '[]'); } catch { return []; }
    });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, categoryFilter]);

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

    const preventEnterReload = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const liveProfitMetrics = useMemo(() => {
        const sell = parseFloat(price) || 0;
        const buy = parseFloat(cost) || 0;
        const profit = sell - buy;
        const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : 0;
        return { profit, margin };
    }, [price, cost]);

    const kpiMetrics = useMemo(() => {
        const total = productsData.totalCount ?? products.length;
        const visible = products.filter(p => !p.is_hidden).length;
        const hidden = products.filter(p => p.is_hidden).length;
        const lowStock = products.filter(p => {
            const isService = p.category === 'Refills/Services' || p.track_stock === false;
            return !isService && Number(p.stock || 0) <= Number(p.minStock || 5);
        }).length;
        return { total, visible, hidden, lowStock };
    }, [products, productsData.totalCount]);

    const active3DAssetMeta = useMemo(() => {
        return (
            all3DAssets.find(a => a.asset_key === selected3DKey) ||
            BUILTIN_WRS_3D_ASSETS.find(a => a.asset_key === selected3DKey) ||
            BUILTIN_WRS_3D_ASSETS[0]
        );
    }, [all3DAssets, selected3DKey]);

    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
        setCost(String(p?.cost ?? 0));
        setSelected3DKey(resolveProduct3DType(p));
        setBarcode(p?.barcode || '');
        setCategory(p?.category || 'General');
        setStock(Number(p?.stock ?? 0));
        setMinStock(Number(p?.minStock ?? 5));
        setTrackStock(p?.track_stock !== false);
        setParentId(p?.parent_product_id || null);
        setConversionRate(p?.conversion_rate ? String(p.conversion_rate) : '');
        setIsHidden(p?.is_hidden || false);
        setIsModalOpen(true);
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(resetForm, 200);
    };

    const resetForm = () => {
        setEditing(null);
        setName('');
        setPrice('');
        setCost('0');
        setSelected3DKey('refill-25');
        setBarcode('');
        setCategory('Refills/Services');
        setStock(0);
        setMinStock(5);
        setTrackStock(false);
        setParentId(null);
        setConversionRate('');
        setSaving(false);
        setIsAddingCategory(false);
        setNewCategoryName('');
        setIsHidden(false);
    };

    const handleSelect3DAsset = (asset) => {
        if (!asset?.asset_key) return;
        setSelected3DKey(asset.asset_key);

        if (!editing) {
            if (!name.trim()) {
                setName(asset.label);
            }
            if (!price && asset.suggested_price > 0) {
                setPrice(String(asset.suggested_price));
            }
            if (asset.category) {
                setCategory(asset.category);
                setTrackStock(asset.category !== 'Refills/Services');
            }
        }
    };

    // Called on Button Click, NOT Form Submit
    const handleSaveClick = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (e?.stopPropagation) e.stopPropagation();

        const parsedPrice = currency(price).value;

        if (!name.trim() || !price) {
            addToast({ title: 'Missing Information', description: 'Name and Price are required.', variant: 'destructive' });
            return;
        }

        setSaving(true);
        const finalIcon3DKey = selected3DKey || 'refill-25';
        const finalImageUrl = `3d:${finalIcon3DKey}`;

        const payload = {
            name: name.trim(),
            price: parsedPrice,
            cost: currency(cost || '0').value,
            image_url: finalImageUrl,
            icon_3d_key: finalIcon3DKey,
            barcode: barcode?.trim() || null,
            stock: trackStock ? Math.max(0, parseInt(stock, 10) || 0) : 0,
            minStock: trackStock ? Math.max(0, parseInt(minStock, 10) || 0) : 0,
            track_stock: trackStock,
            category: category || 'General',
            parent_product_id: parentId,
            conversion_rate: conversionRate ? parseInt(conversionRate, 10) : null,
            is_hidden: isHidden,
        };

        try {
            let savedRecord = null;
            if (editing) {
                savedRecord = await updateProduct.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'Product Updated', description: `${name} has been updated.`, variant: 'success' });
            } else {
                savedRecord = await createProduct.mutateAsync(payload);
                addToast({ title: 'Product Added', description: `${name} created and saved to POS.`, variant: 'success' });
            }

            const targetId = savedRecord?.id || editing?.id;
            if (targetId) {
                await supabase
                    .from('products')
                    .update({
                        image_url: finalImageUrl,
                        icon_3d_key: finalIcon3DKey
                    })
                    .eq('id', targetId);
            }

            closeModal();
        } catch (err) {
            addToast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const toggleHide = async (p) => {
        const newVisibility = !p.is_hidden;
        try {
            await updateProduct.mutateAsync({ id: p.id, is_hidden: newVisibility });
            addToast({
                title: newVisibility ? 'Product Hidden' : 'Product Visible',
                description: `${p.name} is now ${newVisibility ? 'hidden from POS terminal' : 'available in POS'}.`,
                variant: 'success'
            });
        } catch (err) {
            addToast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const remove = async (p) => {
        if (!confirm(`Are you sure you want to delete ${p.name}?`)) return;
        try {
            await deleteProduct.mutateAsync(p.id);
            addToast({ title: 'Deleted', description: `${p.name} was removed.`, variant: 'success' });
        } catch (e) {
            if (e.code === '23503') {
                addToast({
                    title: 'Cannot Delete Product',
                    description: 'This item is linked to past sales or parent bulk relationships. You can hide it using the Eye icon instead.',
                    variant: 'destructive'
                });
            } else {
                addToast({ title: 'Error', description: e.message || 'Failed to delete product', variant: 'destructive' });
            }
        }
    };

    const handleExportCSV = () => {
        if (!products.length) return;
        const headers = ['ID', 'Name', 'Barcode', 'Category', 'Price', 'Cost', 'Stock', 'Min_Stock', '3D_Icon', 'Status'];
        const rows = products.map(p => [
            p.id,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            p.barcode || '',
            p.category || 'General',
            p.price || 0,
            p.cost || 0,
            p.stock || 0,
            p.minStock || 5,
            resolveProduct3DType(p),
            p.is_hidden ? 'Hidden' : 'Visible'
        ]);

        const csvString = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvString);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `seaside_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const categoriesFromProducts = Array.from(new Set((products || []).map(p => (p.category || 'General').trim()))).filter(Boolean);
    const mergedCategories = Array.from(new Set(['Refills/Services', 'Containers', 'Bottled Water', 'Ice Cubes/Tubes', 'Accessories', 'General', ...categoriesFromProducts, ...customCategories]));
    const categories = ['All', ...mergedCategories];

    const addCategory = () => {
        const cat = (newCategoryName || '').trim();
        if (!cat) return;
        if (!mergedCategories.some(c => c.toLowerCase() === cat.toLowerCase())) {
            setCustomCategories(prev => [...prev, cat]);
            try { localStorage.setItem('pos_custom_categories', JSON.stringify([...customCategories, cat])); } catch {}
        }
        setCategory(cat);
        setIsAddingCategory(false);
        setNewCategoryName('');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending || saving;

    return (
        <div className="product-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-6 space-y-2.5 sm:space-y-6 transition-colors">
            {/* Match POS, Expenses, Dashboard, Report, History, Scanned Logs, Customer & Maintenance edge-to-edge .container fit on mobile (< 640px) */}
            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.product-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.product-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
            `}</style>

            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 px-0.5 sm:px-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Product Management</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control refilling services, 3D station visuals, bottle inventory, and POS availability.</p>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    {isAdmin && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/3d-icons')}
                            className="w-full sm:w-auto h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#8DB600] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#8DB600] shrink-0" />
                            <span className="truncate">3D Icons Library</span>
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleExportCSV}
                        className={`${isAdmin ? 'col-span-1' : 'col-span-2'} w-full sm:w-auto h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer`}
                    >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Export CSV</span>
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={openModal}
                        className="col-span-2 sm:col-span-1 w-full sm:w-auto h-9 sm:h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        disabled={isDemo}
                    >
                        <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
                        <span>Add Product</span>
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Catalog Items</span>
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 block mt-0.5 truncate">{kpiMetrics.total}</span>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Active in POS</span>
                        <span className="text-lg sm:text-xl font-black text-[#8DB600] dark:text-lime-400 block mt-0.5 truncate">{kpiMetrics.visible}</span>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-lime-50 dark:bg-lime-950/50 text-[#8DB600] dark:text-lime-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Hidden Items</span>
                        <span className="text-lg sm:text-xl font-black text-slate-600 dark:text-slate-400 block mt-0.5 truncate">{kpiMetrics.hidden}</span>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">Low / Out Stock</span>
                        <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 block mt-0.5 truncate">{kpiMetrics.lowStock}</span>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto flex-1 max-w-xl">
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search products by name or barcode... (/)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={preventEnterReload}
                            className="pl-9 pr-8 bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm h-9 sm:h-10 rounded-xl focus:border-[#8DB600] focus:ring-[#8DB600]"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm h-9 sm:h-10 rounded-xl dark:[color-scheme:dark] cursor-pointer"
                        >
                            {categories.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <ScrollArea>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                                    <TableHead className="w-[32%] px-5 py-3.5">Product &amp; 3D Visual</TableHead>
                                    <TableHead className="px-4 py-3.5">Category</TableHead>
                                    <TableHead className="px-4 py-3.5">Selling Price</TableHead>
                                    <TableHead className="px-4 py-3.5">Inventory</TableHead>
                                    <TableHead className="px-4 py-3.5">POS Status</TableHead>
                                    <TableHead className="px-4 py-3.5">Last Updated</TableHead>
                                    <TableHead className="px-5 py-3.5 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Loading catalog...</TableCell></TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">No products matching criteria.</TableCell></TableRow>
                                ) : (
                                    products.map(p => {
                                        const isService = p.category === 'Refills/Services' || p.track_stock === false;
                                        const isLow = !isService && Number(p.stock) <= Number(p.minStock || 5) && Number(p.stock) > 0;
                                        const isOut = !isService && Number(p.stock) === 0;
                                        const resolved3D = resolveProduct3DType(p);

                                        return (
                                            <tr key={p.id} className={`group hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${p.is_hidden ? 'opacity-60 bg-slate-50/40 dark:bg-slate-800/20' : ''}`}>
                                                <TableCell className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs p-1">
                                                            <Product3DVisual product={p} className="w-9 h-9" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</span>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-lime-50 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 border border-lime-200/70 dark:border-lime-800/50">
                                                                    3D: {resolved3D}
                                                                </span>
                                                                {p.barcode && <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{p.barcode}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                                                        {p.category || 'General'}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5 font-black text-sm text-[#8DB600] dark:text-lime-400 font-mono">
                                                    {currency(p.price || 0, { symbol: '₱' }).format()}
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5">
                                                    {isService ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                                                            Service / Unlimited
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            isOut
                                                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                                                                : isLow
                                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                                                                    : 'bg-lime-50 dark:bg-lime-950/40 text-[#5f7d00] dark:text-lime-400 border border-lime-200 dark:border-lime-900/50'
                                                        }`}>
                                                            {Number(p.stock || 0).toLocaleString()} units
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5">
                                                    {p.is_hidden ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                                                            <EyeOff className="w-3 h-3 text-slate-400" /> Hidden
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Visible
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {formatDate(p.updated_at)}
                                                </TableCell>

                                                <TableCell className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push(`/inventory?restockProductId=${p.id}`)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[#8DB600] dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-950/40 hover:border-lime-300 transition-colors cursor-pointer"
                                                            title="Restock in Inventory"
                                                            disabled={isDemo}
                                                        >
                                                            <Boxes className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => toggleHide(p)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                            title={p.is_hidden ? 'Show on POS' : 'Hide from POS'}
                                                            disabled={isDemo}
                                                        >
                                                            {p.is_hidden ? <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Eye className="w-4 h-4" />}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(p)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                                            title="Edit Details & 3D Visual"
                                                            disabled={isDemo}
                                                        >
                                                            <EditIcon className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => remove(p)}
                                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                            title="Delete Product"
                                                            disabled={isDemo}
                                                        >
                                                            <DeleteIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </tr>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-2">
                {isLoading ? (
                    <div className="text-center text-slate-400 p-6 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Loading products...
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center text-slate-400 p-6 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        No products found.
                    </div>
                ) : (
                    products.map(p => {
                        const isService = p.category === 'Refills/Services' || p.track_stock === false;
                        const isLow = !isService && Number(p.stock) <= Number(p.minStock || 5) && Number(p.stock) > 0;
                        const isOut = !isService && Number(p.stock) === 0;

                        return (
                            <div key={p.id} className={`group bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 ${p.is_hidden ? 'opacity-60 bg-slate-50 dark:bg-slate-800/40' : ''}`}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 p-1">
                                        <Product3DVisual product={p} className="w-9 h-9" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                            <span className="truncate">{p.category || 'General'}</span>
                                            <span>•</span>
                                            {isService ? (
                                                <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Service</span>
                                            ) : (
                                                <span className={`font-bold shrink-0 ${
                                                    isOut
                                                        ? 'text-rose-600 dark:text-rose-400'
                                                        : isLow
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : 'text-[#5f7d00] dark:text-lime-400'
                                                }`}>
                                                    {Number(p.stock || 0).toLocaleString()} units
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-black text-sm text-[#8DB600] dark:text-lime-400 mt-0.5 font-mono">
                                            {currency(p.price || 0, { symbol: '₱' }).format()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    {p.is_hidden ? (
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                            Hidden
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                            Visible
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/inventory?restockProductId=${p.id}`)}
                                            className="p-1.5 text-[#8DB600] dark:text-lime-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-950/30 cursor-pointer"
                                            title="Restock"
                                            disabled={isDemo}
                                        >
                                            <Boxes className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => toggleHide(p)} className="p-1.5 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer" disabled={isDemo} title={p.is_hidden ? 'Show on POS' : 'Hide from POS'}>
                                            {p.is_hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                        <button type="button" onClick={() => startEdit(p)} className="p-1.5 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer" disabled={isDemo} title="Edit Product">
                                            <EditIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => remove(p)} className="p-1.5 text-rose-600 dark:text-rose-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer" disabled={isDemo} title="Delete Product">
                                            <DeleteIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div className="pt-1.5">
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={setCurrentPage} />
                </div>
            </div>

            {/* ADD / EDIT PRODUCT MODAL (Wrapped in DIV, never a FORM) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 sm:max-w-[760px] w-[96vw] sm:w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-2xl sm:rounded-3xl dark:[color-scheme:dark]">
                    <div onKeyDown={preventEnterReload}>
                        {/* Header */}
                        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/95 flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {editing ? 'Edit Product Details' : 'Add New Inventory Item'}
                                </DialogTitle>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {editing ? `SKU Item ID: #${editing.id}` : 'Select a saved 3D station visual from the library and configure POS pricing.'}
                                </p>
                            </div>
                            <DialogCloseButton type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full cursor-pointer" />
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 max-h-[76vh] overflow-y-auto space-y-5 sm:space-y-6 bg-white dark:bg-slate-900">
                            {/* Section 1: Selected 3D Visual Preview & Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
                                <div className="md:col-span-1 space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                        Selected 3D Visual
                                    </Label>

                                    <div className="group relative w-full max-w-[180px] md:max-w-none mx-auto aspect-square rounded-2xl bg-gradient-to-b from-cyan-500/10 via-slate-50 to-lime-500/10 dark:from-cyan-950/30 dark:via-slate-800/90 dark:to-lime-950/30 border-2 border-[#8DB600]/60 dark:border-lime-500/40 flex flex-col items-center justify-center p-3 text-center shadow-2xs">
                                        <Product3DVisual
                                            assetKey={selected3DKey}
                                            customImageUrl={active3DAssetMeta?.image_url}
                                            className="w-24 h-24 sm:w-28 sm:h-28"
                                        />
                                        <span className="mt-2 text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">
                                            {active3DAssetMeta.label}
                                        </span>
                                        <span className="text-[9px] font-mono font-bold text-[#5f7d00] dark:text-lime-400">
                                            Uniform 256×256
                                        </span>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Name <span className="text-rose-500">*</span></Label>
                                        <Input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g. Container (Round) or Refill (25L)"
                                            className="h-10 mt-1 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                            disabled={isDemo}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</Label>
                                            <div className="flex gap-1.5 mt-1">
                                                <Select
                                                    value={category}
                                                    onChange={e => {
                                                        const nextCat = e.target.value;
                                                        setCategory(nextCat);
                                                        if (!editing) {
                                                            setTrackStock(nextCat !== 'Refills/Services');
                                                        }
                                                    }}
                                                    className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                                                    disabled={isDemo}
                                                >
                                                    {mergedCategories.map(c => (
                                                        <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                                            {c}
                                                        </option>
                                                    ))}
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-10 w-10 px-0 rounded-xl shrink-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                                    onClick={() => setIsAddingCategory(prev => !prev)}
                                                    disabled={isDemo}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Barcode / SKU</Label>
                                            <Input
                                                value={barcode}
                                                onChange={e => setBarcode(e.target.value)}
                                                placeholder="Scan or enter code"
                                                className="h-10 mt-1 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900"
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>

                                    {isAddingCategory && (
                                        <div className="flex gap-2 p-3 bg-lime-50/60 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900/60 rounded-xl">
                                            <Input
                                                placeholder="New Category Name"
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                className="bg-white dark:bg-slate-900 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                                disabled={isDemo}
                                            />
                                            <Button type="button" size="sm" onClick={addCategory} className="bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs px-3 rounded-lg cursor-pointer" disabled={isDemo}>Add</Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 1B: Pick from Saved 3D Icons & Product Visuals */}
                            <Product3DIconPicker
                                selectedKey={selected3DKey}
                                onSelect={handleSelect3DAsset}
                                compact
                                isAdmin={isAdmin}
                            />

                            <hr className="border-slate-100 dark:border-slate-800" />

                            {/* Section 2: Pricing & Live Margin Calculator */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-[#8DB600] dark:text-lime-400">Pricing &amp; Profit Margin</h4>
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-[#8DB600] dark:text-lime-400" /> Live Margin Calc
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Supplier Cost (₱)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={cost}
                                            onChange={e => setCost(e.target.value)}
                                            placeholder="0.00"
                                            className="h-10 mt-1 font-mono font-bold text-slate-900 dark:text-slate-100 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                            disabled={isDemo}
                                        />
                                    </div>

                                    <div className="p-3 sm:p-3.5 bg-lime-50/50 dark:bg-lime-950/30 rounded-xl sm:rounded-2xl border border-lime-200 dark:border-lime-900/60">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#5f7d00] dark:text-lime-400">Selling Price (₱) <span className="text-rose-500">*</span></Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="h-10 mt-1 font-mono font-black text-[#8DB600] dark:text-lime-400 text-base rounded-xl bg-white dark:bg-slate-900 border-lime-300 dark:border-lime-800/70"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>

                                {/* Live Profit Margin Indicator Strip */}
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Estimated Gross Profit:</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-mono font-bold ${liveProfitMetrics.profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            ₱{liveProfitMetrics.profit.toFixed(2)}
                                        </span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${liveProfitMetrics.profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'}`}>
                                            {liveProfitMetrics.margin}% Margin
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            {/* Section 3: Physical Goods vs Refill Service Mode */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Stock &amp; Tracking Mode</h4>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={trackStock}
                                            onChange={e => setTrackStock(e.target.checked)}
                                            className="rounded text-[#8DB600] focus:ring-[#8DB600] dark:bg-slate-800 dark:border-slate-700"
                                        />
                                        <span>Track Physical Stock</span>
                                    </label>
                                </div>

                                {trackStock ? (
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Starting Stock On-Hand</Label>
                                            <Input
                                                type="number"
                                                value={stock}
                                                onChange={e => setStock(e.target.value)}
                                                disabled={(editing && !isAdmin) || isDemo}
                                                className="h-10 mt-1 font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Low Stock Alert Level</Label>
                                            <Input
                                                type="number"
                                                value={minStock}
                                                onChange={e => setMinStock(e.target.value)}
                                                className="h-10 mt-1 font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-300 text-xs">
                                        <strong>Service Mode Selected:</strong> This item (e.g. Walk-in water refill) does not decrement warehouse units upon checkout.
                                    </div>
                                )}
                            </div>

                            {/* Section 4: Wholesale Break Bulk Relationships */}
                            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                                    Bulk Pack Relationship (Optional)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">Parent Wholesale Pack</Label>
                                        <Select
                                            value={parentId || ''}
                                            onChange={e => setParentId(e.target.value || null)}
                                            className="h-10 mt-1 text-xs bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/60 text-slate-900 dark:text-slate-100 rounded-xl"
                                            disabled={isDemo}
                                        >
                                            <option value="" className="bg-white dark:bg-slate-900">-- No Parent (Standalone) --</option>
                                            {products.filter(p => p.id !== editing?.id).map(p => (
                                                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">Units Per Case</Label>
                                        <Input
                                            type="number"
                                            value={conversionRate}
                                            onChange={e => setConversionRate(e.target.value)}
                                            disabled={!parentId || isDemo}
                                            placeholder="e.g. 24"
                                            className="h-10 mt-1 text-xs font-mono text-center bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/60 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/95 flex items-center justify-end gap-2.5">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={closeModal}
                                disabled={isMutating}
                                className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveClick}
                                disabled={isMutating || isDemo}
                                className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {isMutating ? 'Saving...' : (editing ? 'Update Product' : 'Create Product')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}