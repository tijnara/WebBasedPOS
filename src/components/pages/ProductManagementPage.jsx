// src/components/pages/ProductManagementPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Select
} from '../ui';
import Pagination from '../Pagination';

// --- Import Hooks ---
import { useProducts } from '../../hooks/useProducts';
import {
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct
} from '../../hooks/useProductMutations';

import currency from 'currency.js';
import { EditIcon, DeleteIcon, PackageIcon } from '../Icons';
import { Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

// --- Component: Image Uploader UI (Helper) ---
const ImageUploader = ({ previewUrl, onFileSelect }) => {
    const fileInputRef = useRef(null);

    const handleDivClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div
            onClick={handleDivClick}
            className="cursor-pointer group relative w-full aspect-square bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-primary rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden"
        >
            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium text-sm">Change Image</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover:text-primary transition-colors">
                    <PackageIcon className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">Upload Image</span>
                    <span className="text-xs text-gray-400 mt-1">Click to browse</span>
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default function ProductManagementPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: productsData = { products: [], totalPages: 1 }, isLoading, refetch: refetchProducts } = useProducts({ page: currentPage, itemsPerPage, searchTerm: debouncedSearchTerm, category: categoryFilter, isHidden: true });
    const products = productsData.products;
    const totalPages = productsData.totalPages;

    const { addToast, user } = useStore(s => ({ addToast: s.addToast, user: s.user }));
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    // Form State
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('General');
    const [stock, setStock] = useState(0);
    const [minStock, setMinStock] = useState(5);
    const [cost, setCost] = useState('0');
    const [parentId, setParentId] = useState(null);
    const [conversionRate, setConversionRate] = useState('');
    const [isHidden, setIsHidden] = useState(false);

    // UI Refs
    const productNameRef = useRef(null);
    const searchInputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Custom Categories Logic
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
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) searchInputRef.current.focus();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
        setImageFile(null);
        setImagePreview(p?.image_url || null);
        setBarcode(p?.barcode || '');
        setCategory(p?.category || 'General');
        setStock(Number(p?.stock ?? 0));
        setMinStock(Number(p?.minStock ?? 5));
        setCost(String(p?.cost ?? 0));
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
        setImageFile(null);
        setImagePreview(null);
        setBarcode('');
        setCategory('General');
        setStock(0);
        setMinStock(5);
        setCost('0');
        setParentId(null);
        setConversionRate('');
        setUploading(false);
        setIsAddingCategory(false);
        setNewCategoryName('');
        setIsHidden(false);
    };

    const handleFileSelect = (file) => {
        setImageFile(file);
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);
    };

    const uploadImage = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('products').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image: ', error);
            addToast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
            return null;
        }
    };

    const save = async (e) => {
        e.preventDefault();
        const parsedPrice = currency(price).value;

        if (!name || !price) {
            addToast({ title: 'Error', description: 'Name and Price are required.', variant: 'destructive' });
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
            name,
            price: parsedPrice,
            image_url: imageUrl,
            barcode: barcode?.trim() || null,
            stock: Math.max(0, parseInt(stock, 10) || 0),
            minStock: Math.max(0, parseInt(minStock, 10) || 0),
            cost: currency(cost || '0').value,
            category: category || 'General',
            parent_product_id: parentId,
            conversion_rate: conversionRate ? parseInt(conversionRate, 10) : null,
            is_hidden: isHidden,
        };

        try {
            if (editing) {
                await updateProduct.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'Updated', description: `Product ${name} updated`, variant: 'success' });
            } else {
                await createProduct.mutateAsync(payload);
                addToast({ title: 'Created', description: `Product ${name} created`, variant: 'success' });
            }
            closeModal();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const toggleVisibility = async (p) => {
        const newVisibility = !p.is_hidden;
        try {
            await updateProduct.mutateAsync({ id: p.id, is_hidden: newVisibility });
            addToast({
                title: 'Visibility Updated',
                description: `${p.name} is now ${newVisibility ? 'hidden' : 'visible'}.`,
                variant: 'success'
            });
            refetchProducts();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: 'Failed to update visibility.', variant: 'destructive' });
        }
    };

    const remove = async (p) => {
        if (!confirm(`Delete ${p.name}?`)) return;
        try {
            await deleteProduct.mutateAsync(p.id);
            addToast({ title: 'Deleted', description: `${p.name} deleted`, variant: 'success' });
        } catch (e) {
            console.error(e);
            if (e.code === '23503') {
                addToast({
                    title: 'Cannot Delete Product',
                    description: 'This product is currently in use (e.g., as a Parent Product for other items or in sales history) and cannot be deleted.',
                    variant: 'destructive'
                });
            } else {
                addToast({ title: 'Error', description: e.message || 'Failed to delete product', variant: 'destructive' });
            }
        }
    };

    const categoriesFromProducts = Array.from(new Set((products || []).map(p => (p.category || 'General').trim()))).filter(Boolean);
    const mergedCategories = Array.from(new Set(['General', ...categoriesFromProducts, ...customCategories]));
    const categories = ['All', ...mergedCategories];

    const addCategory = () => {
        const name = (newCategoryName || '').trim();
        if (!name) return;
        if (!mergedCategories.some(c => c.toLowerCase() === name.toLowerCase())) {
            setCustomCategories(prev => [...prev, name]);
            try { localStorage.setItem('pos_custom_categories', JSON.stringify([...customCategories, name])); } catch {}
        }
        setCategory(name);
        setIsAddingCategory(false);
        setNewCategoryName('');
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // ... CSV logic
    };

    const toggleHide = async (p) => {
        try {
            await updateProduct.mutateAsync({ ...p, is_hidden: !p.is_hidden });
            addToast({ title: 'Success', description: `Product is now ${!p.is_hidden ? 'hidden' : 'visible'}.`, variant: 'success' });
        } catch (e) {
            addToast({ title: 'Error', description: 'Failed to update visibility.', variant: 'destructive' });
        }
    };

    const filteredProducts = products || [];
    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending || uploading;

    return (
        <div className="product-page responsive-page">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h1>
                <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">Manage your inventory items, pricing, and availability</p>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <Input
                            ref={searchInputRef}
                            placeholder="Search products... (F)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="hidden md:inline-flex h-11 rounded-xl dark:border-slate-700 dark:text-slate-200"
                    >
                        Import CSV
                    </Button>
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleCSVUpload}
                    />
                    <Button variant="primary" onClick={openModal} className="w-full md:w-auto h-11 rounded-xl shadow-md font-semibold">Add Product</Button>
                </div>
            </div>

            {/* --- DESKTOP TABLE --- */}
            <Card className="hidden md:block border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <ScrollArea>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12">Loading inventory...</TableCell></TableRow>
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12">No products found.</TableCell></TableRow>
                                ) : (
                                    filteredProducts.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">
                                                            {p.name}
                                                        </span>
                                                        {p.barcode && <span className="text-xs font-mono">{p.barcode}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                                                    {p.category || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-black text-[16px] text-green-600 dark:text-green-400">
                                                    {currency(p.price, { symbol: '₱' }).format()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    Number(p.stock) <= Number(p.minStock)
                                                        ? 'bg-red-50 text-black dark:bg-red-900/80 dark:text-red-300'
                                                        : 'bg-green-50 text-black dark:bg-green-900/80 dark:text-green-400'
                                                }`}>
                                                    {p.stock} units
                                                </span>
                                            </TableCell>
                                            <TableCell className={`transition-colors ${p.is_hidden ? 'bg-red-600 dark:bg-red-900' : ''}`}>
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${p.is_hidden ? 'text-white' : 'text-black dark:text-green-400'}`}>
                                                    {p.is_hidden ? 'Hidden' : 'Visible'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => toggleHide(p)} className="hover:bg-slate-800 h-8 w-8" title={p.is_hidden ? "Unhide from POS" : "Hide from POS"}>
                                                        {p.is_hidden ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 h-8 w-8"><EditIcon /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => remove(p)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 h-8 w-8"><DeleteIcon /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <div className="p-4 border-t border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </CardContent>
            </Card>

            {/* --- MOBILE LIST VIEW (Compact Cards) --- */}
            <div className="block md:hidden space-y-3">
                {isLoading ? (
                    <div className="text-center text-muted p-6">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center text-muted p-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        No products found.
                    </div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className={`bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-start gap-3 transition-colors ${p.is_hidden ? 'opacity-70 bg-red-50 dark:bg-red-900' : ''}`}>
                            <div className="flex-shrink-0">
                                <div
                                    className="rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden"
                                    style={{ width: '64px', height: '64px' }}
                                >
                                    {p.image_url ? (
                                        <img
                                            src={p.image_url}
                                            alt={p.name}
                                            className="object-cover"
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    ) : (
                                        <PackageIcon className="h-8 w-8" />
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between" style={{ height: '64px' }}>
                                <div>
                                    <div className="font-semibold text-sm leading-tight truncate flex items-center gap-1.5">
                                        {p.name}
                                        {p.is_hidden && <span className="text-[9px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Hidden</span>}
                                    </div>
                                    <div className="text-xs mt-0.5">
                                        {p.category || 'General'}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="font-bold text-sm text-green-600 dark:text-green-400">
                                        {currency(p.price || 0, { symbol: '₱' }).format()}
                                    </div>

                                </div>
                            </div>

                            <div className="flex flex-col justify-between pl-2" style={{ height: '64px' }}>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => toggleHide(p)}
                                        className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        title={p.is_hidden ? "Unhide" : "Hide"}
                                    >
                                        {p.is_hidden ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => startEdit(p)}
                                        className="text-blue-600 dark:text-blue-400 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => remove(p)}
                                        className="text-red-500 dark:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                                    >
                                        <DeleteIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div className="mt-4 pb-12">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages || 1}
                        onPageChange={page => setCurrentPage(page)}
                    />
                </div>
            </div>

            {/* --- ADD/EDIT PRODUCT MODAL --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 sm:max-w-[700px] w-full bg-white dark:bg-slate-900 shadow-2xl border-0 overflow-hidden rounded-2xl">
                    <form onSubmit={save}>

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80 flex flex-row items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    {editing ? 'Edit Product Details' : 'Add New Inventory Item'}
                                </DialogTitle>
                                <p className="text-xs mt-1 font-medium">
                                    {editing ? `Updating SKU/ID: ${editing.id}` : 'Fill in the details to create a new inventory item.'}
                                </p>
                            </div>
                            <DialogCloseButton onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-full p-1.5 transition-colors" />
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8 custom-scrollbar">
                            <div className="space-y-8">
                                {/* Section 1: Basic Info & Media */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-bold mb-2 block uppercase tracking-wide">Product Image</Label>
                                        <ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} />
                                        <p className="text-[10px] mt-3 text-center italic leading-tight">
                                            Recommended: Square (1:1) PNG or JPG format
                                        </p>
                                    </div>

                                    <div className="md:col-span-2 space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="text-sm font-semibold">Product Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="name"
                                                ref={productNameRef}
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                required
                                                placeholder="e.g. Purified Water (5 Gal)"
                                                className="bg-gray-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 h-11 rounded-xl focus:bg-white dark:focus:bg-slate-900 transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                                                <div className="flex gap-2">
                                                    <Select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 h-11 rounded-xl">
                                                        {mergedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </Select>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="shrink-0 h-11 w-11 rounded-xl border-gray-200 dark:border-slate-700"
                                                        onClick={() => setIsAddingCategory(prev => !prev)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="barcode" className="text-sm font-semibold">Barcode / SKU</Label>
                                                <Input
                                                    id="barcode"
                                                    value={barcode}
                                                    onChange={e => setBarcode(e.target.value)}
                                                    placeholder="Scan or enter code"
                                                    className="bg-gray-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 h-11 font-mono text-sm rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        {isAddingCategory && (
                                            <div className="flex gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                                <Input
                                                    placeholder="New Category Name"
                                                    value={newCategoryName}
                                                    onChange={e => setNewCategoryName(e.target.value)}
                                                    className="bg-white dark:bg-slate-900 h-10 border-blue-200 dark:border-blue-800 rounded-xl"
                                                />
                                                <Button type="button" size="sm" onClick={addCategory} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4">Add</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-slate-800" />

                                {/* Section 2: Pricing & Inventory */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-3">
                                        <span className="w-8 h-0.5 bg-gray-200 dark:bg-slate-700"></span>
                                        Inventory & Pricing
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="grid gap-2 p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                                            <Label htmlFor="cost" className="text-[10px] font-black uppercase tracking-widest">Cost Price</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold">₱</span>
                                                <Input id="cost" type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} className="pl-8 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 h-10 rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="grid gap-2 p-5 bg-primary/5 dark:bg-green-500/5 rounded-2xl border border-primary/20 dark:border-green-500/20 transition-colors">
                                            <Label htmlFor="price" className="text-[10px] text-primary dark:text-green-500 font-black uppercase tracking-widest">Selling Price</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary dark:text-green-500 font-black">₱</span>
                                                <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="pl-8 bg-white dark:bg-slate-900 border-primary/20 dark:border-green-500/30 h-10 font-black rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="grid gap-2 p-5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
                                            <Label htmlFor="stock" className="text-[10px] font-black uppercase tracking-widest">Stock Level</Label>
                                            <Input id="stock" type="number" value={stock} onChange={e => setStock(e.target.value)} disabled={editing && !isAdmin} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 h-10 rounded-xl font-bold" />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 px-1">
                                        <div className="flex items-center gap-3">
                                            <Label htmlFor="minStock" className="text-sm font-semibold whitespace-nowrap italic">Low stock alert threshold:</Label>
                                            <Input id="minStock" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="w-24 bg-gray-50/50 dark:bg-slate-900 h-10 border-gray-200 dark:border-slate-700 rounded-xl text-center font-bold" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Advanced / Relationships */}
                                <div className="bg-amber-50/40 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 transition-colors">
                                    <h3 className="text-sm font-black text-amber-800 dark:text-amber-500 mb-4 flex items-center gap-3">
                                        Bulk Conversion (Advanced)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="parentId" className="text-xs font-bold text-amber-900/70 dark:text-amber-600 uppercase tracking-wider">Parent Product</Label>
                                            <Select id="parentId" value={parentId || ''} onChange={e => setParentId(e.target.value || null)} className="bg-white dark:bg-slate-900 border-amber-200/50 dark:border-amber-900/50 h-10 rounded-xl text-sm">
                                                <option value="">-- No Parent (Individual Item) --</option>
                                                {products.filter(p => p.id !== editing?.id).map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="conversionRate" className="text-xs font-bold text-amber-900/70 dark:text-amber-600 uppercase tracking-wider">Items per Case</Label>
                                            <Input
                                                id="conversionRate"
                                                type="number"
                                                value={conversionRate}
                                                onChange={e => setConversionRate(e.target.value)}
                                                disabled={!parentId}
                                                placeholder="e.g. 24"
                                                className="bg-white dark:bg-slate-900 border-amber-200/50 dark:border-amber-900/50 h-10 rounded-xl text-center font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80 flex items-center justify-end gap-3 mt-auto">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={closeModal}
                                disabled={isMutating}
                                className="px-6 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-600 border-gray-200 dark:border-slate-600 transition-colors"
                            >
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                disabled={isMutating}
                                className="px-8 h-10 rounded-xl shadow-md btn--primary font-bold text-sm hover:-translate-y-0.5 transition-transform"
                            >
                                {isMutating ? 'Processing...' : (editing ? 'Update Product' : 'Create Product')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}