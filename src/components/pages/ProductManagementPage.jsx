import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Select
} from '../ui';
import Pagination from '../Pagination';

// --- NEW: Import all the hooks ---
import { useProducts } from '../../hooks/useProducts';
import {
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct
} from '../../hooks/useProductMutations';

import MobileLogoutButton from '../MobileLogoutButton';

// --- UPDATED ICONS (Modern & Consistent) ---

// Simple SVG Icon for Edit (Pencil)
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

// Simple SVG Icon for Delete (Trash)
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

// NEW: Simple SVG Icon for Product (Shopping Bag)
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
    // Fetch products with server-side pagination and filters
    const { data: productsData = { products: [], totalPages: 1 }, isLoading } = useProducts({ page: currentPage, itemsPerPage, searchTerm: debouncedSearchTerm, category: categoryFilter });
    const products = productsData.products;
    const totalPages = productsData.totalPages;
    const addToast = useStore(s => s.addToast);

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const productNameRef = useRef(null); // NEW: ref for auto-focus
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

    // --- MODIFICATION: Debounce search term ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);
    // --- END MODIFICATION ---

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

    // Body scroll lock when Add Product modal is open
    useEffect(() => {
        if (isModalOpen) {
            if (!document.body.dataset.pmPrevOverflow) {
                document.body.dataset.pmPrevOverflow = document.body.style.overflow || '';
            }
            document.body.style.overflow = 'hidden';
        } else {
            if (document.body.dataset.pmPrevOverflow !== undefined) {
                document.body.style.overflow = document.body.dataset.pmPrevOverflow;
                delete document.body.dataset.pmPrevOverflow;
            }
        }
        return () => {
            if (document.body.dataset.pmPrevOverflow !== undefined) {
                document.body.style.overflow = document.body.dataset.pmPrevOverflow;
                delete document.body.dataset.pmPrevOverflow;
            }
        };
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

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

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
        const parsedPrice = parseFloat(price);
        const parsedCost = parseFloat(cost || '0');
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

        const nameLower = name.trim().toLowerCase();
        const existingProducts = products || [];

        if (!editing) {
            const exists = existingProducts.some(p => p.name.trim().toLowerCase() === nameLower);
            if (exists) {
                addToast({ title: 'Warning', description: `Product "${name}" already exists.`, variant: 'warning' });
                return;
            }
        } else {
            const exists = existingProducts.some(p => p.name.trim().toLowerCase() === nameLower && p.id !== editing.id);
            if (exists) {
                addToast({ title: 'Warning', description: `Another product with the name "${name}" already exists.`, variant: 'warning' });
                return;
            }
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

    // Helper: compute merged categories (from products + custom)
    const categoriesFromProducts = Array.from(new Set((products || []).map(p => (p.category || 'General').trim()))).filter(Boolean);
    const mergedCategories = Array.from(new Set(['General', ...categoriesFromProducts, ...customCategories]));

    // Helper: add a new category
    const addCategory = () => {
        const name = (newCategoryName || '').trim();
        if (!name) return;
        // Check duplicates case-insensitive
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

    // Reset to first page when search or category changes
    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, categoryFilter]);

    // Derived list for category filter (merge + All)
    const categories = ['All', ...mergedCategories];
    const filteredProducts = products || [];

    // NEW: Persist custom categories
    useEffect(() => {
        try { localStorage.setItem('pos_custom_categories', JSON.stringify(customCategories)); } catch {}
    }, [customCategories]);

    // NEW: Auto-focus product name when modal opens
    useEffect(() => {
        if (isModalOpen && productNameRef.current) {
            productNameRef.current.focus();
        }
    }, [isModalOpen]);

    // NEW: Helper to format numbers to 2 decimals (leave blank if empty)
    const formatToTwoDecimals = (val) => {
        if (val === '' || val == null) return '';
        const num = parseFloat(val);
        if (isNaN(num)) return '';
        return num.toFixed(2);
    };

    return (
        <div className="product-page">
            {/* --- Brand Logo at the very top left --- */}
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} />
            <MobileLogoutButton />
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Products</h1>
                        <p className="text-muted">Manage your product inventory</p>
                    </div><Button variant="primary" onClick={openModal}>Add Product</Button>
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

                {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
                <Card className="hidden md:block">
                    <CardContent>
                        {/* --- MODIFICATION: Removed max-h-96, pagination handles length --- */}
                        <ScrollArea>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead>Date Updated</TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex justify-center items-center">
                                                    <svg className="animate-spin h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Loading products...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                {debouncedSearchTerm ? `No products found for "${debouncedSearchTerm}".` : 'No products found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.name}</TableCell>
                                                <TableCell>{p.category || 'Uncategorized'}</TableCell>
                                                <TableCell>
                                                    <span className={`font-bold ${Number(p.stock) <= Number(p.minStock) ? 'text-red-600' : 'text-green-600'}`}>{p.stock}</span>
                                                </TableCell>
                                                <TableCell>₱{Number(p.price || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {p.created_at ? new Date(p.created_at).toLocaleString() : <span className="text-xs text-gray-400">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {p.updated_at ? new Date(p.updated_at).toLocaleString() : <span className="text-xs text-gray-400">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded border border-gray-200" />
                                                    ) : <span className="text-xs text-gray-400">None</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}>
                                                            <EditIcon />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(p)}>
                                                            <DeleteIcon />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        {/* Pagination Controls */}
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                    </CardContent>
                </Card>

                {/* --- MOBILE LIST VIEW (Show on mobile, hide on md+) --- */}
                <div className="block md:hidden">
                    <Card>
                        <CardContent className="p-0"> {/* Remove padding from content to allow list to go edge-to-edge */}
                            {isLoading ? (
                                <div className="text-center text-muted p-6">Loading products...</div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="text-center text-muted p-6">
                                    {debouncedSearchTerm ? `No products found for "${debouncedSearchTerm}".` : 'No products found.'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredProducts.map(p => (
                                        <div key={p.id} className="p-4 flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded object-cover bg-gray-100 border border-gray-200" />
                                                ) : (
                                                    <span className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                        <BagIcon />
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{p.name}</div>
                                                <div className="text-sm text-gray-500">₱{Number(p.price || 0).toFixed(2)}</div>
                                                <div className="text-[10px] text-gray-500">C: {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'} | U: {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}</div>
                                            </div>

                                            <div className="flex-shrink-0 flex items-center space-x-0">
                                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => startEdit(p)}>
                                                    <EditIcon />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(p)}>
                                                    <DeleteIcon />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pagination Controls for mobile */}
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                </div>


                {/* --- MODAL: Product Form (No change needed) --- */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="p-0 overflow-hidden max-h-[calc(100dvh-2rem)]">
                        <form onSubmit={save} className="flex flex-col h-full max-h-[calc(100dvh-2rem)]">
                            {/* Sticky Header */}
                            <DialogHeader className="px-4 pt-4 pb-2 border-b bg-white flex-shrink-0">
                                <DialogTitle className="text-base sm:text-lg font-semibold">{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
                                <DialogCloseButton onClick={closeModal} />
                            </DialogHeader>

                            {/* Scrollable form body */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 modal-scroll modal-scrollbar bg-white" style={{ minHeight: '0', backgroundColor: '#ffffff' }}>
                                <div className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                                    <div className="flex flex-col space-y-1 sm:col-span-2">
                                        <Label htmlFor="productName" className="text-[11px] font-medium tracking-wide text-gray-600">Product Name *</Label>
                                        <Input id="productName" ref={productNameRef} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Chips (Large)" className="text-sm" />
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="pprice" className="text-[11px] font-medium tracking-wide text-gray-600">Selling Price (₱) *</Label>
                                        <Input id="pprice" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} onBlur={() => setPrice(p => formatToTwoDecimals(p))} required placeholder="0.00" className="text-sm" />
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="cost" className="text-[11px] font-medium tracking-wide text-gray-600">Cost Price (₱)</Label>
                                        <Input id="cost" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} onBlur={() => setCost(c => formatToTwoDecimals(c))} placeholder="0.00" className="text-sm" />
                                        <p className="text-[10px] text-gray-500">Optional – for profit analytics.</p>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="barcode" className="text-[11px] font-medium tracking-wide text-gray-600">Barcode / SKU</Label>
                                        <Input id="barcode" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Scan or type code" className="text-sm" />
                                        <p className="text-[10px] text-gray-500">Leave blank if none.</p>
                                    </div>
                                    <div className="flex flex-col space-y-1 sm:col-span-2">
                                        <Label htmlFor="category" className="text-[11px] font-medium tracking-wide text-gray-600">Category</Label>
                                        <div className="flex gap-2">
                                            <Select id="category" value={category} onChange={e => setCategory(e.target.value)} className="flex-1 text-sm">
                                                {mergedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </Select>
                                            <Button type="button" size="sm" variant="outline" onClick={() => { setIsAddingCategory(v => !v); setNewCategoryName(''); }} className="whitespace-nowrap">{isAddingCategory ? 'Cancel' : '+ Add'}</Button>
                                        </div>
                                        {isAddingCategory && (
                                            <div className="mt-2 flex gap-2 items-center">
                                                <Input id="newCategoryName" placeholder="New category" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 text-sm" />
                                                <Button type="button" size="sm" onClick={addCategory}>Save</Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="stock" className="text-[11px] font-medium tracking-wide text-gray-600">Current Stock</Label>
                                        <Input id="stock" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" className="text-sm" />
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="minStock" className="text-[11px] font-medium tracking-wide text-gray-600">Low Stock Alert</Label>
                                        <Input id="minStock" type="number" min="0" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="5" className="text-sm" />
                                        <p className="text-[10px] text-gray-500">Red badge when stock ≤ value.</p>
                                    </div>
                                    <div className="flex flex-col space-y-1 sm:col-span-2">
                                        <Label htmlFor="productImage" className="text-[11px] font-medium tracking-wide text-gray-600">Product Image (Optional)</Label>
                                        <Input id="productImage" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm" />
                                        <p className="text-[10px] text-gray-500">Square images look best (≈300×300).</p>
                                        {editing?.image_url && !imageFile && (
                                            <p className="text-[10px] text-gray-500">Current image: <a href={editing.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <DialogFooter className="px-4 py-3 border-t bg-white flex-shrink-0">
                                <div className="flex w-full gap-2">
                                    <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating} className="flex-1 text-sm">Cancel</Button>
                                    <Button type="submit" disabled={isMutating} className="flex-1 text-sm">{uploading ? 'Uploading…' : isMutating ? 'Saving…' : (editing ? 'Save Changes' : 'Create Product')}</Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}