import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton } from '../ui';

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


export default function ProductManagementPage({ reload }) {
    const products = useStore(s => s.products);
    const addToast = useStore(s => s.addToast);

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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

        const payload = { name, price: parsedPrice };

        try {
            if (editing) {
                console.log('Updating product with payload:', payload);
                await api.updateItem('products', editing.id, payload);
                addToast({ title: 'Updated', description: `Product ${name} updated` });
            } else {
                const id = Date.now().toString();
                const createPayload = { ...payload, id };
                console.log('Creating product with payload:', createPayload);
                await api.createProduct(createPayload);
                addToast({ title: 'Created', description: `Product ${name} created` });
            }

            closeModal();
            if (reload) reload();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message });
        }
    };

    const remove = async (p) => {
        if (!confirm(`Delete ${p.name}?`)) return;
        try {
            await api.deleteItem('products', p.id);
            addToast({ title: 'Deleted', description: `${p.name} deleted` });
            if (reload) reload();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message });
        }
    };

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
                                    <TableHead>Price</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell>₱{Number(p.price||0).toFixed(2)}</TableCell>
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
                                ))}
                            </TableBody>
                        </Table>
                        {products.length === 0 && (
                            <p className="p-4 text-center text-muted">No products found.</p>
                        )}
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
                                    <Label htmlFor="pprice">Price (₱)</Label>
                                    <Input id="pprice" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                            <Button type="submit">Save Product</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}