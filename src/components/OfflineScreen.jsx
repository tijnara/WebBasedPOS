// src/components/OfflineScreen.jsx
import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, RefreshCw, Droplets } from 'lucide-react';

export default function OfflineScreen({ onRetry, isChecking = false }) {
    const stageRef = useRef(null);
    const dropletRef = useRef(null);
    const pupilsRef = useRef(null);
    const [rippleKey, setRippleKey] = useState(0);
    const [statusHint, setStatusHint] = useState(
        'Check your Wi-Fi or mobile data. Seaside WRS will reconnect and sync automatically.'
    );

    // Interactive cursor & touch tracking for the Seaside water droplet character
    useEffect(() => {
        let rafId = null;
        const target = { x: 0, y: 0, px: 0, py: 0 };
        const current = { x: 0, y: 0, px: 0, py: 0 };

        const updateTargetFromPoint = (clientX, clientY) => {
            if (!stageRef.current) return;
            const rect = stageRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const normX = Math.max(-1, Math.min(1, (clientX - centerX) / (rect.width * 0.65)));
            const normY = Math.max(-1, Math.min(1, (clientY - centerY) / (rect.height * 0.65)));

            target.x = normX * 22;
            target.y = normY * 14;
            target.px = normX * 4.5;
            target.py = normY * 3.5;
        };

        const onMouseMove = (e) => updateTargetFromPoint(e.clientX, e.clientY);
        const onTouchMove = (e) => {
            if (e.touches?.[0]) {
                updateTargetFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            }
        };
        const onTouchStart = (e) => {
            if (e.touches?.[0]) {
                updateTargetFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                setRippleKey((k) => k + 1);
            }
        };

        const animate = () => {
            current.x += (target.x - current.x) * 0.12;
            current.y += (target.y - current.y) * 0.12;
            current.px += (target.px - current.px) * 0.18;
            current.py += (target.py - current.py) * 0.18;

            const tiltDeg = current.x * 0.45;

            if (dropletRef.current) {
                dropletRef.current.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) rotate(${tiltDeg.toFixed(2)}deg)`;
            }
            if (pupilsRef.current) {
                pupilsRef.current.style.transform = `translate3d(${current.px.toFixed(2)}px, ${current.py.toFixed(2)}px, 0)`;
            }

            rafId = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        rafId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchstart', onTouchStart);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    const handleManualRetry = async () => {
        setRippleKey((k) => k + 1);
        setStatusHint('Checking connection to Seaside server...');
        const connected = await onRetry?.();
        if (!connected) {
            setStatusHint('Still offline. Please turn on Wi-Fi or mobile data and try again.');
        }
    };

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-label="No Internet Connection"
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-100/95 dark:bg-[#070d19]/95 backdrop-blur-md transition-colors select-none"
        >
            <style jsx>{`
                @keyframes seasideFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-7px); }
                }
                @keyframes seasideWave {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes seasideRipple {
                    0% { transform: scale(0.4); opacity: 0.75; }
                    100% { transform: scale(2.3); opacity: 0; }
                }
                .seaside-float {
                    animation: seasideFloat 3.4s ease-in-out infinite;
                }
                .seaside-wave-track {
                    animation: seasideWave 7s linear infinite;
                }
                .seaside-ripple {
                    animation: seasideRipple 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-center relative overflow-hidden">
                {/* Top Brand Pill */}
                <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                        <img src="/seaside.png" alt="Seaside WRS" className="w-4 h-4 object-contain" />
                        <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">
                            Seaside WRS
                        </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                        <WifiOff className="w-3 h-3" />
                        <span>Offline</span>
                    </span>
                </div>

                {/* Interactive Cursor / Touch-Following Water Stage */}
                <div
                    ref={stageRef}
                    onClick={() => setRippleKey((k) => k + 1)}
                    className="relative w-full h-48 sm:h-52 rounded-2xl bg-gradient-to-b from-sky-100/80 via-cyan-50/70 to-lime-50/60 dark:from-slate-800/90 dark:via-sky-950/40 dark:to-slate-900 border border-sky-200/70 dark:border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer"
                >
                    {/* Subtle Signal Pulse Rings */}
                    <div className="absolute w-36 h-36 rounded-full border border-sky-300/40 dark:border-sky-500/20 pointer-events-none" />
                    <div className="absolute w-52 h-52 rounded-full border border-lime-400/30 dark:border-lime-500/15 pointer-events-none" />

                    {/* Tap / Click Water Ripple */}
                    {rippleKey > 0 && (
                        <span
                            key={rippleKey}
                            className="seaside-ripple absolute w-24 h-24 rounded-full border-2 border-[#8DB600] dark:border-lime-400 pointer-events-none"
                        />
                    )}

                    {/* Floating + Cursor-Following Water Droplet Mascot */}
                    <div className="seaside-float relative z-10">
                        <div
                            ref={dropletRef}
                            className="will-change-transform flex flex-col items-center"
                        >
                            <svg
                                className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-[0_10px_18px_rgba(14,165,233,0.28)]"
                                viewBox="0 0 120 120"
                                fill="none"
                            >
                                <defs>
                                    <linearGradient id="seasideDropGrad" x1="25" y1="15" x2="95" y2="108" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#7dd3fc" />
                                        <stop offset="52%" stopColor="#0ea5e9" />
                                        <stop offset="100%" stopColor="#0369a1" />
                                    </linearGradient>
                                    <radialGradient id="seasideDropGlow" cx="38%" cy="30%" r="55%">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                    </radialGradient>
                                </defs>

                                {/* Droplet Body */}
                                <path
                                    d="M60 12C60 12 24 53 24 77C24 96.8823 40.1177 113 60 113C79.8823 113 96 96.8823 96 77C96 53 60 12 60 12Z"
                                    fill="url(#seasideDropGrad)"
                                />
                                <path
                                    d="M60 12C60 12 24 53 24 77C24 96.8823 40.1177 113 60 113C79.8823 113 96 96.8823 96 77C96 53 60 12 60 12Z"
                                    fill="url(#seasideDropGlow)"
                                />

                                {/* Glossy Highlight */}
                                <ellipse
                                    cx="42"
                                    cy="56"
                                    rx="5.5"
                                    ry="12"
                                    transform="rotate(-22 42 56)"
                                    fill="white"
                                    fillOpacity="0.55"
                                />

                                {/* Eye Whites */}
                                <circle cx="48" cy="74" r="8.5" fill="white" />
                                <circle cx="72" cy="74" r="8.5" fill="white" />

                                {/* Cursor-Following Pupils */}
                                <g ref={pupilsRef}>
                                    <circle cx="48" cy="74" r="4.2" fill="#0f172a" />
                                    <circle cx="46.5" cy="72.5" r="1.4" fill="white" />
                                    <circle cx="72" cy="74" r="4.2" fill="#0f172a" />
                                    <circle cx="70.5" cy="72.5" r="1.4" fill="white" />
                                </g>

                                {/* Gentle Curious Mouth */}
                                <path
                                    d="M54 89C56.5 86.8 63.5 86.8 66 89"
                                    stroke="#e0f2fe"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />

                                {/* Small Seaside Leaf Sprout on Top */}
                                <path
                                    d="M60 13C64 6 72 5 76 9C71 13 65 14 60 13Z"
                                    fill="#8DB600"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Animated Bottom Water Wave */}
                    <div className="absolute bottom-0 left-0 right-0 h-9 overflow-hidden pointer-events-none opacity-80">
                        <svg
                            className="seaside-wave-track w-[200%] h-full"
                            viewBox="0 0 800 40"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M0 18 Q 100 4, 200 18 T 400 18 T 600 18 T 800 18 L 800 40 L 0 40 Z"
                                className="fill-sky-400/30 dark:fill-sky-500/25"
                            />
                            <path
                                d="M0 24 Q 100 36, 200 24 T 400 24 T 600 24 T 800 24 L 800 40 L 0 40 Z"
                                className="fill-[#8DB600]/25 dark:fill-lime-500/20"
                            />
                        </svg>
                    </div>

                    <span className="absolute top-2.5 right-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        Move or tap water
                    </span>
                </div>

                {/* Message & Station Context */}
                <div className="space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        No Internet Connection
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                        {statusHint}
                    </p>
                </div>

                {/* Retry Action */}
                <div className="pt-1 space-y-2.5">
                    <button
                        type="button"
                        onClick={handleManualRetry}
                        disabled={isChecking}
                        className="w-full h-11 px-5 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs sm:text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                        <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                        <span>{isChecking ? 'Checking Connection...' : 'Retry Connection'}</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <Droplets className="w-3.5 h-3.5 text-[#8DB600] dark:text-lime-400" />
                        <span>Auto-syncs sales, inventory &amp; reports once online</span>
                    </div>
                </div>
            </div>
        </div>
    );
}