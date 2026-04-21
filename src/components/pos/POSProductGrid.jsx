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
        <div className="w-full md:w-2/3 flex-1 pr-2 responsive-page">
            {isLoading ? (
                <div className="grid grid-cols-3 md:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center p-2 h-36">
                            <div className="w-full h-14 bg-gray-200 rounded-md mb-1.5" />
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2 mt-1" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : !products.length ? (
                <div className="flex flex-col items-center justify-center h-64 sm:h-80 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 p-6 mx-2 mt-4 md:mt-0 w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-700">No products found</h3>
                    <p className="text-sm text-gray-400 text-center mt-2 max-w-sm">
                        We couldn't find any products matching your search or category filter. Try adjusting your search criteria.
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop Grid - Increased columns and reduced card size */}
                    <div className="hidden md:grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {products.map((p) => (
                            <button
                                key={p.id}
                                data-testid="product-card"
                                className="product-card no-reload p-2 text-center border rounded-lg shadow-sm hover:border-primary hover:shadow-md transition-all duration-150 bg-white flex flex-col items-center relative"
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
                                    data-testid="product-card"
                                    className="product-card no-reload p-2 border rounded-lg shadow-sm bg-white flex flex-col items-center active:scale-95 transition-transform"
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