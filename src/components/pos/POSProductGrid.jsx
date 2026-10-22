// src/components/pos/POSProductGrid.jsx
import React from 'react';
import { ProductImage } from './ProductImage';
import currency from 'currency.js';
import { Plus, Package, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="w-full flex-1 flex flex-col justify-between min-h-0">
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-100 p-3 h-56 flex flex-col justify-between">
                            <div className="w-full h-28 bg-slate-100 rounded-xl" />
                            <div className="space-y-2 mt-3">
                                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                                <div className="h-5 bg-slate-100 rounded-md w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : !products.length ? (
                <div className="flex flex-col items-center justify-center h-80 text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-8 w-full text-center shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                        <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-700">No products found</h3>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
                        No catalog items match your search or category filter. Try selecting another category or clearing your search.
                    </p>
                </div>
            ) : (
                <>
                    {/* Balanced Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 items-stretch">
                        {products.map((p) => {
                            const hotkey = p.id === 3 ? '1' : p.id === 2 ? '2' : p.id === 30 ? '3' : null;
                            const stock = p.stock ?? p.stock_quantity;
                            const isService = isServiceItem(p);
                            const minStock = p.min_stock_level ?? p.minStock ?? 5;
                            const isOutOfStock = !isService && stock !== null && stock !== undefined && stock <= 0;
                            const isLowStock = !isService && !isOutOfStock && stock !== null && stock <= minStock;

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleAdd(p)}
                                    disabled={isOutOfStock}
                                    className={`pos-product-card text-left bg-white rounded-2xl border p-3 flex flex-col justify-between relative group select-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-150 outline-none min-h-[220px] ${
                                        isOutOfStock
                                            ? 'opacity-50 cursor-not-allowed border-slate-200'
                                            : 'border-slate-200/90 hover:border-emerald-500/80 cursor-pointer active:scale-[0.98]'
                                    }`}
                                >
                                    {/* Product Image Stage */}
                                    <div className="relative w-full h-28 bg-gradient-to-b from-slate-50/80 to-slate-100/60 rounded-xl p-2 flex items-center justify-center overflow-hidden mb-2.5 border border-slate-100 shrink-0">
                                        {/* Hotkey Tag Badge */}
                                        {hotkey && (
                                            <div
                                                className="absolute top-1.5 left-1.5 w-5 h-5 flex items-center justify-center bg-slate-900/90 text-white font-mono text-[10px] font-black rounded-md shadow-xs z-10"
                                                title={`Keyboard Shortcut: ${hotkey}`}
                                            >
                                                {hotkey}
                                            </div>
                                        )}

                                        {/* Stock Status Badge */}
                                        {!isService && stock !== null && stock !== undefined && (
                                            <div
                                                className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-2xs ${
                                                    isOutOfStock
                                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                        : isLowStock
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                                }`}
                                            >
                                                {isOutOfStock ? '0' : stock}
                                            </div>
                                        )}

                                        {isService && (
                                            <div className="absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full z-10 bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                                                Refill
                                            </div>
                                        )}

                                        <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                            <ProductImage
                                                product={p}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Product Details Header */}
                                    <div className="flex-1 flex flex-col justify-start">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                            {p.category || 'General'}
                                        </span>
                                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug min-h-[2.25rem] group-hover:text-emerald-700 transition-colors mt-0.5">
                                            {p.name}
                                        </h4>
                                    </div>

                                    {/* Footer: Price + Plus Button (Always pinned and fully visible) */}
                                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 shrink-0 w-full">
                                        <div className="text-sm sm:text-base font-black text-emerald-600 tracking-tight">
                                            {currency(p.price, { symbol: '₱' }).format()}
                                        </div>

                                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all duration-150 shadow-2xs shrink-0">
                                            <Plus className="w-4 h-4 stroke-[2.5]" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white px-4 py-2.5 mt-4 rounded-xl border border-slate-200/80 text-xs text-slate-600 shadow-xs">
                            <span className="font-semibold text-slate-500">
                                Page <strong className="text-slate-800">{currentPage}</strong> of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition-colors"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
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