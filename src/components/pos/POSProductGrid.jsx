// src/components/pos/POSProductGrid.jsx
import React from 'react';
import { ProductImage } from './ProductImage';
import currency from 'currency.js';

const POSProductGrid = ({
                            isLoading,
                            products = [],
                            handleAdd,
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
                    {/* Desktop Grid - Increased columns and reduced card size */}
                    <div className="hidden md:grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {products.map((p) => (
                            <button
                                key={p.id}
                                className="product-card p-2 text-center border rounded-lg shadow-sm hover:border-primary hover:shadow-md transition-all duration-150 bg-white flex flex-col items-center relative"
                                onClick={() => handleAdd(p)}
                                disabled={p.stock <= 0}
                                style={{ opacity: p.stock <= 0 ? 0.5 : 1 }}
                            >
                                {p.stock !== null && (
                                    <div className={`absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        p.stock <= 0 ? 'bg-red-100 text-red-600' :
                                            p.stock <= p.minStock ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-green-100 text-green-600'
                                    }`}>
                                        {p.stock}
                                    </div>
                                )}
                                <div className="product-card-image h-14 w-full mb-1.5 flex items-center justify-center overflow-hidden rounded-md bg-gray-50 p-0.5">
                                    <ProductImage product={p} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div className="font-semibold text-[11px] leading-tight mb-0.5 line-clamp-2 text-gray-800 w-full min-h-[22px]">{p.name}</div>
                                <div className="text-[11px] text-primary font-bold">
                                    {currency(p.price).format({ symbol: '₱' })}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Mobile Grid - 3 columns and more compact cards */}
                    <div className="block md:hidden">
                        <div className="grid grid-cols-3 gap-2">
                            {products.map((p) => (
                                <button
                                    key={`mobile-${p.id}`}
                                    className="product-card p-2 border rounded-lg shadow-sm bg-white flex flex-col items-center active:scale-95 transition-transform"
                                    onClick={() => handleAdd(p)}
                                    disabled={p.stock <= 0}
                                    style={{ opacity: p.stock <= 0 ? 0.6 : 1 }}
                                >
                                    <div className="h-12 w-full mb-1.5 flex items-center justify-center overflow-hidden rounded bg-gray-50">
                                        <ProductImage product={p} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div className="font-medium text-[10px] text-gray-900 line-clamp-2 w-full text-center h-6 leading-3">{p.name}</div>
                                    <div className="mt-0.5 text-[10px] text-primary font-bold">
                                        {currency(p.price).format({ symbol: '₱' })}
                                    </div>
                                    {p.stock !== null && (
                                        <div className={`mt-1 text-[9px] px-1.5 rounded-full ${
                                            p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {p.stock}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default POSProductGrid;