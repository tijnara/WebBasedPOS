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

import MobileLogoutButton from '../MobileLogoutButton';
import currency from 'currency.js';

// --- ICONS ---
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const BagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
        <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-4V4a2 2 0 00-2-2h-2zM9 4V3a1 1 0 011-1h.01a1 1 0 011 1v1H9zM4 8h12v10H4V8z" clipRule="evenodd" />
    </svg>
);

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

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const productNameRef = useRef(null);
    const [price, setPrice] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('General');
    const [stock, setStock] = useState(0);
    const [minStock, setMinStock] = useState(5);
    const [cost, setCost] = useState('0');
    const [customCategories, setCustomCategories] = useState(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem('pos_custom_categories') || '[]'); } catch { return []; }
    });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const searchInputRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

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

    // Body scroll lock
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
        setImageFile(null);
        setBarcode(p?.barcode || '');
        setCategory(p?.category || 'General');
        setStock(Number(p?.stock ?? 0));
        setMinStock(Number(p?.minStock ?? 5));
        setCost(String(p?.cost ?? 0));
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
        setBarcode('');
        setCategory('General');
        setStock(0);
        setMinStock(5);
        setCost('0');
        setUploading(false);
        setIsAddingCategory(false);
        setNewCategoryName('');
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
        const parsedCost = currency(cost || '0').value;
        const parsedStock = Math.max(0, parseInt(stock, 10) || 0);
        const parsedMinStock = Math.max(0, parseInt(minStock, 10) || 0);

        if (!name || !price) {
            addToast({ title: 'Error', description: 'Name and Price are required.' });
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            addToast({ title: 'Error', description: 'Price must be a valid non-negative number.' });
            return;
        }

        setUploading(true);
        let imageUrl = editing?.image_url || null;

        if (imageFile) {
            const uploadedUrl = await uploadImage(imageFile);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                setUploading(false);
                return;
            }
        }

        const payload = {
            name,
            price: parsedPrice,
            image_url: imageUrl,
            barcode: barcode?.trim() || null,
            stock: parsedStock,
            minStock: parsedMinStock,
            cost: parsedCost,
            category: category || 'General',
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

    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending || uploading;

    const categoriesFromProducts = Array.from(new Set((products || []).map(p => (p.category || 'General').trim()))).filter(Boolean);
    const mergedCategories = Array.from(new Set(['General', ...categoriesFromProducts, ...customCategories]));

    const addCategory = () => {
        const name = (newCategoryName || '').trim();
        if (!name) return;
        const exists = mergedCategories.some(c => c.toLowerCase() === name.toLowerCase());
        if (exists) {
            setCategory(mergedCategories.find(c => c.toLowerCase() === name.toLowerCase()) || name);
            setIsAddingCategory(false);
            setNewCategoryName('');
            return;
        }
        setCustomCategories(prev => [...prev, name]);
        setCategory(name);
        setIsAddingCategory(false);
        setNewCategoryName('');
    };

    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, categoryFilter]);
    const categories = ['All', ...mergedCategories];
    const filteredProducts = products || [];

    useEffect(() => {
        try { localStorage.setItem('pos_custom_categories', JSON.stringify(customCategories)); } catch {}
    }, [customCategories]);

    useEffect(() => {
        if (isModalOpen && productNameRef.current) {
            productNameRef.current.focus();
        }
    }, [isModalOpen]);

    const formatToTwoDecimals = (val) => {
        if (val === '' || val == null) return '';
        const num = currency(val).value;
        if (isNaN(num)) return '';
        return currency(num, { symbol: '₱', precision: 2 }).format();
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ({ target }) => {
            const csv = target.result;
            const lines = csv.split('\n');
            const productsToAdd = [];
            // Assuming CSV format: Name,Price,Barcode,Stock,Category
            for (let i = 1; i < lines.length; i++) { // Skip header
                const [name, price, barcode, stock, category] = lines[i].split(',');
                if (name && price) {
                    productsToAdd.push({
                        name: name.trim(),
                        price: parseFloat(price),
                        barcode: barcode?.trim() || null,
                        stock_quantity: parseInt(stock) || 0,
                        category: category?.trim() || 'General',
                        created_at: new Date().toISOString()
                    });
                }
            }
            if (productsToAdd.length > 0) {
                const { error } = await supabase.from('products').insert(productsToAdd);
                if (!error) {
                    addToast({ title: 'Import Successful', description: `Imported ${productsToAdd.length} products.` });
                    // Optionally refetch products here
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="product-page">
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} />
            <MobileLogoutButton />
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Products</h1>
                        <p className="text-muted">Manage your product inventory</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button variant="primary" onClick={openModal}>Add Product</Button>
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            className="text-sm font-medium"
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
                    </div>
                </div>

                <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1 max-w-xs">
                        <Label htmlFor="search">Search</Label>
                        <Input id="search" ref={searchInputRef} placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="w-full sm:w-64">
                        <Label>Filter by Category</Label>
                        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* --- DESKTOP TABLE --- */}
                <Card className="hidden md:block">
                    <CardContent>
                        <ScrollArea>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Date Updated</TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">No products found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">{p.name}</TableCell>
                                                <TableCell>{p.category || 'Uncategorized'}</TableCell>
                                                <TableCell>
                                                    <span className={`font-bold px-2 py-1 rounded-full text-xs ${Number(p.stock) <= Number(p.minStock) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {p.stock}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{currency(p.price || 0, { symbol: '₱', precision: 2 }).format()}</TableCell>
                                                <TableCell>
                                                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded border border-gray-200" />
                                                    ) : <span className="text-xs text-gray-400">None</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => startEdit(p)}><EditIcon /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(p)}><DeleteIcon /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                    </CardContent>
                </Card>

                {/* --- MOBILE LIST VIEW --- */}
                <div className="block md:hidden">
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="text-center text-muted p-6">Loading products...</div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="text-center text-muted p-6">No products found.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredProducts.map(p => (
                                        <div key={p.id} className="p-4 flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded object-cover bg-gray-100 border border-gray-200" />
                                                ) : (
                                                    <span className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200"><BagIcon /></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{p.name}</div>
                                                <div className="text-sm text-primary font-semibold">{currency(p.price || 0, { symbol: '₱', precision: 2 }).format()}</div>
                                                <div className="text-xs text-gray-500 mt-1">Stock: <span className={Number(p.stock) <= Number(p.minStock) ? 'text-red-600 font-bold' : 'text-green-600'}>{p.stock}</span></div>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center space-x-0">
                                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => startEdit(p)}><EditIcon /></Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(p)}><DeleteIcon /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                </div>

                {/* --- MODAL: Product Form (Fixed) --- */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    {/* FIX:
                        1. Added '!max-w-4xl' to forcefully increase width via utility
                        2. Added 'width: 900px' in style to force width via inline CSS
                        3. Added '!bg-white' and 'backgroundColor: white' to prevent transparency
                    */}
                    <DialogContent
                        className="p-0 overflow-hidden w-full !max-w-4xl bg-white !bg-white shadow-xl border border-gray-100 relative"
                        style={{ backgroundColor: 'white', width: '900px', maxWidth: '95vw', zIndex: 50 }}
                    >
                        <form
                            onSubmit={save}
                            className="flex flex-col h-full max-h-[100vh] bg-white !bg-white"
                            style={{ backgroundColor: 'white' }}
                        >
                            {/* Header - Forced White Background */}
                            <DialogHeader
                                className="px-6 py-4 border-b bg-white !bg-white flex-shrink-0 z-10"
                                style={{ backgroundColor: 'white' }}
                            >
                                <DialogTitle className="text-lg font-bold text-gray-900">
                                    {editing ? 'Edit Product' : 'Add New Product'}
                                </DialogTitle>
                                <DialogCloseButton onClick={closeModal} />
                            </DialogHeader>

                            {/* Scrollable Body - Forced White Background */}
                            <div
                                className="flex-1 overflow-y-auto px-6 py-8 mb-20 modal-scroll modal-scrollbar bg-white !bg-white relative"
                                style={{ backgroundColor: 'white' }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10"> {/* MODIFIED: Increased vertical gap between rows */}
                                    {/* Product Name (Full Width) */}
                                    <div className="md:col-span-2 space-y-3">
                                        <Label htmlFor="productName" className="text-sm font-semibold text-gray-700">
                                            Product Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="productName"
                                            ref={productNameRef}
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required
                                            placeholder="e.g. Chips (Large)"
                                            className="text-base py-2.5 border-gray-300 h-11" // Added h-11
                                        />
                                    </div>

                                    {/* Category (Full Width) */}
                                    <div className="md:col-span-2 space-y-3">
                                        <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                                            Category
                                        </Label>
                                        <div className="flex gap-2">
                                            <Select
                                                id="category"
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                                className="flex-1 text-base py-2.5 border-gray-300 h-11" // Added h-11
                                            >
                                                {mergedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => { setIsAddingCategory(v => !v); setNewCategoryName(''); }}
                                                className="whitespace-nowrap h-11 px-4 border-gray-300" // Matched h-11
                                            >
                                                {isAddingCategory ? 'Cancel' : '+ Add'}
                                            </Button>
                                        </div>
                                        {isAddingCategory && (
                                            <div className="mt-2 flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
                                                <Input
                                                    id="newCategoryName"
                                                    placeholder="Enter new category name"
                                                    value={newCategoryName}
                                                    onChange={e => setNewCategoryName(e.target.value)}
                                                    className="flex-1 text-base border-gray-300 h-11"
                                                    autoFocus
                                                />
                                                <Button type="button" size="sm" onClick={addCategory} className="h-11">Save</Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Prices */}
                                    <div className="space-y-3">
                                        <Label htmlFor="pprice" className="text-sm font-semibold text-gray-700">
                                            Selling Price (₱) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="pprice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            onBlur={() => setPrice(p => formatToTwoDecimals(p))}
                                            required
                                            placeholder="0.00"
                                            className="text-base py-2.5 border-gray-300 h-11" // Added h-11
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="cost" className="text-sm font-semibold text-gray-700">
                                            Cost Price (₱)
                                        </Label>
                                        <Input
                                            id="cost"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={cost}
                                            onChange={e => setCost(e.target.value)}
                                            onBlur={() => setCost(c => formatToTwoDecimals(c))}
                                            placeholder="0.00"
                                            className="text-base py-2.5 border-gray-300 h-11" // Added h-11
                                        />
                                    </div>

                                    {/* Stocks */}
                                    <div className="space-y-3">
                                        <Label htmlFor="stock" className="text-sm font-semibold text-gray-700">
                                            Current Stock
                                        </Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            min="0"
                                            value={stock}
                                            onChange={e => setStock(e.target.value)}
                                            placeholder="0"
                                            className="text-base py-2.5 border-gray-300 h-11" // Added h-11
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="minStock" className="text-sm font-semibold text-gray-700">
                                            Low Stock Alert
                                        </Label>
                                        <Input
                                            id="minStock"
                                            type="number"
                                            min="0"
                                            value={minStock}
                                            onChange={e => setMinStock(e.target.value)}
                                            placeholder="5"
                                            className="text-base py-2.5 border-gray-300 h-11" // Added h-11
                                        />
                                    </div>

                                    {/* Barcode (Full Width) */}
                                    <div className="md:col-span-2 space-y-3">
                                        <Label htmlFor="barcode" className="text-sm font-semibold text-gray-700">
                                            Barcode / SKU
                                        </Label>
                                        <Input
                                            id="barcode"
                                            value={barcode}
                                            onChange={e => setBarcode(e.target.value)}
                                            placeholder="Scan or type code"
                                            className="text-base py-2.5 border-gray-300 h-11" // Added h-11
                                        />
                                    </div>

                                    {/* Image (Full Width) */}
                                    <div className="md:col-span-2 space-y-3">
                                        <Label htmlFor="productImage" className="text-sm font-semibold text-gray-700">
                                            Product Image (Optional)
                                        </Label>
                                        <Input
                                            id="productImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setImageFile(e.target.files[0])}
                                            className="text-sm border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-soft file:text-primary hover:file:bg-violet-100 h-12 pt-2" // Adjusted height for file input
                                        />
                                        {editing?.image_url && !imageFile && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Current image:</p>
                                                <img src={editing.image_url} alt="Current" className="h-12 w-12 object-cover rounded-md border" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <DialogFooter
                                className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 z-10 absolute bottom-0 left-0 w-full"
                                style={{ backgroundColor: '#f9fafb' }}
                            >
                                <div className="flex w-full justify-end gap-3">
                                    <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating} className="px-6 bg-white border-gray-300">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isMutating} className="px-6 btn--primary">
                                        {uploading ? 'Uploading…' : isMutating ? 'Saving…' : (editing ? 'Save Changes' : 'Create Product')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

