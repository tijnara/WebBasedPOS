import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
// Removed: import * as api from '../../lib/api';
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
} from '../../hooks/useProductMutations'; // Assuming you created this file

// Simple SVG Icon for Edit
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
    </svg>
);

// Simple SVG Icon for Delete
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);


export default function ProductManagementPage() {
    // --- REFACTORED: Get data from useProducts hook ---
    const { data: products = [], isLoading } = useProducts();
    const addToast = useStore(s => s.addToast);

    // --- NEW: Initialize mutations ---
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    // State for the modal
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Default'); // Default category
    const [stock, setStock] = useState('0');       // Default stock
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Modal control functions remain the same ---
    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
        setCategory(p?.category || 'Default');
        setStock(p?.stock != null ? String(p.stock) : '0');
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
        setCategory('Default');
        setStock('0');
    };
    // --- End modal control functions ---

    const save = async (e) => {
        e.preventDefault();

        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock, 10);

        if (!name || !price || !category || stock === '') { // Check stock is not empty string
            addToast({ title: 'Error', description: 'All fields are required.' });
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            addToast({ title: 'Error', description: 'Price must be a valid non-negative number.' });
            return;
        }
        if (isNaN(parsedStock) || parsedStock < 0) {
            addToast({ title: 'Error', description: 'Stock must be a valid non-negative integer.' });
            return;
        }

        const payload = {
            name,
            price: parsedPrice,
            category,
            stock: parsedStock
        };

        try {
            if (editing) {
                await updateProduct.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'Updated', description: `Product ${name} updated` });
            } else {
                // The hook now handles ID generation implicitly via Directus
                await createProduct.mutateAsync(payload);
                addToast({ title: 'Created', description: `Product ${name} created` });
            }

            closeModal();
            // No reload() needed, hooks invalidate query
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
            // No reload() needed
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message });
        }
    };

    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Products</h1>
                    <p className="text-muted">Manage your product inventory</p>
                </div>
                <Button onClick={openModal}>Add Product</Button>
            </div>

            <div className="mb-4">
                <Input placeholder="Search products..." className="w-full" />
            </div>

            <Card>
                <CardContent>
                    <ScrollArea className="max-h-96"> {/* Adjust max height as needed */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* --- REFACTORED: Show loading state --- */}
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted">Loading products...</TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted">No products found.</TableCell>
                                    </TableRow>
                                ) : (
                                    products.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell>{p.category}</TableCell>
                                            <TableCell>₱{Number(p.price||0).toFixed(2)}</TableCell>
                                            <TableCell>{p.stock}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1"> {/* Reduced space */}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}> {/* Smaller icons */}
                                                        <EditIcon />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(p)}> {/* Smaller icons */}
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
                </CardContent>
            </Card>

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
                                    <Label htmlFor="category">Category</Label>
                                    <Input id="category" value={category} onChange={e => setCategory(e.target.value)} required />
                                </div>
                                <div>
                                    <Label htmlFor="pprice">Price (₱)</Label>
                                    <Input id="pprice" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required />
                                </div>
                                <div>
                                    <Label htmlFor="stock">Stock</Label>
                                    <Input id="stock" type="number" step="1" min="0" value={stock} onChange={e => setStock(e.target.value)} required />
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
    );
}