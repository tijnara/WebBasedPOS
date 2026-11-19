// src/components/pos/Product3DVisual.jsx
import React, { useId } from 'react';

/**
 * Resolves which 3D product illustration to render based on product name & category.
 * Ignores product.image_url intentionally for a clean, unified 3D catalog look.
 */
export function resolveProduct3DType(product) {
    if (!product) return 'refill-25';
    const name = String(product.name || '').toLowerCase();
    const category = String(product.category || '').toLowerCase();

    // 1. Walk-in Refill Dispenser Booth
    if (
        name.includes('walk-in') ||
        name.includes('walk in') ||
        name.includes('dispenser') ||
        name.includes('booth')
    ) {
        return 'dispenser';
    }

    // 2. Slim Container (Apple Green w/ Faucet)
    if (name.includes('slim')) {
        return 'slim';
    }

    // 3. Round Container (Apple Green w/ SEASIDE label)
    if (
        (name.includes('container') && name.includes('round')) ||
        (category.includes('container') && name.includes('round')) ||
        name === 'round container'
    ) {
        return 'round-container';
    }

    // 4. Refills/Services: Refill(25) & Refill(30) -> Mix of Apple Green Round + Slim Container
    if (name.includes('refill') || category.includes('refill')) {
        if (name.includes('30')) {
            return 'refill-30';
        }
        return 'refill-25';
    }

    // 5. Ice Cubes / Ice Tubes (word-boundary safe so "services" never matches)
    if (/\bice\b/.test(name) || /\bice\b/.test(category) || name.includes('tube')) {
        return 'ice';
    }

    // 6. PET Bottled Water
    if (
        name.includes('pet') ||
        name.includes('bottle') ||
        name.includes('350ml') ||
        name.includes('500ml') ||
        name.includes('1l') ||
        category.includes('bottled')
    ) {
        return 'bottle';
    }

    // 7. Generic Round Carboy fallback
    if (name.includes('round') || name.includes('carboy') || name.includes('gallon')) {
        return 'round-container';
    }

    return 'droplet';
}

export default function Product3DVisual({ product, className = 'w-16 h-16 sm:w-20 sm:h-20' }) {
    const uid = useId().replace(/:/g, '');
    const type = resolveProduct3DType(product);

    const glowClass =
        type === 'slim' ||
        type === 'round-container' ||
        type === 'refill-25' ||
        type === 'refill-30'
            ? 'bg-[#8DB600]/35'
            : type === 'ice'
                ? 'bg-sky-300/35'
                : 'bg-cyan-400/30';

    return (
        <div
            className={`relative flex items-center justify-center select-none pointer-events-none transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5 ${className}`}
        >
            {/* Ambient radial glow behind 3D item */}
            <div
                className={`absolute inset-2 rounded-full blur-md opacity-45 transition-opacity group-hover:opacity-75 ${glowClass}`}
            />

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
                        <linearGradient id={`dispBay_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#1e293b" />
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

                    {/* Top Digital Meter */}
                    <rect x="27" y="17" width="30" height="14" rx="2.5" fill="#0f172a" />
                    <rect x="30" y="20" width="16" height="8" rx="1.5" fill="#06b6d4" opacity="0.85" />
                    <text x="38" y="26" textAnchor="middle" fill="#ecfeff" fontSize="6.5" fontWeight="900" fontFamily="monospace">
                        20.0L
                    </text>
                    <circle cx="51" cy="24" r="2.2" fill="#8DB600" />

                    {/* Recessed Refill Chamber */}
                    <rect x="27" y="35" width="30" height="42" rx="3" fill={`url(#dispBay_${uid})`} />
                    <rect x="40" y="35" width="4" height="5" rx="1" fill="#cbd5e1" />
                    <rect x="41.2" y="40" width="1.6" height="9" fill="#7dd3fc" opacity="0.9" />

                    {/* 3D Round Jug Inside Chamber */}
                    <rect x="35" y="47" width="14" height="3" rx="1" fill="#0284c7" />
                    <path
                        d="M32 54 C32 50, 52 50, 52 54 L52 73 C52 75, 32 75, 32 73 Z"
                        fill={`url(#dispJug_${uid})`}
                    />
                    <rect x="32" y="59" width="20" height="2.2" fill="#bae6fd" opacity="0.65" />
                    <rect x="32" y="66" width="20" height="2.2" fill="#bae6fd" opacity="0.65" />

                    {/* Bottom Drip Tray */}
                    <rect x="25" y="77" width="34" height="5" rx="1.5" fill="#334155" />
                </svg>
            )}

            {/* 2. REFILL(25) & REFILL(30) — MIX OF APPLE GREEN ROUND + SLIM CONTAINER */}
            {(type === 'refill-25' || type === 'refill-30') && (
                <svg
                    viewBox="0 0 96 96"
                    className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(101,144,0,0.4)]"
                >
                    <defs>
                        <linearGradient id={`mixRoundGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a3d100" />
                            <stop offset="32%" stopColor="#bef264" />
                            <stop offset="70%" stopColor="#8DB600" />
                            <stop offset="100%" stopColor="#4d7c0f" />
                        </linearGradient>
                        <linearGradient id={`mixSlimFront_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a3d100" />
                            <stop offset="55%" stopColor="#8DB600" />
                            <stop offset="100%" stopColor="#5f7d00" />
                        </linearGradient>
                        <linearGradient id={`mixSlimSide_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#659000" />
                            <stop offset="100%" stopColor="#3f5900" />
                        </linearGradient>
                    </defs>

                    {/* Shared Ground Shadow */}
                    <ellipse cx="48" cy="87.5" rx="38" ry="4.5" fill="rgba(101, 144, 0, 0.34)" />

                    {/* LEFT: APPLE GREEN 20L ROUND CARBOY */}
                    {/* White Non-Spill Snap Cap */}
                    <rect x="24.5" y="13" width="11" height="4.8" rx="1.6" fill="#f8fafc" />
                    <rect x="24.5" y="16.2" width="11" height="1.2" fill="#cbd5e1" />
                    {/* Apple Green Neck & Collar */}
                    <rect x="25.8" y="17.8" width="8.4" height="4" fill="#659000" />
                    <rect x="24.2" y="21" width="11.6" height="2.8" rx="1.2" fill="#4d7c0f" />
                    {/* Round Body */}
                    <path
                        d="M24.5 23.5 C18 26, 12 30.5, 12 36.5 L12 78 C12 81.5, 16 83.5, 30 83.5 C44 83.5, 48 81.5, 48 78 L48 36.5 C48 30.5, 42 26, 35.5 23.5 Z"
                        fill={`url(#mixRoundGrad_${uid})`}
                    />
                    {/* Frosted Bumper Rings */}
                    <rect x="11.2" y="42" width="37.6" height="3.2" rx="1.6" fill="#d9f99d" opacity="0.78" />
                    <rect x="11.2" y="62" width="37.6" height="3.2" rx="1.6" fill="#d9f99d" opacity="0.78" />
                    <rect x="11.2" y="74" width="37.6" height="3.8" rx="1.8" fill="#bef264" opacity="0.82" />
                    {/* SEASIDE Label on Round Jug */}
                    <rect x="13.5" y="47.5" width="33" height="11.5" rx="2" fill="#ffffff" opacity="0.96" />
                    <rect x="13.5" y="47.5" width="33" height="2" rx="1" fill="#0284c7" />
                    <text
                        x="30"
                        y="56"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="6"
                        fontWeight="900"
                        letterSpacing="0.3"
                        fontFamily="sans-serif"
                    >
                        SEASIDE
                    </text>
                    {/* Specular Highlight */}
                    <path
                        d="M16.2 33 L16.2 75"
                        stroke="#ecfccb"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.65"
                    />

                    {/* RIGHT: APPLE GREEN 20L SLIM CONTAINER WITH FAUCET */}
                    {/* Top Carry Handle */}
                    <path
                        d="M62 18 C62 13.5, 74 13.5, 74 18.5 L74 23"
                        fill="none"
                        stroke="#659000"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                    />
                    {/* Front Chest */}
                    <rect x="46" y="22" width="25" height="61" rx="5" fill={`url(#mixSlimFront_${uid})`} />
                    {/* 3D Side Profile */}
                    <path
                        d="M68 22 L80 25.5 C82.5 26.3, 83.5 28, 83.5 30.5 L83.5 77.5 C83.5 80, 81.8 81.8, 79.2 82 L68 83 Z"
                        fill={`url(#mixSlimSide_${uid})`}
                    />
                    {/* Side X-Rib */}
                    <path
                        d="M71.5 35 L79.5 65 M79.5 35 L71.5 65"
                        stroke="#4d7c0f"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.65"
                    />
                    {/* Blue Screw Cap & White Tamper Seal */}
                    <rect x="53" y="16" width="11" height="4.6" rx="1.6" fill="#0284c7" />
                    <rect x="52.5" y="20.2" width="12" height="2" rx="0.8" fill="#f8fafc" />
                    {/* Property of Seaside Sticker */}
                    <rect x="49.5" y="31" width="18" height="23" rx="2" fill="#ffffff" />
                    <rect x="49.5" y="31" width="18" height="3.8" rx="0.8" fill="#dc2626" />
                    <circle cx="58.5" cy="40.5" r="2.8" fill="#ecfccb" stroke="#8DB600" strokeWidth="0.9" />
                    <rect x="51.5" y="45.5" width="14" height="2.6" rx="0.6" fill="#659000" />
                    <rect x="49.5" y="50.5" width="18" height="3.5" rx="0.8" fill="#facc15" />
                    {/* Recessed Faucet Alcove + White Spout & Red Thumb Paddle */}
                    <rect x="61.5" y="65" width="9" height="12.5" rx="2" fill="#3f5900" />
                    <rect x="64" y="68.5" width="4.8" height="3.2" rx="0.8" fill="#f8fafc" />
                    <rect x="66.2" y="69.5" width="2.8" height="6" rx="0.8" fill="#f8fafc" />
                    <rect x="66.2" y="65.5" width="2.8" height="4.2" rx="0.8" fill="#dc2626" />
                    {/* Left Edge Highlight */}
                    <path
                        d="M48.8 27 L48.8 77"
                        stroke="#ecfccb"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        opacity="0.55"
                    />

                    {/* Tier Pill Badge (₱25 vs ₱30) */}
                    <rect
                        x="33"
                        y="73.5"
                        width="30"
                        height="15"
                        rx="7.5"
                        fill={type === 'refill-30' ? '#0d9488' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth="1.6"
                    />
                    <text
                        x="48"
                        y="83.6"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8.5"
                        fontWeight="900"
                        fontFamily="sans-serif"
                    >
                        {type === 'refill-30' ? '₱30' : '₱25'}
                    </text>
                </svg>
            )}

            {/* 3. CONTAINER (ROUND) — APPLE GREEN 20L ROUND CARBOY WITH "SEASIDE" LABEL */}
            {type === 'round-container' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(101,144,0,0.4)]">
                    <defs>
                        <linearGradient id={`greenRoundShell_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a3d100" />
                            <stop offset="30%" stopColor="#bef264" />
                            <stop offset="68%" stopColor="#8DB600" />
                            <stop offset="100%" stopColor="#4d7c0f" />
                        </linearGradient>
                        <linearGradient id={`greenRoundBody_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8DB600" />
                            <stop offset="100%" stopColor="#3f6212" />
                        </linearGradient>
                    </defs>

                    <ellipse cx="48" cy="88" rx="24" ry="4" fill="rgba(101, 144, 0, 0.34)" />
                    <rect x="41" y="9" width="14" height="6" rx="2" fill="#f8fafc" />
                    <rect x="41" y="13" width="14" height="1.5" fill="#cbd5e1" />
                    <rect x="42.5" y="15" width="11" height="5" fill="#659000" />
                    <rect x="40.5" y="19" width="15" height="3.5" rx="1.5" fill="#4d7c0f" />
                    <path
                        d="M41 22 C33 25, 25 30, 25 37 L25 80 C25 84, 30 86, 48 86 C66 86, 71 84, 71 80 L71 37 C71 30, 63 25, 55 22 Z"
                        fill={`url(#greenRoundShell_${uid})`}
                    />
                    <path
                        d="M26 42 L70 42 L70 79.5 C70 83, 64 84.5, 48 84.5 C32 84.5, 26 83, 26 79.5 Z"
                        fill={`url(#greenRoundBody_${uid})`}
                        opacity="0.45"
                    />
                    <rect x="24" y="43" width="48" height="4" rx="2" fill="#d9f99d" opacity="0.78" />
                    <rect x="24" y="65" width="48" height="4" rx="2" fill="#d9f99d" opacity="0.78" />
                    <rect x="24" y="77" width="48" height="4.5" rx="2" fill="#bef264" opacity="0.82" />
                    <rect x="26.5" y="49.5" width="43" height="13" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="26.5" y="49.5" width="43" height="2.2" rx="1" fill="#0284c7" />
                    <text
                        x="48"
                        y="58.8"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="7.4"
                        fontWeight="900"
                        letterSpacing="0.5"
                        fontFamily="sans-serif"
                    >
                        SEASIDE
                    </text>
                    <path
                        d="M30 33 L30 78"
                        stroke="#ecfccb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.7"
                    />
                </svg>
            )}

            {/* 4. CONTAINER (SLIM) — APPLE GREEN 20L SLIM CONTAINER WITH FAUCET */}
            {type === 'slim' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(101,144,0,0.38)]">
                    <defs>
                        <linearGradient id={`slimFront_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a3d100" />
                            <stop offset="55%" stopColor="#8DB600" />
                            <stop offset="100%" stopColor="#5f7d00" />
                        </linearGradient>
                        <linearGradient id={`slimSide_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#659000" />
                            <stop offset="100%" stopColor="#3f5900" />
                        </linearGradient>
                    </defs>

                    <ellipse cx="49" cy="88" rx="25" ry="4" fill="rgba(101, 144, 0, 0.32)" />
                    <path
                        d="M46 15 C46 10, 61 10, 61 16 L61 21"
                        fill="none"
                        stroke="#659000"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                    />
                    <rect x="24" y="20" width="32" height="65" rx="6" fill={`url(#slimFront_${uid})`} />
                    <path
                        d="M52 20 L66 24 C69 25, 70 27, 70 30 L70 79 C70 82, 68 84, 65 84 L52 85 Z"
                        fill={`url(#slimSide_${uid})`}
                    />
                    <path
                        d="M56 34 L66 68 M66 34 L56 68"
                        stroke="#4d7c0f"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        opacity="0.7"
                    />
                    <rect x="33" y="13" width="14" height="5.5" rx="2" fill="#0284c7" />
                    <rect x="32.5" y="18" width="15" height="2.4" rx="1" fill="#f8fafc" />
                    <rect x="29" y="30" width="22" height="27" rx="2.5" fill="#ffffff" />
                    <rect x="29" y="30" width="22" height="4.5" rx="1" fill="#dc2626" />
                    <circle cx="40" cy="41" r="3.5" fill="#ecfccb" stroke="#8DB600" strokeWidth="1" />
                    <rect x="31.5" y="47" width="17" height="3" rx="0.8" fill="#659000" />
                    <rect x="29" y="53" width="22" height="4" rx="1" fill="#facc15" />
                    <rect x="44" y="67" width="11" height="14" rx="2.5" fill="#3f5900" />
                    <rect x="47" y="71" width="6" height="4" rx="1" fill="#f8fafc" />
                    <rect x="50" y="72" width="3.5" height="7" rx="1" fill="#f8fafc" />
                    <rect x="50" y="67.5" width="3.5" height="5" rx="1" fill="#dc2626" />
                    <path
                        d="M27.5 26 L27.5 79"
                        stroke="#ecfccb"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.55"
                    />
                </svg>
            )}

            {/* 5. PET BOTTLED WATER */}
            {type === 'bottle' && (
                <svg viewBox="0 0 96 96" className="relative z-10 w-full h-full drop-shadow-[0_8px_12px_rgba(2,132,199,0.35)]">
                    <defs>
                        <linearGradient id={`petGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7dd3fc" />
                            <stop offset="35%" stopColor="#e0f2fe" />
                            <stop offset="75%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="48" cy="88" rx="15" ry="3.5" fill="rgba(2, 132, 199, 0.32)" />
                    <rect x="42" y="10" width="12" height="5.5" rx="1.8" fill="#0284c7" />
                    <rect x="41.5" y="16" width="13" height="2" rx="1" fill="#0369a1" />
                    <path
                        d="M43 18 C39 23, 35 28, 35 34 L35 80 C35 84, 38 86, 48 86 C58 86, 61 84, 61 80 L61 34 C61 28, 57 23, 53 18 Z"
                        fill={`url(#petGrad_${uid})`}
                    />
                    <line x1="35.5" y1="36" x2="60.5" y2="36" stroke="#0284c7" strokeWidth="1.2" opacity="0.4" />
                    <line x1="35.5" y1="64" x2="60.5" y2="64" stroke="#0284c7" strokeWidth="1.2" opacity="0.4" />
                    <line x1="35.5" y1="71" x2="60.5" y2="71" stroke="#0284c7" strokeWidth="1.2" opacity="0.4" />
                    <line x1="35.5" y1="78" x2="60.5" y2="78" stroke="#0284c7" strokeWidth="1.2" opacity="0.4" />
                    <rect x="35" y="42" width="26" height="16" fill="#0369a1" />
                    <rect x="35" y="42" width="26" height="2.5" fill="#8DB600" />
                    <rect x="35" y="55.5" width="26" height="2.5" fill="#38bdf8" />
                    <text x="48" y="52" textAnchor="middle" fill="#ffffff" fontSize="5.2" fontWeight="900">
                        SEASIDE
                    </text>
                    <path d="M39.5 29 L39.5 80" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
                </svg>
            )}

            {/* 6. PURIFIED TUBE ICE BAG */}
            {type === 'ice' && (
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
                    <path
                        d="M42 23 C31 28, 25 40, 26 68 C26.5 80, 32 85, 48 85 C64 85, 69.5 80, 70 68 C71 40, 65 28, 54 23 Z"
                        fill={`url(#iceBag_${uid})`}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                    />
                    {[
                        { cx: 38, cy: 44 }, { cx: 48, cy: 41 }, { cx: 57, cy: 45 },
                        { cx: 35, cy: 55 }, { cx: 45, cy: 53 }, { cx: 55, cy: 55 }, { cx: 61, cy: 56 },
                        { cx: 34, cy: 66 }, { cx: 43, cy: 65 }, { cx: 52, cy: 66 }, { cx: 60, cy: 67 },
                        { cx: 38, cy: 76 }, { cx: 48, cy: 76 }, { cx: 58, cy: 76 }
                    ].map((cube, idx) => (
                        <g key={idx}>
                            <circle cx={cube.cx} cy={cube.cy} r="5.2" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1.1" />
                            <circle cx={cube.cx} cy={cube.cy} r="1.8" fill="#7dd3fc" opacity="0.7" />
                        </g>
                    ))}
                    <path d="M32 36 C30 48, 30 62, 32 74" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.65" />
                </svg>
            )}

            {/* 7. FALLBACK 3D PURIFIED WATER DROPLET */}
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