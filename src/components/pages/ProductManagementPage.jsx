// src/components/pages/ProductManagementPage.jsx
// Force rebuild
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
            className="cursor-pointer group relative w-full aspect-square bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden"
        >
            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium text-sm">Change Image</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors">
                    <PackageIcon className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">Upload Image</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click to browse</span>
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
        <div className="product-page responsive-page dark:text-white">
            {/* --- FILTER BAR --- */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
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
            <Card className="hidden md:block border-0">
                <CardContent className="p-0">
                    <ScrollArea>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%] dark:text-white">Product</TableHead>
                                    <TableHead className="dark:text-white">Category</TableHead>
                                    <TableHead className="dark:text-white">Price</TableHead>
                                    <TableHead className="dark:text-white">Stock</TableHead>
                                    <TableHead className="dark:text-white">Status</TableHead>
                                    <TableHead className="dark:text-white">Last Updated</TableHead>
                                    <TableHead className="text-right dark:text-white">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8">No products found.</TableCell></TableRow>
                                ) : (
                                    filteredProducts.map(p => (
                                        <TableRow key={p.id} className={p.is_hidden ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                                            <TableCell className="dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0"
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
                                                            <PackageIcon className="h-6 w-6 text-gray-300 dark:text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 dark:text-white">
                                                            {p.name}
                                                            {p.is_hidden && <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">Hidden</span>}
                                                        </span>
                                                        {p.barcode && <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{p.barcode}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="dark:text-white">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                    {p.category || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="dark:text-white">
                                                <div className={`font-medium ${p.is_hidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {currency(p.price, { symbol: '₱' }).format()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="dark:text-white">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    Number(p.stock) <= Number(p.minStock)
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-green-50 text-green-700'
                                                }`}>
                                                    {p.stock} units
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${p.is_hidden ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                                                    {p.is_hidden ? 'Hidden' : 'Visible'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                                                {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => toggleHide(p)} className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8" title={p.is_hidden ? "Unhide from POS" : "Hide from POS"}>
                                                        {p.is_hidden ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4" />}
                                                    </Button>
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
                    <div className="text-center text-muted p-6 bg-white dark:bg-gray-800 rounded-lg">
                        No products found.
                    </div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className={`bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm flex items-start gap-3 ${p.is_hidden ? 'opacity-60' : ''}`}>
                            <div className="flex-shrink-0">
                                <div
                                    className="rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden"
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
                                        <PackageIcon className="h-8 w-8 text-gray-300 dark:text-gray-500" />
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between" style={{ height: '64px' }}>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate flex items-center gap-1.5">
                                        {p.name}
                                        {p.is_hidden && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">Hidden</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {p.category || 'General'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <div className="font-bold text-primary text-sm">
                                        {currency(p.price || 0, { symbol: '₱' }).format()}
                                    </div>

                                    <div className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                        Number(p.stock) <= Number(p.minStock)
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-green-50 text-green-600'
                                    }`}>
                                        {p.stock} in stock
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between pl-2" style={{ height: '64px' }}>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => toggleHide(p)}
                                        className="text-gray-500 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                                        title={p.is_hidden ? "Unhide" : "Hide"}
                                    >
                                        {p.is_hidden ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => startEdit(p)}
                                        className="text-blue-600 p-1 hover:bg-blue-50 dark:hover:bg-blue-800 rounded"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => remove(p)}
                                        className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-800 rounded"
                                    >
                                        <DeleteIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages || 1}
                        onPageChange={page => setCurrentPage(page)}
                    />
                </div>
            </div>

            {/* --- ADD/EDIT PRODUCT MODAL --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                {/* FIX: Forced width and max-width to ensure it expands properly */}
                <DialogContent className="w-[95vw] max-w-3xl p-0" style={{ maxWidth: '800px', width: '100%' }}>
                    <form onSubmit={save}>

                        {/* Header */}
                        <div className="px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-800/50 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                        {editing ? 'Edit Product' : 'Add New Product'}
                                    </DialogTitle>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {editing ? `Editing ID: ${editing.id}` : 'Fill in the details to create a new inventory item.'}
                                    </p>
                                </div>
                                <DialogCloseButton onClick={closeModal} />
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-6 max-h-[65vh] overflow-y-auto">
                            <div className="space-y-8">
                                {/* Section 1: Basic Info & Media */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-semibold mb-2 block">Product Image</Label>
                                        <ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} />
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center italic">
                                            Recommended: Square PNG or JPG
                                        </p>
                                    </div>

                                    <div className="md:col-span-2 space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="text-sm font-medium">Product Name</Label>
                                            <Input
                                                id="name"
                                                ref={productNameRef}
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                required
                                                placeholder="e.g. Purified Water (5 Gal)"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                                                <div className="flex gap-2">
                                                    <Select value={category} onChange={e => setCategory(e.target.value)} className="w-full">
                                                        {mergedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </Select>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="shrink-0"
                                                        onClick={() => setIsAddingCategory(prev => !prev)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="barcode" className="text-sm font-medium">Barcode / SKU</Label>
                                                <Input
                                                    id="barcode"
                                                    value={barcode}
                                                    onChange={e => setBarcode(e.target.value)}
                                                    placeholder="Scan code"
                                                />
                                            </div>
                                        </div>

                                        {isAddingCategory && (
                                            <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                                                <Input
                                                    placeholder="New Category Name"
                                                    value={newCategoryName}
                                                    onChange={e => setNewCategoryName(e.target.value)}
                                                    className="bg-white dark:bg-gray-800"
                                                />
                                                <Button type="button" size="sm" onClick={addCategory}>Add</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-gray-100 dark:border-gray-700" />

                                {/* Section 2: Pricing & Inventory */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                                        <span className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700"></span>
                                        Inventory & Pricing
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="grid gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <Label htmlFor="cost" className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Cost Price</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">₱</span>
                                                <Input id="cost" type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} className="pl-7" />
                                            </div>
                                        </div>
                                        <div className="grid gap-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                            <Label htmlFor="price" className="text-xs text-primary font-bold uppercase">Selling Price</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-sm font-bold">₱</span>
                                                <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="pl-7 border-primary/20 font-bold" />
                                            </div>
                                        </div>
                                        <div className="grid gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <Label htmlFor="stock" className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Current Stock</Label>
                                            <Input id="stock" type="number" value={stock} onChange={e => setStock(e.target.value)} disabled={editing && !isAdmin} />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 px-1">
                                            <Label htmlFor="minStock" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Low Stock Alert at:</Label>
                                            <Input id="minStock" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="w-24" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Advanced / Relationships */}
                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                    <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                                        Bulk Conversion (Advanced)
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="parentId" className="text-xs text-amber-900">Parent Product</Label>
                                            <Select id="parentId" value={parentId || ''} onChange={e => setParentId(e.target.value || null)} className="bg-white dark:bg-gray-800">
                                                <option value="">-- No Parent (Individual Item) --</option>
                                                {products.filter(p => p.id !== editing?.id).map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="conversionRate" className="text-xs text-amber-900">Conversion Rate</Label>
                                            <Input
                                                id="conversionRate"
                                                type="number"
                                                value={conversionRate}
                                                onChange={e => setConversionRate(e.target.value)}
                                                disabled={!parentId}
                                                placeholder="e.g. 24 items per case"
                                                className="bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t flex gap-2 rounded-b-lg">
                            <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating} className="flex-1 sm:flex-none">
                                Discard
                            </Button>
                            <Button type="submit" disabled={isMutating} className="flex-1 sm:flex-none min-w-[140px] shadow-sm">
                                {isMutating ? 'Processing...' : (editing ? 'Update Product' : 'Create Product')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}