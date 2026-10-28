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
                            currentSale = {},
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
                            className="animate-pulse bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 sm:p-2.5 h-32 sm:h-40 flex flex-col justify-between"
                        >
                            <div className="w-full h-12 sm:h-18 bg-slate-100 dark:bg-slate-700/60 rounded-xl" />
                            <div className="space-y-1.5 mt-2">
                                <div className="h-2 bg-slate-100 dark:bg-slate-700/60 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Compact Ergonomic Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2.5 items-stretch">

                        {/* --- ALWAYS FIRST SLOT: Custom Item / Open Sale Tile --- */}
                        <button
                            type="button"
                            onClick={openCustomSale}
                            className="pos-product-card text-left bg-gradient-to-br from-lime-50/70 via-white to-lime-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-lime-950/30 rounded-xl sm:rounded-2xl border-2 border-dashed border-lime-400 dark:border-lime-700/80 hover:border-[#8DB600] dark:hover:border-lime-400 p-1.5 sm:p-2.5 flex flex-col justify-between items-center text-center group cursor-pointer active:scale-[0.97] transition-all min-h-[126px] sm:min-h-[156px] shadow-2xs select-none"
                        >
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-lime-100 dark:bg-lime-950/60 text-[#8DB600] dark:text-lime-400 flex items-center justify-center my-auto group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.2]" />
                            </div>
                            <div className="my-auto">
                                <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider text-[#8DB600] dark:text-lime-400 block">
                                    Open Sale
                                </span>
                                <h4 className="font-extrabold text-[10.5px] sm:text-xs text-slate-800 dark:text-slate-100 mt-0.5 leading-tight">
                                    Custom Item
                                </h4>
                                <span className="text-[8px] sm:text-[9px] font-semibold text-slate-400 mt-0.5 block">
                                    Tap to add
                                </span>
                            </div>
                            <div className="w-full pt-1 border-t border-lime-100 dark:border-lime-950/40 mt-auto">
                                <span className="text-[8px] sm:text-[10px] font-bold text-[#5f7d00] dark:text-lime-300 bg-lime-100 dark:bg-lime-950/50 px-1.5 py-0.2 rounded-md inline-block">
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

                            // Calculate total quantity of this product currently in cart
                            const qtyInCart = Object.values(currentSale).reduce((sum, item) => {
                                const matches = item.productId === p.id || item.id === p.id;
                                return matches ? sum + (item.quantity || 0) : sum;
                            }, 0);

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleAdd(p)}
                                    disabled={isOutOfStock}
                                    className={`pos-product-card text-left bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border p-1.5 sm:p-2.5 flex flex-col justify-between relative group select-none shadow-2xs transition-all duration-150 outline-none min-h-[126px] sm:min-h-[156px] ${
                                        isOutOfStock
                                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                                            : qtyInCart > 0
                                                ? 'border-[#8DB600] dark:border-[#8DB600] ring-1.5 ring-[#8DB600]/40 bg-lime-50/15 dark:bg-lime-950/15 active:scale-[0.97]'
                                                : 'border-slate-200/90 dark:border-slate-800 hover:border-[#8DB600] dark:hover:border-[#8DB600] active:scale-[0.97]'
                                    }`}
                                >
                                    {/* Compact Product Image Stage */}
                                    <div className="relative w-full h-12 sm:h-18 rounded-lg sm:rounded-xl p-1 flex items-center justify-center overflow-hidden mb-1 border border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-850/40 shrink-0">
                                        {/* Hotkey Tag Badge */}
                                        {hotkey && (
                                            <div className="absolute top-1 left-1 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 flex items-center justify-center bg-slate-900 dark:bg-slate-700 text-white font-mono text-[7px] sm:text-[9px] font-black rounded shadow-2xs z-10">
                                                {hotkey}
                                            </div>
                                        )}

                                        {/* Physical Stock Counter vs Service Tag */}
                                        {!isService ? (
                                            <div className={`absolute top-1 right-1 text-[7px] sm:text-[8px] font-bold px-1.5 py-0.2 rounded-full z-10 shadow-2xs ${
                                                isOutOfStock
                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                                    : isLowStock
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                                        : 'bg-lime-50 text-[#5f7d00] dark:bg-lime-950/60 dark:text-lime-300 border border-lime-200 dark:border-lime-900'
                                            }`}>
                                                {isOutOfStock ? '0' : stockNum.toLocaleString()}
                                            </div>
                                        ) : (
                                            <div className="absolute top-1 right-1 text-[6.5px] sm:text-[7.5px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded-md z-10 border shadow-2xs bg-lime-100 text-[#5f7d00] dark:bg-lime-950/50 dark:text-lime-300 border-lime-200 dark:border-lime-900">
                                                Refill
                                            </div>
                                        )}

                                        {/* In-Cart Quantity Pill */}
                                        {qtyInCart > 0 && (
                                            <div className="absolute bottom-1 left-1 z-10 flex items-center gap-1 bg-[#8DB600] text-white text-[7.5px] sm:text-[8.5px] font-black px-1.5 py-0.5 rounded-md shadow-xs font-mono animate-in zoom-in-90 duration-100">
                                                <span>{qtyInCart} in cart</span>
                                            </div>
                                        )}

                                        {/* Dynamic Product Graphic */}
                                        <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                            <ProductImage
                                                product={p}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Name & Category Info */}
                                    <div className="flex-1 flex flex-col justify-start min-w-0">
                                        <span className="text-[7px] sm:text-[7.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate leading-none mb-0.5">
                                            {p.category || 'General'}
                                        </span>
                                        <h4 className="font-bold text-[10.5px] sm:text-xs text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug group-hover:text-[#5f7d00] dark:group-hover:text-lime-400 transition-colors" title={p.name}>
                                            {p.name}
                                        </h4>
                                    </div>

                                    {/* Price & Add Button */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 shrink-0 w-full mt-0.5">
                                        <div className="text-[11px] sm:text-xs font-black font-mono text-[#8DB600] dark:text-lime-400 tracking-tight">
                                            {currency(p.price, { symbol: '₱' }).format()}
                                        </div>

                                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-150 shadow-2xs shrink-0 ${
                                            qtyInCart > 0
                                                ? 'bg-[#8DB600] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#8DB600] group-hover:text-white dark:group-hover:bg-[#8DB600] dark:group-hover:text-white'
                                        }`}>
                                            <Plus className="w-3 h-3 stroke-[2.5]" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-1.5 mt-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 shadow-2xs">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">
                                Page <strong className="text-slate-800 dark:text-slate-100">{currentPage}</strong> of {totalPages}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className="h-7 px-2.5 sm:px-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors text-[9.5px] sm:text-[10.5px]"
                                >
                                    <ChevronLeft className="w-3 h-3" /> Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    className="h-7 px-2.5 sm:px-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors text-[9.5px] sm:text-[10.5px]"
                                >
                                    Next <ChevronRight className="w-3 h-3" />
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