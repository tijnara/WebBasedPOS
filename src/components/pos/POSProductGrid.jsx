// src/components/pos/POSProductGrid.jsx
import React from 'react';
import currency from 'currency.js';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Product3DVisual from './Product3DVisual';

const POSProductGrid = ({
                            isLoading,
                            products = [],
                            handleAdd,
                            openCustomSale,
                            currentPage = 1,
                            totalPages = 1,
                            setCurrentPage,
                            currentSale = {}
                        }) => {
    const isServiceItem = (p) => {
        if (!p) return false;
        if (p.is_custom || p.track_stock === false) return true;
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('refill') || cat.includes('service') || name.startsWith('refill');
    };

    const validProducts = products.filter(
        (p) =>
            !p.is_hidden &&
            (Number(p.price) > 0 || p.is_custom) &&
            p.name?.toLowerCase() !== 'unknown' &&
            !p.name?.toLowerCase().includes('removed')
    );

    return (
        <div className="w-full flex-1 flex flex-col justify-between min-h-0">
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 h-44 sm:h-48 flex flex-col justify-between"
                        >
                            <div className="w-16 h-16 mx-auto my-auto bg-slate-100 dark:bg-slate-800 rounded-full" />
                            <div className="space-y-1.5 mt-2">
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Mobile-First 2-Col -> Tablet 3-Col -> Desktop 4-Col 3D Product Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 items-stretch">
                        {/* --- FIRST SLOT: Open Sale • Custom Item (P) --- */}
                        <button
                            type="button"
                            onClick={openCustomSale}
                            className="pos-product-card group relative flex flex-col items-center justify-center text-center p-3 sm:p-4 min-h-[164px] sm:min-h-[186px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-[#8DB600] dark:hover:border-emerald-400/70 bg-white/70 dark:bg-[#131b2b] hover:bg-lime-50/40 dark:hover:bg-slate-800/60 transition-all duration-150 cursor-pointer active:scale-[0.98] select-none"
                        >
                            <div className="w-10 h-10 rounded-full border-2 border-slate-400/80 dark:border-slate-600 group-hover:border-[#8DB600] dark:group-hover:border-emerald-400 text-slate-600 dark:text-slate-300 group-hover:text-[#659000] dark:group-hover:text-emerald-400 flex items-center justify-center mb-2.5 transition-colors">
                                <Plus className="w-5 h-5 stroke-[2.5]" />
                            </div>
                            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-snug">
                                Open Sale • Custom Item (P)
                            </span>
                            <span className="text-[10.5px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                Tap to add custom price
                            </span>
                        </button>

                        {/* --- Catalog Products with 3D Visuals --- */}
                        {validProducts.map((p) => {
                            const hotkey = p.id === 30 ? '1' : p.id === 3 ? '2' : p.id === 2 ? '3' : null;
                            const stockNum = Number(p.stock ?? p.stock_quantity ?? 0);
                            const isService = isServiceItem(p);

                            const isOutOfStock = !isService && stockNum <= 0;

                            const qtyInCart = Object.values(currentSale || {}).reduce((sum, item) => {
                                const matches = item.productId === p.id || item.id === p.id;
                                return matches ? sum + (item.quantity || 0) : sum;
                            }, 0);

                            const formattedStock = new Intl.NumberFormat('en-US', {
                                maximumFractionDigits: 3
                            }).format(stockNum);

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleAdd(p)}
                                    disabled={isOutOfStock}
                                    className={`pos-product-card text-left rounded-2xl border p-3 sm:p-3.5 flex flex-col justify-between relative group select-none transition-all duration-150 outline-none min-h-[164px] sm:min-h-[186px] ${
                                        isOutOfStock
                                            ? 'opacity-45 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/40'
                                            : qtyInCart > 0
                                                ? 'bg-white dark:bg-[#161f30] border-[#8DB600] dark:border-emerald-400 ring-1 ring-[#8DB600]/40 shadow-sm active:scale-[0.98]'
                                                : 'bg-white dark:bg-[#161f30] border-slate-200/90 dark:border-slate-800 hover:border-[#8DB600] dark:hover:border-emerald-500/50 shadow-2xs hover:shadow-md active:scale-[0.98] cursor-pointer'
                                    }`}
                                >
                                    {/* Top Badges Row: Hotkey / In-Cart + Available / Stock Counter */}
                                    <div className="flex items-center justify-between gap-1 w-full z-10">
                                        <div className="flex items-center gap-1">
                                            {hotkey && (
                                                <span className="w-4.5 h-4.5 px-1.5 py-0.5 flex items-center justify-center bg-slate-900 dark:bg-slate-700 text-white font-mono text-[9px] font-black rounded shadow-2xs">
                                                    {hotkey}
                                                </span>
                                            )}
                                            {qtyInCart > 0 && (
                                                <span className="bg-[#8DB600] text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-full shadow-2xs font-mono">
                                                    {qtyInCart} in cart
                                                </span>
                                            )}
                                        </div>

                                        {isService ? (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                                                Available
                                            </span>
                                        ) : isOutOfStock ? (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                                                0 left
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                                                {formattedStock} left
                                            </span>
                                        )}
                                    </div>

                                    {/* Center: Clean 3D Product Render (Ignores product.image_url) */}
                                    <div className="w-full my-auto py-1 flex items-center justify-center">
                                        <Product3DVisual
                                            product={p}
                                            className="w-16 h-16 sm:w-20 sm:h-20"
                                        />
                                    </div>

                                    {/* Bottom: Category, Name, Price & '+' Add Pill */}
                                    <div className="w-full space-y-0.5 z-10">
                                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 block truncate">
                                            {p.category || 'GENERAL'}
                                        </span>
                                        <h4
                                            className="font-extrabold text-xs sm:text-[13px] text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-[#5f7d00] dark:group-hover:text-emerald-300 transition-colors"
                                            title={p.name}
                                        >
                                            {p.name}
                                        </h4>

                                        <div className="flex items-center justify-between pt-1 w-full">
                                            <span className="text-xs sm:text-sm font-black font-mono text-[#659000] dark:text-emerald-400 tracking-tight">
                                                {currency(p.price, { symbol: '₱' }).format()}
                                            </span>

                                            <span
                                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 ${
                                                    qtyInCart > 0
                                                        ? 'bg-[#8DB600] text-white'
                                                        : 'bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-[#8DB600] group-hover:border-[#8DB600] group-hover:text-white'
                                                }`}
                                            >
                                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white dark:bg-[#161f30] px-3 py-2 mt-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 shadow-2xs">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">
                                Page <strong className="text-slate-800 dark:text-slate-100">{currentPage}</strong> of {totalPages}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className="h-7 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage && setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    className="h-7 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
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