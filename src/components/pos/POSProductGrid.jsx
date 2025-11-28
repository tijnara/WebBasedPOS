// src/components/pos/POSProductGrid.jsx
import React from 'react';
import { ProductImage } from './ProductImage';

const POSProductGrid = ({
    isLoading,
    products = [],
    recentProducts = [],
    handleAdd,
    currentPage,
    totalPages,
    setCurrentPage,
}) => {
    return (
        <div className="w-full md:w-2/3 flex-1 pr-2">
            {isLoading ? (
                <div className="p-10 text-center text-muted">Loading products...</div>
            ) : !products.length ? (
                <div className="p-10 text-center text-muted">
                    No products available.
                </div>
            ) : (
                <>
                    {recentProducts.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-primary mb-2">Recently Used Products</h2>
                            <div className="flex gap-2">
                                {recentProducts.map(p => (
                                    <button
                                        key={p.id}
                                        className="product-card p-2 border rounded-xl shadow bg-white flex flex-col items-center hover:border-primary transition-all duration-150"
                                        onClick={() => handleAdd(p)}
                                        title={p.name}
                                        style={{ minWidth: '80px', maxWidth: '120px' }}
                                    >
                                        <div className="h-12 w-12 mb-1 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                                            <ProductImage product={p} />
                                        </div>
                                        <div className="font-medium text-xs text-gray-800 truncate mb-1">{p.name}</div>
                                        <div className="text-xs text-primary font-bold">
                                            ₱{Number(p.price || 0).toFixed(2)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((p) => (
                            <button
                                key={p.id}
                                className="product-card p-4 text-center border rounded-xl shadow-md hover:border-primary hover:shadow-lg transition-all duration-150 bg-white flex flex-col items-center relative"
                                onClick={() => handleAdd(p)}
                                title={p.name}
                                tabIndex={-1}
                                disabled={p.stock <= 0}
                                style={{ opacity: p.stock <= 0 ? 0.5 : 1 }}
                            >
                                <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full ${
                                    p.stock <= 0 ? 'bg-red-100 text-red-600' :
                                        p.stock <= p.minStock ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-green-100 text-green-600'
                                }`}>
                                    {p.stock} left
                                </div>
                                <div className="product-card-image h-20 w-full mb-2 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 p-1">
                                    <ProductImage product={p} />
                                </div>
                                <div className="font-semibold text-sm leading-tight mb-1 line-clamp-2 text-gray-800">{p.name}</div>
                                <div className="text-xs text-primary font-bold">
                                    ₱{Number(p.price || 0).toFixed(2)}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Mobile grid and pagination */}
                    <div className="block md:hidden">
                        {/* ...existing code for mobile grid... */}
                    </div>
                </>
            )}
        </div>
    );
};

export default POSProductGrid;