// src/components/pos/POSProductGrid.jsx
import React from 'react';
import { ProductImage } from './ProductImage';
import currency from 'currency.js';

const POSProductGrid = ({
                            isLoading,
                            products = [],
                            handleAdd,
                            currentPage = 1,
                            totalPages = 1,
                            setCurrentPage,
                        }) => {
    const isServiceItem = (p) => {
        if (!p) return false;
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const stock = p.stock ?? p.stock_quantity;
        return cat.includes('refill') || cat.includes('service') || name.includes('refill') || (stock !== null && stock > 9999);
    };

    return (
        <div className="w-full md:w-2/3 flex-1 pr-0 md:pr-2">
            {isLoading ? (
                <div className="grid grid-cols-2 min-[380px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center p-3 h-44">
                            <div className="w-full h-20 bg-gray-200 rounded-lg mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2 mt-1" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : !products.length ? (
                <div className="flex flex-col items-center justify-center h-64 sm:h-80 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full">
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
                    {/* Balanced Multi-Column Responsive Grid */}
                    <div className="grid grid-cols-2 min-[380px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
                        {products.map((p) => {
                            const hotkey = p.id === 3 ? '1' : p.id === 2 ? '2' : p.id === 30 ? '3' : null;
                            const stock = p.stock ?? p.stock_quantity;
                            const isService = isServiceItem(p);
                            const minStock = p.min_stock_level ?? p.minStock ?? 5;
                            const isOutOfStock = !isService && stock !== null && stock !== undefined && stock <= 0;

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    data-testid="product-card"
                                    className="product-card no-reload p-2.5 text-center border border-gray-200 rounded-xl shadow-sm hover:border-emerald-400 hover:shadow-md transition-all duration-150 bg-white flex flex-col items-center justify-between relative group select-none active:scale-95 min-h-[160px]"
                                    onClick={() => handleAdd(p)}
                                    disabled={isOutOfStock}
                                    style={{ opacity: isOutOfStock ? 0.5 : 1 }}
                                >
                                    {/* Hotkey Tag Badge */}
                                    {hotkey && (
                                        <div className="absolute top-1.5 left-1.5 w-4 h-4 flex items-center justify-center bg-gray-900 text-white text-[9px] font-bold rounded shadow-sm z-10" title={`Keyboard Shortcut: ${hotkey}`}>
                                            {hotkey}
                                        </div>
                                    )}

                                    {/* Physical Stock Counter (Hidden for service/refill items) */}
                                    {!isService && stock !== null && stock !== undefined && (
                                        <div className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10 ${
                                            stock <= 0 ? 'bg-red-100 text-red-600' :
                                                stock <= minStock ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-emerald-50 text-emerald-700'
                                        }`}>
                                            {stock}
                                        </div>
                                    )}

                                    {/* Product Image */}
                                    <div className="product-card-image h-16 w-full mb-1 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50/70 p-1">
                                        <ProductImage product={p} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>

                                    {/* Product Title */}
                                    <div className="font-semibold text-xs leading-tight mb-0.5 line-clamp-2 text-gray-800 w-full min-h-[26px] flex items-center justify-center text-center">
                                        {p.name}
                                    </div>

                                    {/* Product Price */}
                                    <div className="text-xs sm:text-sm text-emerald-600 font-bold mt-auto">
                                        {currency(p.price).format({ symbol: '₱' })}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white px-4 py-2.5 mt-4 rounded-xl border border-gray-200 text-xs text-gray-600 shadow-sm">
                            <span className="font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage && setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-700"
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage && setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-700"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default POSProductGrid;