// src/components/pos/Product3DVisual.jsx
import React, { useId } from 'react';

export const BUILTIN_WRS_3D_ASSETS = [
    { asset_key: 'dispenser', label: 'Walk-In Refill Booth (20L)', category: 'Refills/Services', description: 'Stainless steel walk-in ozone wash & digital meter refill bay', is_builtin: true, suggested_price: 20 },
    { asset_key: 'refill-25', label: 'Standard Delivery Refill (₱25)', category: 'Refills/Services', description: 'Apple Green Round & Slim 20L purified refill combo', is_builtin: true, suggested_price: 25 },
    { asset_key: 'refill-30', label: 'Express / Extended Refill (₱30)', category: 'Refills/Services', description: 'Extended-route doorstep refill combo', is_builtin: true, suggested_price: 30 },
    { asset_key: 'alkaline-refill', label: 'Alkaline / Mineral Refill (pH 8.5+)', category: 'Refills/Services', description: 'Remineralized alkaline 20L water refill', is_builtin: true, suggested_price: 35 },
    { asset_key: 'delivery-multicab', label: 'Doorstep Multicab Delivery', category: 'Refills/Services', description: 'Barangay delivery dispatch service', is_builtin: true, suggested_price: 10 },
    { asset_key: 'round-container', label: '20L Round Carboy (Apple Green • SEASIDE)', category: 'Containers', description: 'Apple Green polycarbonate round gallon with SEASIDE label', is_builtin: true, suggested_price: 200 },
    { asset_key: 'round-carboy-blue', label: '20L Round Carboy (Classic Aqua Blue)', category: 'Containers', description: 'Standard clear-blue polycarbonate round gallon', is_builtin: true, suggested_price: 200 },
    { asset_key: 'slim', label: '20L Slim Container w/ Faucet (Apple Green)', category: 'Containers', description: 'Apple Green slim gallon with red push-paddle faucet', is_builtin: true, suggested_price: 200 },
    { asset_key: 'slim-blue', label: '20L Slim Container w/ Faucet (Classic Blue)', category: 'Containers', description: 'Standard blue HDPE slim container with faucet', is_builtin: true, suggested_price: 200 },
    { asset_key: 'mini-dispenser-10l', label: '10L Mini Countertop Jug w/ Faucet', category: 'Containers', description: 'Compact 2.5-gallon tabletop dispenser jug', is_builtin: true, suggested_price: 140 },
    { asset_key: 'bottle', label: 'PET Bottled Water (350ml / 500ml)', category: 'Bottled Water', description: 'Single sealed PET purified drinking water bottle', is_builtin: true, suggested_price: 6 },
    { asset_key: 'bottle-case', label: 'Bottled Water Case (24 × 500ml)', category: 'Bottled Water', description: 'Shrink-wrapped 24-bottle wholesale case', is_builtin: true, suggested_price: 135 },
    { asset_key: 'pet-6l', label: '6L Family PET Gallon w/ Handle', category: 'Bottled Water', description: '6-liter handled purified water bottle', is_builtin: true, suggested_price: 55 },
    { asset_key: 'ice', label: 'Purified Tube Ice Bag (2kg / 5kg)', category: 'Ice Cubes/Tubes', description: 'Hollow tube ice manufactured from 21-stage RO water', is_builtin: true, suggested_price: 20 },
    { asset_key: 'ice-cubes', label: 'Crystal Ice Cubes Pack', category: 'Ice Cubes/Tubes', description: 'Food-grade crystal beverage ice cubes', is_builtin: true, suggested_price: 25 },
    { asset_key: 'caps-seals', label: 'Non-Spill Caps & Heat-Shrink Seals', category: 'Accessories', description: '5-gallon replacement snap caps & tamper neck seals', is_builtin: true, suggested_price: 15 },
    { asset_key: 'faucet-replacement', label: 'Tomlinson Push-Paddle Faucet', category: 'Accessories', description: 'Replacement white spout & red thumb lever faucet', is_builtin: true, suggested_price: 45 },
    { asset_key: 'water-dispenser', label: 'Hot & Cold Tabletop Dispenser', category: 'Accessories', description: 'Top-load hot & cold water dispenser unit', is_builtin: true, suggested_price: 1850 }
];

const BUILTIN_KEYS = new Set(BUILTIN_WRS_3D_ASSETS.map((a) => a.asset_key));
const CUSTOM_ASSET_URL_MAP = new Map();

export function registerCustom3DAssetsCache(assets = []) {
    CUSTOM_ASSET_URL_MAP.clear();
    assets.forEach((item) => {
        if (item?.asset_key && item?.image_url) {
            CUSTOM_ASSET_URL_MAP.set(item.asset_key, item.image_url);
        }
    });
}

export function getCustom3DAssetUrl(key) {
    if (!key) return null;
    const cleanKey = String(key).replace(/^3d:/, '').trim();
    return CUSTOM_ASSET_URL_MAP.get(cleanKey) || null;
}

/**
 * Resolves the 3D asset key for a product:
 * 1) Explicit database selection (`product.icon_3d_key` or `image_url: "3d:<key>"`)
 * 2) Smart fallback based on product name & category
 */
export function resolveProduct3DType(product) {
    if (!product) return 'refill-25';

    const explicitKey = String(product.icon_3d_key || '').trim();
    if (explicitKey) {
        return explicitKey;
    }

    const imgUrl = String(product.image_url || '').trim();
    if (imgUrl.startsWith('3d:')) {
        const parsedKey = imgUrl.slice(3).trim();
        if (parsedKey) return parsedKey;
    }

    const name = String(product.name || '').toLowerCase();
    const category = String(product.category || '').toLowerCase();

    if (name.includes('walk-in') || name.includes('walk in') || name.includes('dispenser') || name.includes('booth')) {
        return name.includes('hot') || name.includes('cold') ? 'water-dispenser' : 'dispenser';
    }
    if (name.includes('alkaline')) return 'alkaline-refill';
    if (name.includes('delivery') || name.includes('multicab')) return 'delivery-multicab';
    if (name.includes('10l') || name.includes('mini')) return 'mini-dispenser-10l';
    if (name.includes('slim')) return name.includes('blue') ? 'slim-blue' : 'slim';
    if ((name.includes('container') && name.includes('round')) || name === 'round container') {
        return name.includes('blue') ? 'round-carboy-blue' : 'round-container';
    }
    if (name.includes('refill') || category.includes('refill')) {
        return name.includes('30') ? 'refill-30' : 'refill-25';
    }
    if (/\bice\b/.test(name) || /\bice\b/.test(category) || name.includes('tube')) {
        return name.includes('cube') ? 'ice-cubes' : 'ice';
    }
    if (name.includes('case') || name.includes('24')) return 'bottle-case';
    if (name.includes('6l')) return 'pet-6l';
    if (name.includes('pet') || name.includes('bottle') || name.includes('350ml') || name.includes('500ml') || category.includes('bottled')) {
        return 'bottle';
    }
    if (name.includes('cap') || name.includes('seal')) return 'caps-seals';
    if (name.includes('faucet') || name.includes('spigot')) return 'faucet-replacement';
    if (name.includes('round') || name.includes('carboy') || name.includes('gallon')) {
        return 'round-container';
    }

    return 'droplet';
}

export default function Product3DVisual({
                                            product,
                                            assetKey,
                                            customImageUrl,
                                            className = 'w-16 h-16 sm:w-20 sm:h-20'
                                        }) {
    const uid = useId().replace(/:/g, '');
    const resolvedKey = assetKey ? String(assetKey).replace(/^3d:/, '').trim() : resolveProduct3DType(product);
    const resolvedCustomUrl =
        customImageUrl ||
        getCustom3DAssetUrl(resolvedKey) ||
        (product?.image_url &&
        !String(product.image_url).startsWith('3d:') &&
        (String(product.image_url).startsWith('http') || String(product.image_url).startsWith('data:'))
            ? product.image_url
            : null);

    const type = BUILTIN_KEYS.has(resolvedKey) ? resolvedKey : resolvedCustomUrl ? 'custom-image' : 'droplet';

    const isAppleGreen = ['slim', 'round-container', 'refill-25', 'refill-30', 'delivery-multicab'].includes(type);
    const glowClass = isAppleGreen
        ? 'bg-[#8DB600]/35'
        : type === 'alkaline-refill'
            ? 'bg-indigo-400/35'
            : 'bg-cyan-400/30';

    return (
        <div
            className={`relative aspect-square shrink-0 flex items-center justify-center select-none pointer-events-none transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5 ${className}`}
        >
            <div className={`absolute inset-2 rounded-full blur-md opacity-45 transition-opacity group-hover:opacity-75 ${glowClass}`} />

            {/* CUSTOM ADMIN-ADDED 3D ICON / IMAGE (Uniform 1:1 Normalized Box) */}
            {type === 'custom-image' && resolvedCustomUrl && (
                <div className="relative z-10 w-full h-full p-1 flex items-center justify-center">
                    <img
                        src={resolvedCustomUrl}
                        alt={product?.name || resolvedKey}
                        className="w-full h-full object-contain drop-shadow-[0_8px_12px_rgba(2,132,199,0.32)]"
                    />
                </div>
            )}

            {/* 1. WALK-IN REFILL DISPENSER BOOTH */}
            {type === 'dispenser' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]">
                    <defs>
                        <linearGradient id={`dispBody_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#cbd5e1" />
                            <stop offset="55%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                        <linearGradient id={`dispSide_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#64748b" />
                            <stop offset="100%" stopColor="#334155" />
                        </linearGradient>
                        <linearGradient id={`dispJug_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7dd3fc" />
                            <stop offset="50%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="48" cy="88" rx="30" ry="4.5" fill="rgba(2, 132, 199, 0.28)" />
                    <path d="M62 12 L74 17 L74 82 L62 86 Z" fill={`url(#dispSide_${uid})`} />
                    <path d="M22 12 L62 12 L74 17 L32 17 Z" fill="#e2e8f0" />
                    <rect x="22" y="12" width="40" height="74" rx="4" fill={`url(#dispBody_${uid})`} />
                    <rect x="27" y="17" width="30" height="14" rx="2.5" fill="#0f172a" />
                    <rect x="30" y="20" width="16" height="8" rx="1.5" fill="#06b6d4" opacity="0.85" />
                    <text x="38" y="26" textAnchor="middle" fill="#ecfeff" fontSize="6.5" fontWeight="900" fontFamily="monospace">20.0L</text>
                    <circle cx="51" cy="24" r="2.2" fill="#8DB600" />
                    <rect x="27" y="35" width="30" height="42" rx="3" fill="#0f172a" />
                    <rect x="40" y="35" width="4" height="5" rx="1" fill="#cbd5e1" />
                    <rect x="41.2" y="40" width="1.6" height="9" fill="#7dd3fc" opacity="0.9" />
                    <rect x="35" y="47" width="14" height="3" rx="1" fill="#0284c7" />
                    <path d="M32 54 C32 50, 52 50, 52 54 L52 73 C52 75, 32 75, 32 73 Z" fill={`url(#dispJug_${uid})`} />
                    <rect x="32" y="59" width="20" height="2.2" fill="#bae6fd" opacity="0.65" />
                    <rect x="32" y="66" width="20" height="2.2" fill="#bae6fd" opacity="0.65" />
                    <rect x="25" y="77" width="34" height="5" rx="1.5" fill="#334155" />
                </svg>
            )}

            {/* 2. REFILL(25) & REFILL(30) — MIX OF APPLE GREEN ROUND + SLIM CONTAINER */}
            {(type === 'refill-25' || type === 'refill-30') && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(101,144,0,0.4)]">
                    <defs>
                        <linearGradient id={`mixRound_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a3d100" />
                            <stop offset="32%" stopColor="#bef264" />
                            <stop offset="70%" stopColor="#8DB600" />
                            <stop offset="100%" stopColor="#4d7c0f" />
                        </linearGradient>
                        <linearGradient id={`mixSlimF_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a3d100" />
                            <stop offset="55%" stopColor="#8DB600" />
                            <stop offset="100%" stopColor="#5f7d00" />
                        </linearGradient>
                        <linearGradient id={`mixSlimS_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#659000" />
                            <stop offset="100%" stopColor="#3f5900" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="48" cy="87.5" rx="38" ry="4.5" fill="rgba(101, 144, 0, 0.34)" />
                    <rect x="24.5" y="13" width="11" height="4.8" rx="1.6" fill="#f8fafc" />
                    <rect x="25.8" y="17.8" width="8.4" height="4" fill="#659000" />
                    <rect x="24.2" y="21" width="11.6" height="2.8" rx="1.2" fill="#4d7c0f" />
                    <path d="M24.5 23.5 C18 26, 12 30.5, 12 36.5 L12 78 C12 81.5, 16 83.5, 30 83.5 C44 83.5, 48 81.5, 48 78 L48 36.5 C48 30.5, 42 26, 35.5 23.5 Z" fill={`url(#mixRound_${uid})`} />
                    <rect x="11.2" y="42" width="37.6" height="3.2" rx="1.6" fill="#d9f99d" opacity="0.78" />
                    <rect x="11.2" y="62" width="37.6" height="3.2" rx="1.6" fill="#d9f99d" opacity="0.78" />
                    <rect x="11.2" y="74" width="37.6" height="3.8" rx="1.8" fill="#bef264" opacity="0.82" />
                    <rect x="13.5" y="47.5" width="33" height="11.5" rx="2" fill="#ffffff" opacity="0.96" />
                    <rect x="13.5" y="47.5" width="33" height="2" rx="1" fill="#0284c7" />
                    <text x="30" y="56" textAnchor="middle" fill="#0f172a" fontSize="6" fontWeight="900">SEASIDE</text>

                    <path d="M62 18 C62 13.5, 74 13.5, 74 18.5 L74 23" fill="none" stroke="#659000" strokeWidth="3.8" strokeLinecap="round" />
                    <rect x="46" y="22" width="25" height="61" rx="5" fill={`url(#mixSlimF_${uid})`} />
                    <path d="M68 22 L80 25.5 C82.5 26.3, 83.5 28, 83.5 30.5 L83.5 77.5 C83.5 80, 81.8 81.8, 79.2 82 L68 83 Z" fill={`url(#mixSlimS_${uid})`} />
                    <rect x="53" y="16" width="11" height="4.6" rx="1.6" fill="#0284c7" />
                    <rect x="52.5" y="20.2" width="12" height="2" rx="0.8" fill="#f8fafc" />
                    <rect x="49.5" y="31" width="18" height="23" rx="2" fill="#ffffff" />
                    <rect x="49.5" y="31" width="18" height="3.8" rx="0.8" fill="#dc2626" />
                    <circle cx="58.5" cy="40.5" r="2.8" fill="#ecfccb" stroke="#8DB600" strokeWidth="0.9" />
                    <rect x="51.5" y="45.5" width="14" height="2.6" rx="0.6" fill="#659000" />
                    <rect x="49.5" y="50.5" width="18" height="3.5" rx="0.8" fill="#facc15" />
                    <rect x="61.5" y="65" width="9" height="12.5" rx="2" fill="#3f5900" />
                    <rect x="64" y="68.5" width="4.8" height="3.2" rx="0.8" fill="#f8fafc" />
                    <rect x="66.2" y="69.5" width="2.8" height="6" rx="0.8" fill="#f8fafc" />
                    <rect x="66.2" y="65.5" width="2.8" height="4.2" rx="0.8" fill="#dc2626" />

                    <rect x="33" y="73.5" width="30" height="15" rx="7.5" fill={type === 'refill-30' ? '#0d9488' : '#0284c7'} stroke="#ffffff" strokeWidth="1.6" />
                    <text x="48" y="83.6" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
                        {type === 'refill-30' ? '₱30' : '₱25'}
                    </text>
                </svg>
            )}

            {/* 3. ROUND CARBOY (APPLE GREEN SEASIDE / AQUA BLUE / ALKALINE) */}
            {(type === 'round-container' || type === 'round-carboy-blue' || type === 'alkaline-refill') && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(2,132,199,0.35)]">
                    <defs>
                        <linearGradient id={`rcShell_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            {type === 'round-container' ? (
                                <>
                                    <stop offset="0%" stopColor="#a3d100" />
                                    <stop offset="30%" stopColor="#bef264" />
                                    <stop offset="68%" stopColor="#8DB600" />
                                    <stop offset="100%" stopColor="#4d7c0f" />
                                </>
                            ) : type === 'alkaline-refill' ? (
                                <>
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="35%" stopColor="#e0e7ff" />
                                    <stop offset="72%" stopColor="#4f46e5" />
                                    <stop offset="100%" stopColor="#312e81" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#7dd3fc" />
                                    <stop offset="35%" stopColor="#e0f2fe" />
                                    <stop offset="72%" stopColor="#38bdf8" />
                                    <stop offset="100%" stopColor="#0284c7" />
                                </>
                            )}
                        </linearGradient>
                    </defs>
                    <ellipse cx="48" cy="88" rx="24" ry="4" fill="rgba(2, 132, 199, 0.3)" />
                    <rect x="41" y="9" width="14" height="6" rx="2" fill="#f8fafc" />
                    <rect x="42.5" y="15" width="11" height="5" fill={type === 'round-container' ? '#659000' : '#0284c7'} />
                    <rect x="40.5" y="19" width="15" height="3.5" rx="1.5" fill={type === 'round-container' ? '#4d7c0f' : '#0369a1'} />
                    <path d="M41 22 C33 25, 25 30, 25 37 L25 80 C25 84, 30 86, 48 86 C66 86, 71 84, 71 80 L71 37 C71 30, 63 25, 55 22 Z" fill={`url(#rcShell_${uid})`} />
                    <rect x="24" y="43" width="48" height="4" rx="2" fill="#ffffff" opacity="0.45" />
                    <rect x="24" y="65" width="48" height="4" rx="2" fill="#ffffff" opacity="0.45" />
                    <rect x="24" y="77" width="48" height="4.5" rx="2" fill="#ffffff" opacity="0.5" />
                    <rect x="26.5" y="49.5" width="43" height="13" rx="2.5" fill="#ffffff" opacity="0.96" />
                    <rect x="26.5" y="49.5" width="43" height="2.2" rx="1" fill={type === 'alkaline-refill' ? '#4f46e5' : '#0284c7'} />
                    <text x="48" y="58.8" textAnchor="middle" fill="#0f172a" fontSize="7.2" fontWeight="900">
                        {type === 'alkaline-refill' ? 'pH 8.5+' : 'SEASIDE'}
                    </text>
                    <path d="M30 33 L30 78" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
                </svg>
            )}

            {/* 4. SLIM CONTAINER W/ FAUCET (APPLE GREEN OR CLASSIC BLUE) & 10L MINI JUG */}
            {(type === 'slim' || type === 'slim-blue' || type === 'mini-dispenser-10l') && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(101,144,0,0.38)]">
                    <defs>
                        <linearGradient id={`slF_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            {type === 'slim-blue' ? (
                                <>
                                    <stop offset="0%" stopColor="#38bdf8" />
                                    <stop offset="55%" stopColor="#0284c7" />
                                    <stop offset="100%" stopColor="#0369a1" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#a3d100" />
                                    <stop offset="55%" stopColor="#8DB600" />
                                    <stop offset="100%" stopColor="#5f7d00" />
                                </>
                            )}
                        </linearGradient>
                        <linearGradient id={`slS_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={type === 'slim-blue' ? '#0369a1' : '#659000'} />
                            <stop offset="100%" stopColor={type === 'slim-blue' ? '#0c4a6e' : '#3f5900'} />
                        </linearGradient>
                    </defs>
                    <ellipse cx="49" cy="88" rx="25" ry="4" fill="rgba(101, 144, 0, 0.32)" />
                    <path d="M46 15 C46 10, 61 10, 61 16 L61 21" fill="none" stroke={type === 'slim-blue' ? '#0369a1' : '#659000'} strokeWidth="4.5" strokeLinecap="round" />
                    <rect x="24" y="20" width="32" height="65" rx="6" fill={`url(#slF_${uid})`} />
                    <path d="M52 20 L66 24 C69 25, 70 27, 70 30 L70 79 C70 82, 68 84, 65 84 L52 85 Z" fill={`url(#slS_${uid})`} />
                    <rect x="33" y="13" width="14" height="5.5" rx="2" fill="#0284c7" />
                    <rect x="32.5" y="18" width="15" height="2.4" rx="1" fill="#f8fafc" />
                    <rect x="29" y="30" width="22" height="27" rx="2.5" fill="#ffffff" />
                    <rect x="29" y="30" width="22" height="4.5" rx="1" fill="#dc2626" />
                    <circle cx="40" cy="41" r="3.5" fill="#ecfccb" stroke="#8DB600" strokeWidth="1" />
                    <rect x="31.5" y="47" width="17" height="3" rx="0.8" fill="#659000" />
                    <rect x="29" y="53" width="22" height="4" rx="1" fill="#facc15" />
                    <rect x="44" y="67" width="11" height="14" rx="2.5" fill={type === 'slim-blue' ? '#0c4a6e' : '#3f5900'} />
                    <rect x="47" y="71" width="6" height="4" rx="1" fill="#f8fafc" />
                    <rect x="50" y="72" width="3.5" height="7" rx="1" fill="#f8fafc" />
                    <rect x="50" y="67.5" width="3.5" height="5" rx="1" fill="#dc2626" />
                </svg>
            )}

            {/* 5. PET BOTTLES (SINGLE / CASE / 6L) */}
            {(type === 'bottle' || type === 'bottle-case' || type === 'pet-6l') && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(2,132,199,0.35)]">
                    <defs>
                        <linearGradient id={`petG_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7dd3fc" />
                            <stop offset="35%" stopColor="#e0f2fe" />
                            <stop offset="75%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="48" cy="88" rx={type === 'bottle-case' ? 30 : 18} ry="3.8" fill="rgba(2, 132, 199, 0.32)" />
                    {type === 'bottle-case' ? (
                        <>
                            {[24, 41, 58].map((bx) => (
                                <g key={bx}>
                                    <rect x={bx + 3} y="16" width="8" height="4" rx="1.2" fill="#0284c7" />
                                    <rect x={bx} y="20" width="14" height="62" rx="3.5" fill={`url(#petG_${uid})`} />
                                    <rect x={bx} y="42" width="14" height="12" fill="#0369a1" />
                                    <rect x={bx} y="42" width="14" height="2" fill="#8DB600" />
                                </g>
                            ))}
                            <rect x="21" y="54" width="54" height="29" rx="3" fill="#bae6fd" opacity="0.42" stroke="#ffffff" strokeWidth="1.2" />
                        </>
                    ) : (
                        <>
                            <rect x="42" y="10" width="12" height="5.5" rx="1.8" fill="#0284c7" />
                            <path
                                d={
                                    type === 'pet-6l'
                                        ? 'M42 18 C34 23, 28 28, 28 35 L28 80 C28 84, 32 86, 48 86 C64 86, 68 84, 68 80 L68 35 C68 28, 62 23, 54 18 Z'
                                        : 'M43 18 C39 23, 35 28, 35 34 L35 80 C35 84, 38 86, 48 86 C58 86, 61 84, 61 80 L61 34 C61 28, 57 23, 53 18 Z'
                                }
                                fill={`url(#petG_${uid})`}
                            />
                            <rect x={type === 'pet-6l' ? 28 : 35} y="42" width={type === 'pet-6l' ? 40 : 26} height="16" fill="#0369a1" />
                            <rect x={type === 'pet-6l' ? 28 : 35} y="42" width={type === 'pet-6l' ? 40 : 26} height="2.5" fill="#8DB600" />
                            <text x="48" y="52" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                                {type === 'pet-6l' ? 'SEASIDE 6L' : 'SEASIDE'}
                            </text>
                        </>
                    )}
                </svg>
            )}

            {/* 6. PURIFIED TUBE ICE & CRYSTAL ICE CUBES */}
            {(type === 'ice' || type === 'ice-cubes') && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(56,189,248,0.32)]">
                    <defs>
                        <linearGradient id={`iceBag_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.92" />
                            <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.82" />
                            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.9" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="48" cy="88" rx="23" ry="4" fill="rgba(56, 189, 248, 0.3)" />
                    <path d="M41 12 L45 21 L51 21 L55 12 L50 14 L48 10 L46 14 Z" fill="#e0f2fe" />
                    <rect x="42" y="20" width="12" height="3.2" rx="1.5" fill="#0284c7" />
                    <path d="M42 23 C31 28, 25 40, 26 68 C26.5 80, 32 85, 48 85 C64 85, 69.5 80, 70 68 C71 40, 65 28, 54 23 Z" fill={`url(#iceBag_${uid})`} stroke="#ffffff" strokeWidth="1.2" />
                    {[
                        { cx: 38, cy: 44 }, { cx: 48, cy: 41 }, { cx: 57, cy: 45 },
                        { cx: 35, cy: 55 }, { cx: 45, cy: 53 }, { cx: 55, cy: 55 }, { cx: 61, cy: 56 },
                        { cx: 34, cy: 66 }, { cx: 43, cy: 65 }, { cx: 52, cy: 66 }, { cx: 60, cy: 67 },
                        { cx: 38, cy: 76 }, { cx: 48, cy: 76 }, { cx: 58, cy: 76 }
                    ].map((cube, idx) =>
                        type === 'ice-cubes' ? (
                            <rect key={idx} x={cube.cx - 4.5} y={cube.cy - 4.5} width="9" height="9" rx="2" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1.1" />
                        ) : (
                            <g key={idx}>
                                <circle cx={cube.cx} cy={cube.cy} r="5.2" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1.1" />
                                <circle cx={cube.cx} cy={cube.cy} r="1.8" fill="#7dd3fc" opacity="0.7" />
                            </g>
                        )
                    )}
                </svg>
            )}

            {/* 7. ACCESSORIES & EQUIPMENT */}
            {type === 'delivery-multicab' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(101,144,0,0.35)]">
                    <ellipse cx="48" cy="84" rx="34" ry="4" fill="rgba(101, 144, 0, 0.3)" />
                    <rect x="14" y="34" width="44" height="32" rx="4" fill="#8DB600" />
                    <path d="M58 40 L74 40 L82 52 L82 66 L58 66 Z" fill="#f8fafc" />
                    <path d="M61 43 L72 43 L78 52 L61 52 Z" fill="#38bdf8" />
                    <rect x="20" y="42" width="32" height="11" rx="2" fill="#ffffff" />
                    <text x="36" y="49.5" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="900">SEASIDE</text>
                    <circle cx="28" cy="68" r="8" fill="#1e293b" />
                    <circle cx="28" cy="68" r="3.5" fill="#94a3b8" />
                    <circle cx="70" cy="68" r="8" fill="#1e293b" />
                    <circle cx="70" cy="68" r="3.5" fill="#94a3b8" />
                </svg>
            )}

            {type === 'caps-seals' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(2,132,199,0.3)]">
                    <ellipse cx="48" cy="84" rx="26" ry="4" fill="rgba(2, 132, 199, 0.25)" />
                    <ellipse cx="36" cy="54" rx="18" ry="7" fill="#0284c7" />
                    <rect x="18" y="54" width="36" height="16" rx="4" fill="#0369a1" />
                    <ellipse cx="62" cy="42" rx="16" ry="6.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                    <rect x="46" y="42" width="32" height="14" rx="3.5" fill="#e2e8f0" />
                    <rect x="24" y="30" width="24" height="12" rx="3" fill="#8DB600" opacity="0.85" />
                </svg>
            )}

            {type === 'faucet-replacement' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(220,38,38,0.28)]">
                    <ellipse cx="48" cy="84" rx="22" ry="4" fill="rgba(148, 163, 184, 0.3)" />
                    <rect x="22" y="38" width="10" height="24" rx="3" fill="#cbd5e1" />
                    <rect x="30" y="44" width="34" height="12" rx="4" fill="#f8fafc" />
                    <rect x="52" y="48" width="12" height="26" rx="4" fill="#f8fafc" />
                    <rect x="51" y="38" width="14" height="8" rx="2" fill="#dc2626" />
                    <rect x="54" y="18" width="8" height="22" rx="3" fill="#ef4444" />
                </svg>
            )}

            {type === 'water-dispenser' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(2,132,199,0.3)]">
                    <ellipse cx="48" cy="88" rx="24" ry="4" fill="rgba(2, 132, 199, 0.28)" />
                    <rect x="35" y="10" width="26" height="26" rx="6" fill="#38bdf8" />
                    <rect x="28" y="34" width="40" height="50" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                    <rect x="34" y="42" width="28" height="20" rx="3" fill="#1e293b" />
                    <circle cx="42" cy="49" r="3" fill="#ef4444" />
                    <circle cx="54" cy="49" r="3" fill="#38bdf8" />
                </svg>
            )}

            {type === 'droplet' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(6,182,212,0.35)]">
                    <defs>
                        <radialGradient id={`dropGrad_${uid}`} cx="35%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#ecfeff" />
                            <stop offset="45%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0369a1" />
                        </radialGradient>
                    </defs>
                    <ellipse cx="48" cy="88" rx="18" ry="3.5" fill="rgba(2, 132, 199, 0.3)" />
                    <path d="M48 14 C48 14, 24 44, 24 61 C24 74.5, 34.8 84, 48 84 C61.2 84, 72 74.5, 72 61 C72 44, 48 14, 48 14 Z" fill={`url(#dropGrad_${uid})`} />
                    <ellipse cx="39" cy="52" rx="4" ry="9" transform="rotate(-18 39 52)" fill="#ffffff" opacity="0.7" />
                </svg>
            )}
        </div>
    );
}