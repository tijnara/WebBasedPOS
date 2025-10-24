import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, CardFooter, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea, Input, Label } from '../ui';

export default function ProductManagementPage({ reload }) {
    const products = useStore(s => s.products);
    const setProducts = useStore(s => s.setProducts);
    const addToast = useStore(s => s.addToast);

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    const startEdit = (p) => {
        setEditing(p);
        setName(p?.name || '');
        setPrice(p?.price != null ? String(p.price) : '');
    };

    const save = async (e) => {
        e.preventDefault();

        const parsedPrice = parseFloat(price);

        // Validate inputs
        if (!name || !price) {
            addToast({ title: 'Error', description: 'Name and price are required.' });
            return;
        }

        // Check if the parsed price is a valid number
        if (isNaN(parsedPrice)) {
            addToast({ title: 'Error', description: 'Price must be a valid number.' });
            return;
        }

        try {
            if (editing) {
                // Use the parsedPrice
                await api.updateItem('products', editing.id, { name, price: parsedPrice });
                addToast({ title: 'Updated', description: `Product ${name} updated` });
            } else {
                // The server will generate the ID. Do NOT send one.
                // Use the parsedPrice
                const payload = { name, price: parsedPrice };
                console.log('Creating product with payload:', payload); // Log payload for debugging
                await api.createProduct(payload);
                addToast({ title: 'Created', description: `Product ${name} created` });
            }

            // Reset form
            setEditing(null);
            setName('');
            setPrice('');
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
                <h1 className="text-2xl font-semibold">Manage Products</h1>
                <Button onClick={() => startEdit(null)}>Add New</Button>
            </div>

            <Card>
                <CardContent>
                    <ScrollArea className="max-h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell>₱{(p.price||0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button variant="ghost" onClick={() => startEdit(p)}>Edit</Button>
                                                <Button variant="destructive" onClick={() => remove(p)}>Delete</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Editor form */}
            <div className="mt-4">
                <Card>
                    <CardHeader><h3 className="font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h3></CardHeader>
                    <CardContent>
                        <form onSubmit={save} className="space-y-2">
                            <div>
                                <Label htmlFor="pname">Name</Label>
                                <Input id="pname" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="pprice">Price</Label>
                                <Input id="pprice" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                            </div>
                            <div className="flex space-x-2">
                                <Button type="submit">Save</Button>
                                <Button variant="outline" onClick={() => { setEditing(null); setName(''); setPrice(''); }}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}