import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../ui';

const ReorderReport = () => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchLowStockProducts = async () => {
            setIsLoading(true);

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

    // Helper for visual status
    const getStockStatus = (stock, min) => {
        if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 ring-red-600/20' };
        if (stock <= min / 2) return { label: 'Critical', color: 'bg-orange-100 text-orange-700 ring-orange-600/20' };
        return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20' };
    };

    const handleRestockClick = (productId) => {
        router.push(`/inventory?restockProductId=${productId}`);
    };

    if (isLoading) return null; // Or a skeleton loader
    if (lowStockProducts.length === 0) return null; // Don't show if nothing to reorder

    return (
        <Card className="border-l-4 border-l-red-500 shadow-sm overflow-hidden">
            <CardHeader className="bg-red-50/50 pb-3 border-b border-red-100">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                            🚨
                        </span>
                        Reorder Alert
                        <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                            {lowStockProducts.length} items
                        </span>
                    </h3>
                    {/* Placeholder for export/print action */}
                    <button className="text-xs font-semibold text-red-600 hover:text-red-800 uppercase tracking-wide">
                        Download List
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock / Min</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                        {lowStockProducts.map((product) => {
                            const status = getStockStatus(product.stock_quantity, product.min_stock_level);
                            return (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {product.barcode || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.color}`}>
                                                {status.label}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <span className="font-bold text-gray-900">{product.stock_quantity}</span>
                                        <span className="text-gray-400 mx-1">/</span>
                                        <span className="text-gray-500">{product.min_stock_level}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleRestockClick(product.id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Restock
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default ReorderReport;