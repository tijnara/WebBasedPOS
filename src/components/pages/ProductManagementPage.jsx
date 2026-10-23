// src/components/pages/ProductManagementPage.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogCloseButton, Select
} from '../ui';
import Pagination from '../Pagination';

import { useProducts } from '../../hooks/useProducts';
import {
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct
} from '../../hooks/useProductMutations';

import currency from 'currency.js';
import { EditIcon, DeleteIcon, PackageIcon } from '../Icons';
import {
    Image as ImageIcon, Eye, EyeOff, Download, Plus,
    Layers, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Filter, Boxes
} from 'lucide-react';

// --- Image Uploader UI ---
const ImageUploader = ({ previewUrl, onFileSelect, disabled }) => {
    const fileInputRef = useRef(null);

    const handleDivClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileSelect(file);
    };

    return (
        <div
            onClick={handleDivClick}
            className={`cursor-pointer group relative w-full aspect-square bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#8DB600] rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-xs bg-black/60 px-2.5 py-1 rounded-lg">Change Image</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-[#8DB600] transition-colors p-3 text-center">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center mb-2">
                        <PackageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Upload Image</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Click to browse 1:1 image</span>
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
            />
        </div>
    );
};

export default function ProductManagementPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: productsData = { products: [], totalPages: 1 }, isLoading, refetch: refetchProducts } = useProducts({
        page: currentPage,
        itemsPerPage,
        searchTerm: debouncedSearchTerm,
        category: categoryFilter,
        isHidden: true
    });

    const products = productsData.products;
    const totalPages = productsData.totalPages;

    const { addToast, user } = useStore(s => ({ addToast: s.addToast, user: s.user }));
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.isadmin === true;
    const isDemo = user?.isDemo;

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    // Form State
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [cost, setCost] = useState('0');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('General');
    const [stock, setStock] = useState(0);
    const [minStock, setMinStock] = useState(5);
    const [trackStock, setTrackStock] = useState(true);
    const [parentId, setParentId] = useState(null);
    const [conversionRate, setConversionRate] = useState('');
    const [isHidden, setIsHidden] = useState(false);

    const searchInputRef = useRef(null);

    // Custom Categories
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

    // Live Margin Calculations
    const liveProfitMetrics = useMemo(() => {
        const sell = parseFloat(price) || 0;
        const buy = parseFloat(cost) || 0;
        const profit = sell - buy;
        const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : 0;
        return { profit, margin };
    }, [price, cost]);

    // KPI Metrics
    const kpiMetrics = useMemo(() => {
        const total = products.length;
        const visible = products.filter(p => !p.is_hidden).length;
        const hidden = products.filter(p => p.is_hidden).length;
        const lowStock = products.filter(p => Number(p.stock) <= Number(p.minStock || 5) && Number(p.stock) > 0).length;
        return { total, visible, hidden, lowStock };
    }, [products]);

    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
        setCost(String(p?.cost ?? 0));
        setImageFile(null);
        setImagePreview(p?.image_url || null);
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
        setImageFile(null);
        setImagePreview(null);
        setBarcode('');
        setCategory('General');
        setStock(0);
        setMinStock(5);
        setTrackStock(true);
        setParentId(null);
        setConversionRate('');
        setUploading(false);
        setIsAddingCategory(false);
        setNewCategoryName('');
        setIsHidden(false);
    };

    const handleFileSelect = (file) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const uploadImage = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('products').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            addToast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
            return null;
        }
    };

    const save = async (e) => {
        e.preventDefault();
        const parsedPrice = currency(price).value;

        if (!name.trim() || !price) {
            addToast({ title: 'Missing Information', description: 'Name and Price are required.', variant: 'destructive' });
            return;
        }

        setUploading(true);
        let imageUrl = editing?.image_url || null;

        if (imageFile) {
            const uploadedUrl = await uploadImage(imageFile);
            if (uploadedUrl) imageUrl = uploadedUrl;
            else {
                setUploading(false);
                return;
            }
        }

        const payload = {
            name: name.trim(),
            price: parsedPrice,
            cost: currency(cost || '0').value,
            image_url: imageUrl,
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
            if (editing) {
                await updateProduct.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'Product Updated', description: `${name} has been updated.`, variant: 'success' });
            } else {
                await createProduct.mutateAsync(payload);
                addToast({ title: 'Product Added', description: `${name} created successfully.`, variant: 'success' });
            }
            closeModal();
        } catch (err) {
            addToast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
        } finally {
            setUploading(false);
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
            refetchProducts();
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
        const headers = ['ID', 'Name', 'Barcode', 'Category', 'Price', 'Cost', 'Stock', 'Min_Stock', 'Status'];
        const rows = products.map(p => [
            p.id,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            p.barcode || '',
            p.category || 'General',
            p.price || 0,
            p.cost || 0,
            p.stock || 0,
            p.minStock || 5,
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
    const mergedCategories = Array.from(new Set(['General', 'Refills/Services', 'Containers', 'Bottled Water', 'Ice Cubes/Tubes', ...categoriesFromProducts, ...customCategories]));
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

    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending || uploading;

    return (
        <div className="product-page responsive-page max-w-7xl mx-auto space-y-6 p-4 md:p-6">

            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Management</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Control refilling services, bottle inventory, unit pricing, and POS availability.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="h-10 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </Button>
                    <Button
                        variant="primary"
                        onClick={openModal}
                        className="h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                        disabled={isDemo}
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add Product</span>
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Catalog Items</span>
                        <span className="text-xl font-black text-slate-900">{kpiMetrics.total}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active in POS</span>
                        <span className="text-xl font-black text-[#8DB600]">{kpiMetrics.visible}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-lime-50 text-[#8DB600] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hidden / Inactive</span>
                        <span className="text-xl font-black text-slate-600">{kpiMetrics.hidden}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                        <EyeOff className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Warning</span>
                        <span className="text-xl font-black text-amber-600">{kpiMetrics.lowStock}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1 max-w-xl">
                    <div className="w-full sm:w-72">
                        <Input
                            ref={searchInputRef}
                            placeholder="Search products by name or barcode... (/)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border-slate-200 text-xs sm:text-sm h-10 rounded-xl focus:border-[#8DB600] focus:ring-[#8DB600]"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-slate-50 border-slate-200 text-xs sm:text-sm h-10 rounded-xl"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <ScrollArea>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                                    <TableHead className="w-[32%] px-5 py-3.5">Product</TableHead>
                                    <TableHead className="px-4 py-3.5">Category</TableHead>
                                    <TableHead className="px-4 py-3.5">Selling Price</TableHead>
                                    <TableHead className="px-4 py-3.5">Inventory</TableHead>
                                    <TableHead className="px-4 py-3.5">POS Status</TableHead>
                                    <TableHead className="px-4 py-3.5">Last Updated</TableHead>
                                    <TableHead className="px-5 py-3.5 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Loading catalog...</TableCell></TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">No products matching criteria.</TableCell></TableRow>
                                ) : (
                                    products.map(p => {
                                        const isService = p.category === 'Refills/Services' || p.track_stock === false;
                                        const isLow = !isService && Number(p.stock) <= Number(p.minStock || 5) && Number(p.stock) > 0;
                                        const isOut = !isService && Number(p.stock) === 0;

                                        return (
                                            <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors ${p.is_hidden ? 'opacity-60 bg-slate-50/40' : ''}`}>
                                                <TableCell className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        {/* Thumbnail */}
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                                                            {p.image_url ? (
                                                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <PackageIcon className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-slate-900 truncate">{p.name}</span>
                                                            {p.barcode && <span className="text-[10px] font-mono text-slate-400">{p.barcode}</span>}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                                                        {p.category || 'General'}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5 font-black text-sm text-[#8DB600]">
                                                    {currency(p.price || 0, { symbol: '₱' }).format()}
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5">
                                                    {isService ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                            Service / Unlimited
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            isOut
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : isLow
                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    : 'bg-lime-50 text-[#5f7d00] border border-lime-200'
                                                        }`}>
                                                            {Number(p.stock || 0).toLocaleString()} units
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Soft Status Pill */}
                                                <TableCell className="px-4 py-3.5">
                                                    {p.is_hidden ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                                            <EyeOff className="w-3 h-3 text-slate-400" /> Hidden
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Visible
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="px-4 py-3.5 text-xs text-slate-500 font-medium">
                                                    {formatDate(p.updated_at)}
                                                </TableCell>

                                                <TableCell className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Restock Shortcut to Inventory Page */}
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push(`/inventory?restockProductId=${p.id}`)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-[#8DB600] hover:bg-lime-50 hover:border-lime-300 transition-colors"
                                                            title="Restock in Inventory"
                                                            disabled={isDemo}
                                                        >
                                                            <Boxes className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => toggleHide(p)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                                            title={p.is_hidden ? "Show on POS" : "Hide from POS"}
                                                            disabled={isDemo}
                                                        >
                                                            {p.is_hidden ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(p)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit Details"
                                                            disabled={isDemo}
                                                        >
                                                            <EditIcon className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => remove(p)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
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
                    <div className="p-3.5 border-t border-slate-100 flex justify-end">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
                {isLoading ? (
                    <div className="text-center text-slate-400 p-8">Loading products...</div>
                ) : products.length === 0 ? (
                    <div className="text-center text-slate-400 p-8 bg-white rounded-2xl border border-slate-200">
                        No products found.
                    </div>
                ) : (
                    products.map(p => (
                        <div key={p.id} className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 ${p.is_hidden ? 'opacity-60 bg-slate-50' : ''}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <PackageIcon className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-slate-900 truncate">{p.name}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{p.category || 'General'}</div>
                                    <div className="font-black text-sm text-[#8DB600] mt-1">
                                        {currency(p.price || 0, { symbol: '₱' }).format()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {p.is_hidden ? (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                        Hidden
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Visible
                                    </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/inventory?restockProductId=${p.id}`)}
                                        className="p-1.5 text-[#8DB600] border border-slate-200 rounded-lg"
                                        title="Restock"
                                        disabled={isDemo}
                                    >
                                        <Boxes className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => toggleHide(p)} className="p-1.5 text-slate-500 border border-slate-200 rounded-lg" disabled={isDemo}>
                                        {p.is_hidden ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => startEdit(p)} className="p-1.5 text-blue-600 border border-slate-200 rounded-lg" disabled={isDemo}>
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => remove(p)} className="p-1.5 text-rose-600 border border-slate-200 rounded-lg" disabled={isDemo}>
                                        <DeleteIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div className="pt-2">
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={setCurrentPage} />
                </div>
            </div>

            {/* ADD / EDIT PRODUCT MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 sm:max-w-[700px] w-full bg-white shadow-2xl border-0 overflow-hidden rounded-3xl">
                    <form onSubmit={save}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                                    {editing ? 'Edit Product Details' : 'Add New Inventory Item'}
                                </DialogTitle>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {editing ? `SKU Item ID: #${editing.id}` : 'Fill in the information below to add an item to POS.'}
                                </p>
                            </div>
                            <DialogCloseButton onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full" />
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">

                            {/* Section 1: Basic Info & Image */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div className="md:col-span-1">
                                    <Label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Product Photo</Label>
                                    <ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} disabled={isDemo} />
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Product Name <span className="text-rose-500">*</span></Label>
                                        <Input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required
                                            placeholder="e.g. 5-Gallon Round Container"
                                            className="h-10 mt-1 text-sm rounded-xl border-slate-200 focus:border-[#8DB600]"
                                            disabled={isDemo}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Category</Label>
                                            <div className="flex gap-1.5 mt-1">
                                                <Select value={category} onChange={e => setCategory(e.target.value)} className="h-10 text-xs rounded-xl" disabled={isDemo}>
                                                    {mergedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-10 w-10 px-0 rounded-xl shrink-0"
                                                    onClick={() => setIsAddingCategory(prev => !prev)}
                                                    disabled={isDemo}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Barcode / SKU</Label>
                                            <Input
                                                value={barcode}
                                                onChange={e => setBarcode(e.target.value)}
                                                placeholder="Scan or enter code"
                                                className="h-10 mt-1 text-xs font-mono rounded-xl border-slate-200"
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>

                                    {isAddingCategory && (
                                        <div className="flex gap-2 p-3 bg-lime-50/60 border border-lime-200 rounded-xl">
                                            <Input
                                                placeholder="New Category Name"
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                className="bg-white h-9 text-xs rounded-lg"
                                                disabled={isDemo}
                                            />
                                            <Button type="button" size="sm" onClick={addCategory} className="bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs px-3 rounded-lg" disabled={isDemo}>Add</Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section 2: Pricing & Live Margin Calculator */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-[#8DB600]">Pricing & Profit Margin</h4>
                                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-[#8DB600]" /> Live Margin Calc
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier Cost (₱)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={cost}
                                            onChange={e => setCost(e.target.value)}
                                            placeholder="0.00"
                                            className="h-10 mt-1 font-mono font-bold text-slate-900 rounded-xl bg-white"
                                            disabled={isDemo}
                                        />
                                    </div>

                                    <div className="p-3.5 bg-lime-50/50 rounded-2xl border border-lime-200">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#5f7d00]">Selling Price (₱) <span className="text-rose-500">*</span></Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="h-10 mt-1 font-mono font-black text-[#8DB600] text-base rounded-xl bg-white border-lime-300"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>

                                {/* Live Profit Margin Indicator Strip */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                                    <span className="text-slate-600 font-medium">Estimated Gross Profit:</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-mono font-bold ${liveProfitMetrics.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                            ₱{liveProfitMetrics.profit.toFixed(2)}
                                        </span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${liveProfitMetrics.profit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                            {liveProfitMetrics.margin}% Margin
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section 3: Physical Goods vs Refill Service Mode */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Stock & Tracking Mode</h4>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={trackStock}
                                            onChange={e => setTrackStock(e.target.checked)}
                                            className="rounded text-[#8DB600] focus:ring-[#8DB600]"
                                        />
                                        <span>Track Physical Stock</span>
                                    </label>
                                </div>

                                {trackStock ? (
                                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Starting Stock On-Hand</Label>
                                            <Input
                                                type="number"
                                                value={stock}
                                                onChange={e => setStock(e.target.value)}
                                                disabled={editing && !isAdmin || isDemo}
                                                className="h-10 mt-1 font-mono font-bold bg-white rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Low Stock Alert Level</Label>
                                            <Input
                                                type="number"
                                                value={minStock}
                                                onChange={e => setMinStock(e.target.value)}
                                                className="h-10 mt-1 font-mono font-bold bg-white rounded-xl"
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
                                        <strong>Service Mode Selected:</strong> This item (e.g. Walk-in water refill) does not decrement warehouse units upon checkout.
                                    </div>
                                )}
                            </div>

                            {/* Section 4: Wholesale Break Bulk Relationships */}
                            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                                    Bulk Pack Relationship (Optional)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-[11px] font-bold text-amber-900">Parent Wholesale Pack</Label>
                                        <Select
                                            value={parentId || ''}
                                            onChange={e => setParentId(e.target.value || null)}
                                            className="h-10 mt-1 text-xs bg-white rounded-xl"
                                            disabled={isDemo}
                                        >
                                            <option value="">-- No Parent (Standalone) --</option>
                                            {products.filter(p => p.id !== editing?.id).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-[11px] font-bold text-amber-900">Units Per Case</Label>
                                        <Input
                                            type="number"
                                            value={conversionRate}
                                            onChange={e => setConversionRate(e.target.value)}
                                            disabled={!parentId || isDemo}
                                            placeholder="e.g. 24"
                                            className="h-10 mt-1 text-xs font-mono text-center bg-white rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={closeModal}
                                disabled={isMutating}
                                className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isMutating || isDemo}
                                className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                            >
                                {isMutating ? 'Saving...' : (editing ? 'Update Product' : 'Create Product')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}