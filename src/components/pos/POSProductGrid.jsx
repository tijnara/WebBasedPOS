// src/components/pos/POSProductGrid.jsx
import React from 'react';
import { ProductImage } from './ProductImage';
import currency from 'currency.js';
import { Plus, Package, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const POSProductGrid = ({
                            isLoading,
                            products = [],
                            handleAdd,
                            openCustomSale,
                            currentPage = 1,
                            totalPages = 1,
                            setCurrentPage,
                        }) => {
    const isServiceItem = (p) => {
        if (!p) return false;
        if (p.is_custom || p.track_stock === false) return true;
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('refill') || cat.includes('service') || name.startsWith('refill');
    };

    const validProducts = products.filter(p =>
        !p.is_hidden &&
        (Number(p.price) > 0 || p.is_custom) &&
        p.name?.toLowerCase() !== 'unknown' &&
        !p.name?.toLowerCase().includes('removed')
    );

    return (
        <div className="w-full flex-1 flex flex-col justify-between min-h-0">
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 sm:p-2.5 h-38 sm:h-44 flex flex-col justify-between"
                        >
                            <div className="w-full h-16 sm:h-20 bg-slate-100 dark:bg-slate-700/60 rounded-xl" />
                            <div className="space-y-1.5 mt-2">
                                <div className="h-2 bg-slate-100 dark:bg-slate-700/60 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Balanced Ergonomic Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 items-stretch">

                        {/* --- ALWAYS FIRST SLOT: Custom Item / Open Sale Tile --- */}
                        <button
                            type="button"
                            onClick={openCustomSale}
                            className="pos-product-card text-left bg-gradient-to-br from-lime-50/70 via-white to-lime-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-lime-950/30 rounded-2xl border-2 border-dashed border-lime-400 dark:border-lime-700/80 hover:border-[#8DB600] dark:hover:border-lime-400 p-2 sm:p-2.5 flex flex-col justify-between items-center text-center group cursor-pointer active:scale-[0.97] transition-all min-h-[148px] sm:min-h-[168px] shadow-2xs select-none"
                        >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-lime-100 dark:bg-lime-950/60 text-[#8DB600] dark:text-lime-400 flex items-center justify-center my-auto group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                            </div>
                            <div className="my-auto">
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#8DB600] dark:text-lime-400 block">
                                    Open Sale
                                </span>
                                <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 mt-0.5">
                                    Custom Item
                                </h4>
                                <span className="text-[9px] font-semibold text-slate-400 mt-0.5 block">
                                    Tap to add
                                </span>
                            </div>
                            <div className="w-full pt-1 sm:pt-1.5 border-t border-lime-100 dark:border-lime-950/40 mt-auto">
                                <span className="text-[9px] sm:text-[10px] font-bold text-[#5f7d00] dark:text-lime-300 bg-lime-100 dark:bg-lime-950/50 px-1.5 py-0.5 rounded-md">
                                    Open Price (₱)
                                </span>
                            </div>
                        </button>

                        {/* --- Catalog Products --- */}
                        {validProducts.map((p) => {
                            const hotkey = p.id === 30 ? '1' : p.id === 3 ? '2' : p.id === 2 ? '3' : null;
                            const stockNum = Number(p.stock ?? p.stock_quantity ?? 0);
                            const minStockNum = Number(p.min_stock_level ?? p.minStock ?? 5);
                            const isService = isServiceItem(p);

                            const isOutOfStock = !isService && stockNum <= 0;
                            const isLowStock = !isService && !isOutOfStock && stockNum <= minStockNum;

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleAdd(p)}
                                    disabled={isOutOfStock}
                                    className={`pos-product-card text-left bg-white dark:bg-slate-900 rounded-2xl border p-2 sm:p-2.5 flex flex-col justify-between relative group select-none shadow-2xs transition-all duration-150 outline-none min-h-[148px] sm:min-h-[168px] ${
                                        isOutOfStock
                                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                                            : 'border-slate-200/90 dark:border-slate-800 hover:border-[#8DB600] dark:hover:border-[#8DB600] active:scale-[0.97]'
                                    }`}
                                >
                                    {/* Product Image Stage */}
                                    <div className="relative w-full h-16 sm:h-20 rounded-xl p-1 sm:p-1.5 flex items-center justify-center overflow-hidden mb-1 sm:mb-1.5 border border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-850/40 shrink-0">
                                        {/* Hotkey Tag Badge */}
                                        {hotkey && (
                                            <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center bg-slate-900 dark:bg-slate-700 text-white font-mono text-[8px] sm:text-[9px] font-black rounded shadow-2xs z-10">
                                                {hotkey}
                                            </div>
                                        )}

                                        {/* Physical Stock Counter */}
                                        {!isService ? (
                                            <div className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full z-10 shadow-2xs ${
                                                isOutOfStock
                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                                    : isLowStock
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                                        : 'bg-lime-50 text-[#5f7d00] dark:bg-lime-950/60 dark:text-lime-300 border border-lime-200 dark:border-lime-900'
                                            }`}>
                                                {isOutOfStock ? '0' : stockNum.toLocaleString()}
                                            </div>
                                        ) : (
                                            <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 text-[7px] sm:text-[8px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded-full z-10 border shadow-2xs bg-lime-100 text-[#5f7d00] dark:bg-lime-950/50 dark:text-lime-300 border-lime-200 dark:border-lime-900">
                                                Refill
                                            </div>
                                        )}

                                        {/* Dynamic Product Image */}
                                        <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                            <ProductImage
                                                product={p}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Database Name & Category */}
                                    <div className="flex-1 flex flex-col justify-start min-w-0">
                                        <span className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate">
                                            {p.category || 'General'}
                                        </span>
                                        <h4 className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug group-hover:text-[#5f7d00] dark:group-hover:text-lime-400 transition-colors mt-0.5" title={p.name}>
                                            {p.name}
                                        </h4>
                                    </div>

                                    {/* Database Price & Action */}
                                    <div className="flex items-center justify-between pt-1 sm:pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 shrink-0 w-full">
                                        <div className="text-xs sm:text-sm font-black font-mono text-[#8DB600] dark:text-lime-400 tracking-tight">
                                            {currency(p.price, { symbol: '₱' }).format()}
                                        </div>

                                        <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#8DB600] group-hover:text-white dark:group-hover:bg-[#8DB600] dark:group-hover:text-white flex items-center justify-center transition-all duration-150 shadow-2xs shrink-0">
                                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Pagination Bar with Comfortable Thumb Targets */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 mt-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 shadow-2xs">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">
                                Page <strong className="text-slate-800 dark:text-slate-100">{currentPage}</strong> of {totalPages}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className="h-7.5 px-2.5 sm:px-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors text-[10px] sm:text-[11px]"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    className="h-7.5 px-2.5 sm:px-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors text-[10px] sm:text-[11px]"
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