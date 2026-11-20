// src/components/TabBar.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import {
    CartIcon,
    ChartIcon,
    DocumentReportIcon
} from './Icons';
import { Receipt, History, Menu } from 'lucide-react';

const PREV_TAB_STORAGE_KEY = 'seaside_mobile_tab_prev_idx';

export default function TabBar() {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const darkMode = useStore((state) => state.darkMode);
    const [mounted, setMounted] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (
            user.id === 1 ||
            user.isAdmin ||
            user.isadmin ||
            user.is_admin ||
            user.isSuperAdmin ||
            user.role_id === 1 ||
            user.roleId === 1
        ) {
            return true;
        }
        const role = String(
            user.role?.name || user.role || user.position || user.user_type || user.type || ''
        )
            .toLowerCase()
            .trim();
        return ['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some((k) =>
            role.includes(k)
        );
    }, [user]);

    const isDemo = Boolean(user?.isDemo);

    const tabs = useMemo(() => {
        return [
            {
                id: 'pos',
                name: 'POS',
                path: '/pos',
                icon: CartIcon
            },
            {
                id: 'dashboard',
                name: 'Dashboard',
                path: '/dashboard',
                icon: ChartIcon
            },
            {
                id: 'expenses',
                name: 'Expenses',
                path: '/expenses',
                icon: Receipt
            },
            {
                id: 'report-or-history',
                name: isAdmin || isDemo ? 'Report' : 'History',
                path: isAdmin || isDemo ? '/report' : '/history',
                icon: isAdmin || isDemo ? DocumentReportIcon : History
            },
            {
                id: 'more',
                name: 'More',
                path: null,
                icon: Menu
            }
        ];
    }, [isAdmin, isDemo]);

    // Sync with Navbar mobile slide-over drawer state and Next.js route events
    useEffect(() => {
        const handleDrawerState = (e) => {
            setDrawerOpen(Boolean(e?.detail?.open));
        };
        const handleRouteDone = () => {
            setPendingPath(null);
            setDrawerOpen(false);
        };

        window.addEventListener('mobile-drawer-state', handleDrawerState);
        router.events?.on('routeChangeComplete', handleRouteDone);
        router.events?.on('routeChangeError', handleRouteDone);

        return () => {
            window.removeEventListener('mobile-drawer-state', handleDrawerState);
            router.events?.off('routeChangeComplete', handleRouteDone);
            router.events?.off('routeChangeError', handleRouteDone);
        };
    }, [router.events]);

    // Active tab index (0..4); secondary pages highlight "More" (index 4)
    const activeIndex = useMemo(() => {
        if (drawerOpen) return 4;
        const currentPath = (pendingPath || router.pathname || '').toLowerCase();
        const foundIdx = tabs.findIndex(
            (tab) => tab.path && currentPath === tab.path.toLowerCase()
        );
        return foundIdx !== -1 ? foundIdx : 4;
    }, [drawerOpen, pendingPath, router.pathname, tabs]);

    // 3D Rolling Glass Sphere physics refs
    const sphereWrapRef = useRef(null);
    const rollingEmblemRef = useRef(null);
    const spotlightRef = useRef(null);

    const animStateRef = useRef({
        startPct: ((activeIndex + 0.5) / 5) * 100,
        curPct: ((activeIndex + 0.5) / 5) * 100,
        targetPct: ((activeIndex + 0.5) / 5) * 100,
        startAngleDeg: 0,
        curAngleDeg: 0,
        targetAngleDeg: 0,
        initialized: false
    });

    useEffect(() => {
        if (!mounted) return;
        const nextTargetPct = ((activeIndex + 0.5) / 5) * 100;
        const state = animStateRef.current;

        if (!state.initialized) {
            let startPct = nextTargetPct;
            try {
                const savedPrev = sessionStorage.getItem(PREV_TAB_STORAGE_KEY);
                if (savedPrev !== null) {
                    const prevIdx = Number(savedPrev);
                    if (!Number.isNaN(prevIdx) && prevIdx >= 0 && prevIdx <= 4) {
                        startPct = ((prevIdx + 0.5) / 5) * 100;
                    }
                    sessionStorage.removeItem(PREV_TAB_STORAGE_KEY);
                }
            } catch {
                // Ignore storage errors
            }

            const deltaTabs = (nextTargetPct - startPct) / 20;
            const endAngle = Math.round(deltaTabs) * 360;

            state.startPct = startPct;
            state.curPct = startPct;
            state.targetPct = nextTargetPct;
            state.startAngleDeg = 0;
            state.curAngleDeg = 0;
            state.targetAngleDeg = endAngle;
            state.initialized = true;
        } else if (Math.abs(nextTargetPct - state.targetPct) > 0.01) {
            const deltaTabs = (nextTargetPct - state.curPct) / 20;
            const snappedEndAngle =
                Math.round((state.curAngleDeg + deltaTabs * 360) / 360) * 360;

            state.startPct = state.curPct;
            state.targetPct = nextTargetPct;
            state.startAngleDeg = state.curAngleDeg;
            state.targetAngleDeg = snappedEndAngle;
        }
    }, [activeIndex, mounted]);

    useEffect(() => {
        if (!mounted) return;
        let rafId;
        const LERP = 0.115; // Deliberate, noticeable roll speed

        const tick = () => {
            const state = animStateRef.current;
            const diff = state.targetPct - state.curPct;
            const totalSpan = state.targetPct - state.startPct;

            if (Math.abs(diff) > 0.03) {
                state.curPct += diff * LERP;
                const progress =
                    Math.abs(totalSpan) > 0.01
                        ? (state.curPct - state.startPct) / totalSpan
                        : 1;
                state.curAngleDeg =
                    state.startAngleDeg +
                    (state.targetAngleDeg - state.startAngleDeg) * progress;
            } else {
                state.curPct = state.targetPct;
                state.curAngleDeg = state.targetAngleDeg;
            }

            // Subtle momentum squash/stretch while rolling
            const stretch = 1 + Math.min(0.14, Math.abs(diff) * 0.005);

            if (sphereWrapRef.current) {
                sphereWrapRef.current.style.left = `${state.curPct}%`;
                sphereWrapRef.current.style.transform = `translate(-50%, -50%) scaleX(${stretch.toFixed(3)})`;
            }
            if (rollingEmblemRef.current) {
                rollingEmblemRef.current.style.transform = `rotate(${state.curAngleDeg.toFixed(1)}deg)`;
            }
            if (spotlightRef.current) {
                spotlightRef.current.style.left = `${state.curPct}%`;
            }

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [mounted]);

    const handleOpenMore = () => {
        setDrawerOpen(true);
        const hamburgerBtn = document.querySelector('[aria-label="Open Navigation Drawer"]');
        if (hamburgerBtn) {
            hamburgerBtn.click();
        } else {
            window.dispatchEvent(new CustomEvent('open-mobile-drawer'));
        }
    };

    const handleTabNavigate = (tab) => {
        if (tab.id === 'more') {
            handleOpenMore();
            return;
        }

        setDrawerOpen(false);
        if (!tab.path || router.pathname === tab.path) return;

        try {
            sessionStorage.setItem(PREV_TAB_STORAGE_KEY, String(activeIndex));
        } catch {
            // Ignore storage errors
        }

        setPendingPath(tab.path);
        router.push(tab.path);
    };

    if (!mounted) return null;

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2.5 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pointer-events-none select-none"
            aria-label="Mobile Bottom Navigation"
        >
            <div
                className="pointer-events-auto relative mx-auto max-w-md rounded-[26px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/95 px-2.5 pt-2 pb-3.5 overflow-hidden transition-colors duration-200"
                style={{
                    boxShadow: darkMode
                        ? '0 14px 34px -6px rgba(0, 0, 0, 0.78), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                        : '0 12px 28px -6px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
                }}
            >
                {/* Ambient radial spotlight cone traveling above the rolling 3D sphere */}
                <div
                    ref={spotlightRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-1 w-28 h-16 -translate-x-1/2 transition-opacity duration-200"
                    style={{
                        left: `${((activeIndex + 0.5) / 5) * 100}%`,
                        background: darkMode
                            ? 'radial-gradient(ellipse at 50% 95%, rgba(163, 230, 53, 0.28) 0%, rgba(141, 182, 0, 0.09) 48%, transparent 75%)'
                            : 'radial-gradient(ellipse at 50% 95%, rgba(141, 182, 0, 0.24) 0%, rgba(141, 182, 0, 0.07) 48%, transparent 75%)'
                    }}
                />

                {/* 5 Navigation Columns */}
                <div className="relative z-10 grid grid-cols-5 items-center">
                    {tabs.map((item, idx) => {
                        const isActive = idx === activeIndex;
                        const IconComponent = item.icon;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleTabNavigate(item)}
                                aria-current={isActive ? 'page' : undefined}
                                aria-label={item.id === 'more' ? 'More Navigation Options' : item.name}
                                className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 group select-none cursor-pointer active:scale-95 outline-none"
                            >
                                <div
                                    className={`relative flex items-center justify-center transition-all duration-200 ${
                                        isActive
                                            ? '-translate-y-0.5 text-[#5f7d00] dark:text-lime-400'
                                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                                    }`}
                                >
                                    <IconComponent
                                        className={`w-[19px] h-[19px] transition-all duration-200 ${
                                            isActive ? 'stroke-[2.4]' : 'stroke-[1.85]'
                                        }`}
                                    />
                                </div>
                                <span
                                    className={`mt-1 text-[10px] leading-none tracking-tight text-center truncate max-w-full transition-colors duration-200 ${
                                        isActive
                                            ? 'font-extrabold text-slate-900 dark:text-white'
                                            : 'font-semibold text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Recessed Machined Track & Rolling 3D Glass Sphere */}
                <div className="relative z-10 mt-2.5 px-2">
                    <div
                        className="relative w-full h-[8px] rounded-full bg-slate-200/95 dark:bg-slate-950/95 border border-slate-300/70 dark:border-white/[0.08]"
                        style={{
                            boxShadow: darkMode
                                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(255, 255, 255, 0.07)'
                                : 'inset 0 1.5px 3.5px rgba(15, 23, 42, 0.2), 0 1px 0 rgba(255, 255, 255, 0.95)'
                        }}
                    >
                        {/* 3D Glass Sphere Wrapper (Translates laterally along the track) */}
                        <div
                            ref={sphereWrapRef}
                            aria-hidden="true"
                            className="absolute top-1/2 w-[30px] h-[30px] rounded-full pointer-events-none z-20"
                            style={{
                                left: `${((activeIndex + 0.5) / 5) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                boxShadow: darkMode
                                    ? '0 5px 12px rgba(0, 0, 0, 0.9), 0 0 14px rgba(141, 182, 0, 0.45)'
                                    : '0 4px 10px rgba(15, 23, 42, 0.32), 0 0 12px rgba(141, 182, 0, 0.35)'
                            }}
                        >
                            {/* 1. Spherical Core + Visibly Rolling Seaside Emblem (Lands Upright at 360° Multiples) */}
                            <div
                                className="absolute inset-0 w-full h-full rounded-full overflow-hidden flex items-center justify-center border border-white/60 dark:border-lime-400/45"
                                style={{
                                    background: darkMode
                                        ? 'radial-gradient(circle at 35% 28%, #1e293b 0%, #0f172a 65%, #020617 100%)'
                                        : 'radial-gradient(circle at 35% 28%, #ffffff 0%, #f7fee7 62%, #d9f99d 100%)'
                                }}
                            >
                                <div
                                    ref={rollingEmblemRef}
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ transform: 'rotate(0deg)' }}
                                >
                                    <img
                                        src="/seaside.png"
                                        alt="Seaside Emblem"
                                        className="w-[22px] h-[22px] object-contain select-none drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.35)]"
                                    />
                                </div>
                            </div>

                            {/* 2. Stationary 3D Glass Dome Specular Highlight & Rim Shading */}
                            <div
                                className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
                                style={{
                                    boxShadow: darkMode
                                        ? 'inset 0 2px 3.5px rgba(255, 255, 255, 0.55), inset 0 -3.5px 6px rgba(0, 0, 0, 0.9), inset 0 0 5px rgba(163, 230, 53, 0.35)'
                                        : 'inset 0 2px 4px rgba(255, 255, 255, 0.98), inset 0 -3.5px 6px rgba(15, 23, 42, 0.38), inset 0 0 4px rgba(95, 125, 0, 0.28)',
                                    background:
                                        'radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.14) 28%, transparent 55%)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}