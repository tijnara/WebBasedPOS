import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea, Input, Label } from '../ui';

export default function CustomerManagementPage({ reload }) {
  const customers = useStore(s => s.customers);
  const addToast = useStore(s => s.addToast);

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');

  const startEdit = (c) => {
    setEditing(c);
    setName(c?.name || '');
    setContact(c?.contact || '');
    setAddress(c?.address || '');
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateItem('customers', editing.id, { name, contact, address });
        addToast({ title: 'Updated', description: `Customer ${name} updated` });
      } else {
        await api.createCustomer({ name, contact, address, dateAdded: new Date().toISOString() });
        addToast({ title: 'Created', description: `Customer ${name} created` });
      }
      setEditing(null); setName(''); setContact(''); setAddress('');
      if (reload) reload();
    } catch (e) { console.error(e); addToast({ title: 'Error', description: e.message }); }
  };

  const remove = async (c) => {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      await api.deleteItem('customers', c.id);
      addToast({ title: 'Deleted', description: `${c.name} deleted` });
      if (reload) reload();
    } catch (e) { console.error(e); addToast({ title: 'Error', description: e.message }); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Manage Customers</h1>
        <Button onClick={() => startEdit(null)}>Add New</Button>
      </div>

      <Card>
        <CardContent>
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.contact || '-'}</TableCell>
                    <TableCell>{c.address || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" onClick={() => startEdit(c)}>Edit</Button>
                        <Button variant="destructive" onClick={() => remove(c)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader><h3 className="font-semibold">{editing ? 'Edit Customer' : 'Add Customer'}</h3></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-2">
              <div>
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="ccontact">Contact</Label>
                <Input id="ccontact" value={contact} onChange={e => setContact(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="caddress">Address</Label>
                <Input id="caddress" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Save</Button>
                <Button variant="outline" onClick={() => { setEditing(null); setName(''); setContact(''); setAddress(''); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

