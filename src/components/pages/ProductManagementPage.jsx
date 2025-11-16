import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';

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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    // Pass page, itemsPerPage, and debouncedSearchTerm to useProducts
    const { data: productsData = { products: [], totalPages: 1 }, isLoading } = useProducts({ page: currentPage, itemsPerPage, searchTerm: debouncedSearchTerm });
    const products = productsData.products;
    const totalPages = productsData.totalPages;
    const addToast = useStore(s => s.addToast);

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const [searchTerm, setSearchTerm] = useState(''); // Moved up
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

    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
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
    };

    const save = async (e) => {
        e.preventDefault();
        const parsedPrice = parseFloat(price);

        if (!name || !price) {
            addToast({ title: 'Error', description: 'All fields are required.' });
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            addToast({ title: 'Error', description: 'Price must be a valid non-negative number.' });
            return;
        }

        // --- MODIFICATION: Simplify duplicate check.
        // We refetch on mutation, but for a better UX, we can check the *currently loaded* products.
        // This check is not foolproof (race condition) but is good enough.
        // The database should have a UNIQUE constraint on the name.
        const nameLower = name.trim().toLowerCase();
        const existingProducts = products || []; // Use loaded products

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
        // --- END MODIFICATION ---

        const payload = {
            name,
            price: parsedPrice
        };

        try {
            if (editing) {
                await updateProduct.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'Updated', description: `Product ${name} updated` });
            } else {
                await createProduct.mutateAsync(payload);
                addToast({ title: 'Created', description: `Product ${name} created` });
            }
            closeModal();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message });
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

    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;

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

                <div className="mb-4">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search products by name or category..." // Updated placeholder
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs mb-2"
                    />
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
                                        <TableHead>Price</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            {/* --- MODIFICATION: Added loading spinner --- */}
                                            <TableCell colSpan={3} className="text-center text-muted py-8">
                                                <div className="flex justify-center items-center">
                                                    <svg className="animate-spin h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Loading products...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : products.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted py-8">
                                                {debouncedSearchTerm ? `No products found for "${debouncedSearchTerm}".` : 'No products found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        products.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.name}</TableCell>
                                                <TableCell>₱{Number(p.price || 0).toFixed(2)}</TableCell>
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
                        <div className="flex justify-center items-center gap-2 py-2">
                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</Button>
                            <span className="text-sm">Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* --- MOBILE LIST VIEW (Show on mobile, hide on md+) --- */}
                <div className="block md:hidden">
                    <Card>
                        <CardContent className="p-0"> {/* Remove padding from content to allow list to go edge-to-edge */}
                            {isLoading ? (
                                <div className="text-center text-muted p-6">Loading products...</div>
                            ) : products.length === 0 ? (
                                <div className="text-center text-muted p-6">
                                    {debouncedSearchTerm ? `No products found for "${debouncedSearchTerm}".` : 'No products found.'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100"> {/* Lighter divider */}
                                    {products.map(p => (
                                        <div key={p.id} className="p-4 flex items-center space-x-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <BagIcon />
                                                </span>
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{p.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    ₱{Number(p.price || 0).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Actions */}
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
                    <div className="flex justify-center items-center gap-2 py-3">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</Button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                    </div>
                </div>


                {/* --- MODAL: Product Form (No change needed) --- */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
                            <DialogCloseButton onClick={closeModal} />
                        </DialogHeader>
                        <form onSubmit={save}>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="productName">Product Name</Label>
                                        <Input id="productName" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="pprice">Price (₱)</Label>
                                        <Input id="pprice" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating}>Cancel</Button>
                                <Button type="submit" disabled={isMutating}>
                                    {isMutating ? 'Saving...' : 'Save Product'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}