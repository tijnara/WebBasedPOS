```javascript
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../ui';

const ReorderReport = () => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLowStockProducts = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('id, name, sku, stock_quantity, min_stock_level')
                .lte('stock_quantity', 'min_stock_level')
                .order('stock_quantity', { ascending: true });

            if (error) {
                console.error('Error fetching low stock products:', error);
            } else {
                setLowStockProducts(data);
            }
            setIsLoading(false);
        };

        fetchLowStockProducts();
    }, []);

    return (
        <Card>
            <CardHeader>
                <h3 className="font-semibold text-lg">Reorder Report</h3>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Loading report...</p>
                ) : lowStockProducts.length === 0 ? (
                    <p>All products are well-stocked.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock Level</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lowStockProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">{product.stock_quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{product.min_stock_level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ReorderReport;
```
