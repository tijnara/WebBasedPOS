import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea, Input, Label } from '../ui';

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
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');

    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
        setCategory(p?.category || '');
        setStock(p?.stock != null ? String(p.stock) : '');
    };

    const save = async (e) => {
        e.preventDefault();

        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock, 10);

        // Validate inputs
        if (!name || !price || !category || !stock) {
            addToast({ title: 'Error', description: 'All fields are required.' });
            return;
        }
        if (isNaN(parsedPrice) || isNaN(parsedStock)) {
            addToast({ title: 'Error', description: 'Price and Stock must be valid numbers.' });
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
                await api.updateItem('products', editing.id, payload);
                addToast({ title: 'Updated', description: `Product ${name} updated` });
            } else {
                // FIX: Generate a unique ID for the new product, as required by your API
                const id = Date.now().toString();
                const createPayload = { ...payload, id };

                console.log('Creating product with payload:', createPayload);
                await api.createProduct(createPayload);
                addToast({ title: 'Created', description: `Product ${name} created` });
            }

            // Reset form
            setEditing(null);
            setName('');
            setPrice('');
            setCategory('');
            setStock('');
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
        } catch (e) { console.error(e); addToast({ title: 'Error', description: e.message }); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Products</h1>
                    <p className="text-muted">Manage your product inventory</p>
                </div>
                <Button onClick={() => startEdit(null)}>Add Product</Button>
            </div>

            <div className="mb-4">
                <Input placeholder="Search products..." className="w-full" />
            </div>

            <Card>
                <CardContent>
                    <ScrollArea className="max-h-96">
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
                                {products.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell>{p.category}</TableCell>
                                        <TableCell>${Number(p.price||0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className="stock-badge">{p.stock} units</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(p)}>
                                                    <EditIcon />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => remove(p)} className="text-destructive">
                                                    <DeleteIcon />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Editor form (Modal or separate view recommended, but inline for simplicity) */}
            <div className="mt-4">
                <Card>
                    <CardHeader><h3 className="font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h3></CardHeader>
                    <CardContent>
                        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="pname">Name</Label>
                                <Input id="pname" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="pcategory">Category</Label>
                                <Input id="pcategory" value={category} onChange={e => setCategory(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="pprice">Price</Label>
                                <Input id="pprice" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="pstock">Stock</Label>
                                <Input id="pstock" type="number" step="1" value={stock} onChange={e => setStock(e.target.value)} required />
                            </div>
                            <div className="md:col-span-2 flex space-x-2">
                                <Button type="submit">Save</Button>
                                <Button variant="outline" type="button" onClick={() => { setEditing(null); setName(''); setPrice(''); setCategory(''); setStock(''); }}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}