// src/components/pos/Product3DIconPicker.jsx
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { useProduct3DAssets } from '../../hooks/useProduct3DAssets';
import Product3DVisual from './Product3DVisual';

const CATEGORIES = ['All', 'Refills/Services', 'Containers', 'Bottled Water', 'Ice Cubes/Tubes', 'Accessories'];

export default function Product3DIconPicker({
                                                selectedKey = '',
                                                onSelect,
                                                compact = false,
                                                isAdmin = false
                                            }) {
    const { data: assets = [], isLoading } = useProduct3DAssets();
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    const normalizedSelected = String(selectedKey || '').replace(/^3d:/, '');

    const filteredAssets = useMemo(() => {
        return assets.filter((item) => {
            if (activeCategory !== 'All' && item.category !== activeCategory) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchLabel = String(item.label || '').toLowerCase().includes(q);
                const matchDesc = String(item.description || '').toLowerCase().includes(q);
                const matchKey = String(item.asset_key || '').toLowerCase().includes(q);
                if (!matchLabel && !matchDesc && !matchKey) return false;
            }
            return true;
        });
    }, [assets, activeCategory, search]);

    return (
        <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8DB600]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        Select 3D Station Visual
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {normalizedSelected && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-lime-100 dark:bg-lime-950/70 text-[#5f7d00] dark:text-lime-300 border border-lime-300/60 dark:border-lime-800/50">
                            {normalizedSelected}
                        </span>
                    )}
                    {isAdmin && (
                        <Link
                            href="/3d-icons"
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-600 dark:text-sky-400 hover:underline"
                        >
                            <span>Manage Library</span>
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Search & Category Pills */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search 3D jugs, refills, bottles, ice, dispenser..."
                        className="w-full h-9 pl-8 pr-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#8DB600]"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                activeCategory === cat
                                    ? 'bg-[#8DB600] text-white shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Uniform 1:1 3D Icons & Visuals Grid */}
            {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                    Loading 3D station assets...
                </div>
            ) : filteredAssets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-semibold">
                    No 3D icons match your filter.
                </div>
            ) : (
                <div
                    className={`grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto pr-1 ${
                        compact ? 'max-h-[240px]' : 'max-h-[300px]'
                    }`}
                >
                    {filteredAssets.map((item) => {
                        const isSelected = normalizedSelected === item.asset_key;
                        return (
                            <button
                                key={item.asset_key}
                                type="button"
                                onClick={() => onSelect?.(item)}
                                className={`group relative flex flex-col items-center text-center p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                                    isSelected
                                        ? 'bg-lime-50/90 dark:bg-lime-950/40 border-[#8DB600] ring-1 ring-[#8DB600]/40 shadow-xs'
                                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-[#8DB600]/70'
                                }`}
                            >
                                {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-[#8DB600] absolute top-1.5 right-1.5" />
                                )}
                                {/* Strictly uniform 56x56 (w-14 h-14) square slot for every icon */}
                                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                                    <Product3DVisual
                                        assetKey={item.asset_key}
                                        customImageUrl={item.image_url}
                                        className="w-14 h-14"
                                    />
                                </div>
                                <span className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 mt-1.5">
                                    {item.label}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                    {item.category}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}