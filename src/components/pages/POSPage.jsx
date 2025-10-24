import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, CardFooter, Table, TableBody, TableRow, TableCell, ScrollArea } from '../ui';

export default function POSPage() {
  const products = useStore(s => s.products);
  const currentSale = useStore(s => s.currentSale);
  const addItemToSale = useStore(s => s.addItemToSale);
  const clearSale = useStore(s => s.clearSale);
  const getTotalAmount = useStore(s => s.getTotalAmount);
  const currentCustomer = useStore(s => s.currentCustomer);
  const setCurrentCustomer = useStore(s => s.setCurrentCustomer);
  const addToast = useStore(s => s.addToast);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = (p) => addItemToSale(p, 1);

  const handleFinalize = async () => {
    const items = Object.values(currentSale).map(i => ({ productId: i.productId, productName: i.name, quantity: i.quantity, priceAtSale: i.price, subtotal: i.price * i.quantity }));
    if (items.length === 0) return addToast({ title: 'No items', description: 'Add items before finalizing', variant: 'warning' });
    setIsSubmitting(true);
    try {
      const payload = {
        saleTimestamp: new Date().toISOString(),
        totalAmount: getTotalAmount(),
        customerId: currentCustomer?.id || null,
        customerName: currentCustomer?.name || null,
        items,
      };
      const created = await api.createSale(payload);
      addToast({ title: 'Sale saved', description: `Sale ${created.id} recorded`, variant: 'success' });
      clearSale();
    } catch (e) {
      console.error(e);
      addToast({ title: 'Error saving sale', description: e.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Card>
          <CardHeader><div className="flex justify-between items-center"><h3 className="font-semibold">Products</h3></div></CardHeader>
          <CardContent>
            {!products.length ? <div className="p-4 text-center text-gray-500">No products</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {products.map(p => (
                  <button key={p.id} className="p-3 border rounded text-left" onClick={() => handleAdd(p)}>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600">₱{Number(p.price || 0).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader><h3 className="font-semibold">Current Sale</h3></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              {!Object.keys(currentSale).length ? (
                <div className="p-4 text-center text-gray-500">No items</div>
              ) : (
                <Table>
                  <TableBody>
                    {Object.entries(currentSale).map(([key, item]) => (
                      <TableRow key={key}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>×{item.quantity}</TableCell>
                        <TableCell className="text-right">₱{(item.price*item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <div className="flex justify-between mb-2"><div>Total</div><div className="font-semibold">₱{getTotalAmount().toFixed(2)}</div></div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={clearSale}>Clear</Button>
                <Button onClick={handleFinalize} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Finalize'}</Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
