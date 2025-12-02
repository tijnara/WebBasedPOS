import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../ui';

const ReorderReport = () => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLowStockProducts = async () => {
            setIsLoading(true);

            // Fetching products to filter client side for robust comparison
            const { data: products, error: prodError } = await supabase
                .from('products')
                .select('id, name, barcode, stock_quantity, min_stock_level')
                .order('stock_quantity', { ascending: true });

            if (prodError) {
                console.error('Error fetching low stock products:', prodError);
            } else {
                // Filter where stock <= min_stock
                const lowStock = (products || []).filter(p => p.stock_quantity <= p.min_stock_level);
                setLowStockProducts(lowStock);
            }
            setIsLoading(false);
        };

        fetchLowStockProducts();
    }, []);

    return (
        <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader className="pb-2 border-red-100 bg-red-50">
                <h3 className="font-semibold text-lg text-red-800 flex items-center gap-2">
                    <span className="text-xl">⚠️</span> Reorder Alert
                </h3>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-red-600">Checking inventory...</p>
                ) : lowStockProducts.length === 0 ? (
                    <p className="text-sm text-green-700 font-medium">✅ All products are well stocked.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-red-800 border-b border-red-200">
                                    <th className="pb-2 font-semibold">Product</th>
                                    <th className="pb-2 font-semibold">Barcode</th>
                                    <th className="pb-2 font-semibold">Stock</th>
                                    <th className="pb-2 font-semibold">Min</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-200">
                                {lowStockProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="py-2 text-gray-800">{product.name}</td>
                                        <td className="py-2 text-gray-600">{product.barcode || '-'}</td>
                                        <td className="py-2 font-bold text-red-600">{product.stock_quantity}</td>
                                        <td className="py-2 text-gray-600">{product.min_stock_level}</td>
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

