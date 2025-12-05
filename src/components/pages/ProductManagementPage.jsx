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
            className="cursor-pointer group relative w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden"
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

    const { data: productsData = { products: [], totalPages: 1 }, isLoading } = useProducts({ page: currentPage, itemsPerPage, searchTerm: debouncedSearchTerm, category: categoryFilter });
    const products = productsData.products;
    const totalPages = productsData.totalPages;
    const addToast = useStore(s => s.addToast);

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

    const remove = async (p) => {
        if (!confirm(`Delete ${p.name}?`)) return;
        try {
            await deleteProduct.mutateAsync(p.id);
            addToast({ title: 'Deleted', description: `${p.name} deleted` });
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message });
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

    const filteredProducts = products || [];
    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending || uploading;

    return (
        <div className="product-page">
            {/* --- FILTER BAR --- */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <Input
                            ref={searchInputRef}
                            placeholder="Search products... (F)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="hidden md:inline-flex"
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
                    <Button variant="primary" onClick={openModal} className="w-full md:w-auto">Add Product</Button>
                </div>
            </div>

            {/* --- DESKTOP TABLE --- */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <ScrollArea>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8">No products found.</TableCell></TableRow>
                                ) : (
                                    filteredProducts.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {/* FORCED IMAGE SIZE: Desktop */}
                                                    <div
                                                        className="rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0"
                                                        style={{ width: '48px', height: '48px' }}
                                                    >
                                                        {p.image_url ? (
                                                            <img
                                                                src={p.image_url}
                                                                alt={p.name}
                                                                className="object-cover"
                                                                style={{ width: '100%', height: '100%' }}
                                                            />
                                                        ) : (
                                                            <PackageIcon className="h-6 w-6 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">{p.name}</span>
                                                        {p.barcode && <span className="text-xs text-gray-500 font-mono">{p.barcode}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {p.category || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900">
                                                    {currency(p.price, { symbol: '₱' }).format()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                    Number(p.stock) <= Number(p.minStock)
                                                        ? 'bg-red-50 text-red-700 border-red-100'
                                                        : 'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                    {p.stock} units
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="text-blue-600 h-8 w-8"><EditIcon /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => remove(p)} className="text-red-600 h-8 w-8"><DeleteIcon /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </CardContent>
            </Card>

            {/* --- MOBILE LIST VIEW (Compact Cards) --- */}
            <div className="block md:hidden space-y-3">
                {isLoading ? (
                    <div className="text-center text-muted p-6">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center text-muted p-6 bg-white rounded-lg border border-dashed">
                        No products found.
                    </div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
                            {/* 1. Fixed Thumbnail Area (Strictly Forced Dimensions) */}
                            <div className="flex-shrink-0">
                                <div
                                    className="rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden"
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
                                        <PackageIcon className="h-8 w-8 text-gray-300" />
                                    )}
                                </div>
                            </div>

                            {/* 2. Product Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between" style={{ height: '64px' }}>
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                        {p.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {p.category || 'General'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <div className="font-bold text-primary text-sm">
                                        {currency(p.price || 0, { symbol: '₱' }).format()}
                                    </div>

                                    {/* Stock Status */}
                                    <div className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                        Number(p.stock) <= Number(p.minStock)
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-green-50 text-green-600'
                                    }`}>
                                        {p.stock} in stock
                                    </div>
                                </div>
                            </div>

                            {/* 3. Actions Column */}
                            <div className="flex flex-col justify-between pl-2 border-l border-gray-50" style={{ height: '64px' }}>
                                <button
                                    onClick={() => startEdit(p)}
                                    className="text-blue-600 p-1 hover:bg-blue-50 rounded"
                                >
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => remove(p)}
                                    className="text-red-500 p-1 hover:bg-red-50 rounded"
                                >
                                    <DeleteIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
                {/* Pagination for Mobile */}
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages || 1}
                        onPageChange={page => setCurrentPage(page)}
                    />
                </div>
            </div>

            {/* --- MODAL (2-Column Layout) --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    className="p-0 overflow-hidden w-full !max-w-4xl bg-white shadow-xl border border-gray-100"
                    style={{ backgroundColor: 'white', maxWidth: '900px', zIndex: 50 }}
                >
                    <form onSubmit={save} className="flex flex-col h-full max-h-[90vh]">
                        <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                {editing ? 'Edit Product' : 'Add New Product'}
                            </DialogTitle>
                            <DialogCloseButton onClick={closeModal} />
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Left Column: Visuals */}
                                <div className="w-full md:w-1/3 space-y-4">
                                    <Label className="text-sm font-semibold text-gray-700">Product Image</Label>
                                    <ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} />
                                    <p className="text-xs text-gray-500 text-center">Allowed: .jpg, .png. Max 2MB.</p>
                                </div>

                                {/* Right Column: Details */}
                                <div className="w-full md:w-2/3 space-y-6">
                                    {/* General Info */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="productName">Product Name <span className="text-red-500">*</span></Label>
                                            <Input id="productName" ref={productNameRef} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Chips (Large)" className="h-11" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Category</Label>
                                            <div className="flex gap-2">
                                                <Select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 h-11">
                                                    {mergedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </Select>
                                                <Button type="button" variant="outline" onClick={() => setIsAddingCategory(prev => !prev)} className="h-11 px-4">+ Add</Button>
                                            </div>
                                            {isAddingCategory && (
                                                <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                                    <Input placeholder="New Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="h-10 text-sm" />
                                                    <Button type="button" size="sm" onClick={addCategory}>Save</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5 relative">
                                            <Label htmlFor="price">Selling Price <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                                <Input id="price" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="pl-8 h-11" placeholder="0.00" required />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 relative">
                                            <Label htmlFor="cost">Cost Price</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                                <Input id="cost" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} className="pl-8 h-11" placeholder="0.00" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inventory */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="stock">Current Stock</Label>
                                            <Input id="stock" type="number" value={stock} onChange={e => setStock(e.target.value)} className="h-11 bg-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="minStock">Low Stock Alert</Label>
                                            <Input id="minStock" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="h-11 bg-white" />
                                        </div>
                                    </div>

                                    {/* Advanced: Barcode */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="barcode">Barcode / SKU</Label>
                                        <Input id="barcode" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Scan or type code" className="h-11" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating} className="px-6">Cancel</Button>
                                <Button type="submit" disabled={isMutating} className="px-8 btn--primary font-semibold">{uploading ? 'Uploading...' : isMutating ? 'Saving...' : 'Save Product'}</Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}