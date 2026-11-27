// src/components/dashboard/DashboardProductTour.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

const DASHBOARD_TOUR_STORAGE_KEY = 'seaside_has_seen_dashboard_tour';

function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) > 0.05 &&
        rect.width > 0 &&
        rect.height > 0
    );
}

function resolveIsDark(storeDarkMode) {
    if (typeof storeDarkMode === 'boolean') return storeDarkMode;
    if (typeof document !== 'undefined') {
        if (document.documentElement.classList.contains('dark')) return true;
        if (document.body?.classList.contains('dark')) return true;
    }
    return false;
}

function hasActiveLoadingUi() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;

    const loadingNodes = document.querySelectorAll(
        '[data-loading="true"], [class*="loading-screen"], [class*="preloader"], div.fixed.inset-0.z-\\[999\\]'
    );
    for (const node of loadingNodes) {
        const rect = node.getBoundingClientRect();
        if (isElementVisible(node) && rect.width > 120 && rect.height > 120) {
            return true;
        }
    }

    const text = document.body?.innerText || '';
    if (text.includes('Loading Shift...') || text.includes('Loading Workspace...')) {
        return true;
    }

    return false;
}

function computeTargetRect(el) {
    if (!el || !isElementVisible(el) || typeof window === 'undefined') return null;

    const rect = el.getBoundingClientRect();
    const pad = 6;
    const clampedTop = Math.max(8, rect.top - pad);
    const clampedLeft = Math.max(8, rect.left - pad);
    const clampedWidth = Math.max(
        0,
        Math.min(window.innerWidth - 8, rect.right + pad) - clampedLeft
    );
    const clampedHeight = Math.max(
        0,
        Math.min(window.innerHeight - 8, rect.bottom + pad) - clampedTop
    );

    if (clampedWidth < 12 || clampedHeight < 12) return null;

    return {
        top: clampedTop,
        left: clampedLeft,
        width: clampedWidth,
        height: clampedHeight
    };
}

export default function DashboardProductTour({
                                                 isDataLoading = false,
                                                 focusSection = 'all',
                                                 onResetFocus
                                             }) {
    const storeDarkMode = useStore((s) => s.darkMode);
    const isDark = resolveIsDark(storeDarkMode);

    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const steps = useMemo(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return [];

        const isMobileView = window.innerWidth < 768;

        // Resolve optional shell topbar & sidebar IDs if present in layout
        const desktopTopbar = document.getElementById('tour-dash-topbar');
        const mobileTopbar = document.getElementById('tour-dash-mobile-topbar');
        const resolvedTopbarId =
            !isMobileView && isElementVisible(desktopTopbar)
                ? 'tour-dash-topbar'
                : isElementVisible(mobileTopbar)
                    ? 'tour-dash-mobile-topbar'
                    : isElementVisible(desktopTopbar)
                        ? 'tour-dash-topbar'
                        : null;

        const sidebarEl = document.getElementById('tour-dash-sidebar');
        const commandBarEl =
            document.getElementById('tour-dash-command-bar') ||
            document.querySelector('[aria-label="Workspace Command Bar"]');

        // Ensure command bar has an ID if queried by aria-label fallback
        if (commandBarEl && !commandBarEl.id) {
            commandBarEl.id = 'tour-dash-command-bar';
        }

        const candidateSteps = [
            {
                id: 'dash-intro',
                targetId: null,
                rawTitle: '📊 Welcome to Seaside Dashboard',
                description:
                    'Explore your redesigned coastal operations center—featuring live Manila shift metrics, focus filters, quick-sale cash drawer updates, payroll deductions, and interactive analytics. Press Esc anytime to exit.',
                side: 'bottom',
                numbered: false
            },
            isElementVisible(commandBarEl) && {
                id: 'dash-command-bar',
                targetId: 'tour-dash-command-bar',
                rawTitle: 'Workspace Command Bar',
                description:
                    'Check live Shift Active status and cash drawer balance, filter between All Metrics, Sales & Charts, or Station Ops, export a CSV summary, or jump straight into a New POS Order.',
                side: 'bottom',
                numbered: true
            },
            {
                id: 'dash-kpis',
                targetId: 'tour-dash-kpis',
                rawTitle: 'Executive Sales & Quick-Sale KPIs',
                description:
                    'Track Today’s Sales (click the tile to log a quick ₱25 walk-in refill and update the cash drawer live), This Month, This Week, and All-Time Lifetime Sales with pace bars and container volume.',
                side: 'bottom',
                numbered: true
            },
            isElementVisible(sidebarEl) && {
                id: 'dash-sidebar',
                targetId: 'tour-dash-sidebar',
                rawTitle: 'Navigation & Station Modules',
                description:
                    'Navigate across POS checkout, Sale History, Customers, Maintenance, Catalog & Inventory, Expenses, Debt Management, and Admin Messages.',
                side: 'bottom',
                numbered: true
            },
            resolvedTopbarId && {
                id: 'dash-topbar',
                targetId: resolvedTopbarId,
                rawTitle: 'Live Clock, Alerts & Profile',
                description:
                    'View your station cash drawer pill, live Philippine Standard Time (Asia/Manila) clock, notifications, role badge, and theme switcher.',
                side: 'bottom',
                numbered: true
            },
            {
                id: 'dash-operations',
                targetId: 'tour-dash-operations',
                rawTitle: 'Filtration, Fleet, Payroll & CRM',
                description:
                    'Monitor sediment/CTO filter and vehicle maintenance countdowns, apply live -₱500 payroll deductions to active employee debts, and review recent customer sign-ups.',
                side: 'top',
                numbered: true
            },
            {
                id: 'dash-analytics',
                targetId: 'tour-dash-analytics',
                rawTitle: 'Interactive Analytics & Top Customers',
                description:
                    'Switch Sales Performance between Monthly, Weekly, and Quarterly views, toggle Revenue vs. Gallons in Period Comparison, tap product donut slices to inspect share, and click Top 10 Customer bars or pills.',
                side: 'top',
                numbered: true
            }
        ].filter(Boolean);

        let num = 0;
        return candidateSteps.map((step) => {
            if (!step.numbered) {
                return { ...step, title: step.rawTitle };
            }
            num += 1;
            return {
                ...step,
                title: `${num}. ${step.rawTitle}`
            };
        });
    }, [isOpen, focusSection]);

    const closeTour = useCallback(() => {
        setIsOpen(false);
        try {
            localStorage.setItem(DASHBOARD_TOUR_STORAGE_KEY, 'true');
        } catch {
            // Ignore storage restrictions
        }
    }, []);

    const openTour = useCallback(() => {
        if (focusSection !== 'all' && typeof onResetFocus === 'function') {
            onResetFocus();
        }
        setStepIndex(0);
        setIsOpen(true);
    }, [focusSection, onResetFocus]);

    // Auto-launch once for first-time visitors when dashboard data is ready
    useEffect(() => {
        if (typeof window === 'undefined' || hasAutoTriggered) return;

        let hasSeen = false;
        try {
            hasSeen = Boolean(localStorage.getItem(DASHBOARD_TOUR_STORAGE_KEY));
        } catch {
            hasSeen = false;
        }

        if (hasSeen) {
            setHasAutoTriggered(true);
            return;
        }

        let pollTimer = null;
        let settleTimer = null;
        let maxWaitTimer = null;
        let cancelled = false;

        const triggerOnce = () => {
            if (cancelled || hasAutoTriggered) return;
            setHasAutoTriggered(true);
            if (pollTimer) clearInterval(pollTimer);
            if (maxWaitTimer) clearTimeout(maxWaitTimer);

            settleTimer = setTimeout(() => {
                if (!cancelled) {
                    if (typeof onResetFocus === 'function') {
                        onResetFocus();
                    }
                    setStepIndex(0);
                    setIsOpen(true);
                }
            }, 300);
        };

        const checkReady = () => {
            if (cancelled || hasAutoTriggered) return;
            const kpisReady = Boolean(document.getElementById('tour-dash-kpis'));
            if (!isDataLoading && !hasActiveLoadingUi() && kpisReady) {
                triggerOnce();
            }
        };

        checkReady();
        pollTimer = setInterval(checkReady, 200);

        maxWaitTimer = setTimeout(() => {
            if (!hasActiveLoadingUi()) {
                triggerOnce();
            }
        }, 6000);

        return () => {
            cancelled = true;
            if (pollTimer) clearInterval(pollTimer);
            if (settleTimer) clearTimeout(settleTimer);
            if (maxWaitTimer) clearTimeout(maxWaitTimer);
        };
    }, [isDataLoading, hasAutoTriggered, onResetFocus]);

    // Ensure focusSection is 'all' while tour is open, scroll each visible target to center, and measure
    useEffect(() => {
        if (!isOpen || typeof window === 'undefined') {
            setTargetRect(null);
            return;
        }

        if (focusSection !== 'all' && typeof onResetFocus === 'function') {
            onResetFocus();
        }

        const safeIdx = Math.min(stepIndex, Math.max(0, steps.length - 1));
        const step = steps[safeIdx];
        if (!step || !step.targetId) {
            setTargetRect(null);
            return;
        }

        let hasScrolled = false;
        let attempts = 0;

        const measureStepTarget = () => {
            const currentEl = document.getElementById(step.targetId);
            if (!currentEl || !isElementVisible(currentEl)) {
                attempts += 1;
                if (attempts < 16) {
                    return false;
                }
                setTargetRect(null);
                return true;
            }

            if (!hasScrolled) {
                hasScrolled = true;
                currentEl.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
            }

            setTargetRect(computeTargetRect(currentEl));
            return true;
        };

        const retryTimer = setInterval(() => {
            if (measureStepTarget()) {
                clearInterval(retryTimer);
            }
        }, 50);

        const t1 = setTimeout(() => {
            const currentEl = document.getElementById(step.targetId);
            if (currentEl && isElementVisible(currentEl)) {
                currentEl.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
            }
            measureStepTarget();
        }, 180);

        const t2 = setTimeout(() => measureStepTarget(), 340);

        const onViewportChange = () => {
            setTargetRect(computeTargetRect(document.getElementById(step.targetId)));
        };

        window.addEventListener('resize', onViewportChange);
        window.addEventListener('scroll', onViewportChange, true);

        return () => {
            clearInterval(retryTimer);
            clearTimeout(t1);
            clearTimeout(t2);
            window.removeEventListener('resize', onViewportChange);
            window.removeEventListener('scroll', onViewportChange, true);
        };
    }, [isOpen, stepIndex, steps, focusSection, onResetFocus]);

    // Keyboard navigation (Escape, Left/Right Arrows)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeTour();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, closeTour, steps.length]);

    if (!mounted || !steps.length) return null;

    const safeIdx = Math.min(stepIndex, steps.length - 1);
    const currentStep = steps[safeIdx] || steps[0];
    const isLastStep = safeIdx === steps.length - 1;

    const getPopoverStyle = () => {
        if (typeof window === 'undefined') return {};
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = Math.min(350, vw - 24);

        if (!targetRect) {
            return {
                top: '50%',
                left: '50%',
                width: `${width}px`,
                transform: 'translate(-50%, -50%)'
            };
        }

        const estHeight = 215;
        const gap = 12;
        const clampedLeft = Math.min(
            Math.max(12, targetRect.left + targetRect.width / 2 - width / 2),
            vw - width - 12
        );

        const belowTop = targetRect.top + targetRect.height + gap;
        const aboveTop = targetRect.top - estHeight - gap;

        if (currentStep?.side === 'top' && aboveTop >= 12) {
            return { top: `${aboveTop}px`, left: `${clampedLeft}px`, width: `${width}px` };
        }
        if (belowTop + estHeight <= vh - 12) {
            return { top: `${belowTop}px`, left: `${clampedLeft}px`, width: `${width}px` };
        }
        if (aboveTop >= 12) {
            return { top: `${aboveTop}px`, left: `${clampedLeft}px`, width: `${width}px` };
        }

        return {
            top: `${Math.min(Math.max(12, vh / 2 - estHeight / 2), vh - estHeight - 12)}px`,
            left: `${clampedLeft}px`,
            width: `${width}px`
        };
    };

    const popoverStyle = {
        ...getPopoverStyle(),
        background: isDark
            ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 16, 28, 0.99) 100%)'
            : 'linear-gradient(155deg, #ffffff 0%, #f0fdf8 100%)',
        color: isDark ? '#f1f5f9' : '#0f172a',
        border: isDark
            ? '1.5px solid rgba(16, 185, 129, 0.5)'
            : '1.5px solid rgba(2, 132, 199, 0.35)',
        boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 28px rgba(16, 185, 129, 0.22)'
            : '0 22px 45px -12px rgba(2, 132, 199, 0.22)'
    };

    return createPortal(
        <>
            {!isOpen && (
                <button
                    type="button"
                    onClick={openTour}
                    title="Replay Dashboard Guide"
                    aria-label="Replay Dashboard Guide"
                    className={`fixed bottom-28 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                        isDark
                            ? 'bg-[#0f172a]/90 hover:bg-[#162238] border-emerald-400/35 text-slate-200 shadow-black/50'
                            : 'bg-white/95 hover:bg-emerald-50 border-sky-500/30 text-slate-700 shadow-sky-900/10'
                    }`}
                >
                    <HelpCircle
                        className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-sky-600'}`}
                    />
                    <span className="hidden sm:inline">Dashboard Guide</span>
                </button>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-[10000] pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-label={currentStep.title}
                >
                    <div
                        onClick={closeTour}
                        className="fixed inset-0"
                        style={{
                            background: isDark ? 'rgba(2, 6, 23, 0.72)' : 'rgba(15, 23, 42, 0.48)'
                        }}
                    />

                    {targetRect && (
                        <div
                            className="fixed rounded-2xl pointer-events-none transition-all duration-200"
                            style={{
                                top: `${targetRect.top}px`,
                                left: `${targetRect.left}px`,
                                width: `${targetRect.width}px`,
                                height: `${targetRect.height}px`,
                                border: isDark ? '2px solid #10b981' : '2px solid #0284c7',
                                boxShadow: isDark
                                    ? '0 0 0 9999px rgba(2, 6, 23, 0.72), 0 0 24px rgba(16, 185, 129, 0.45)'
                                    : '0 0 0 9999px rgba(15, 23, 42, 0.48), 0 0 22px rgba(2, 132, 199, 0.35)'
                            }}
                        />
                    )}

                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={popoverStyle}
                        className="fixed z-[10002] rounded-[22px] p-4 sm:p-5 backdrop-blur-xl transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3
                                className="text-[15px] sm:text-base font-extrabold tracking-tight leading-snug"
                                style={{ color: isDark ? '#ffffff' : '#0f172a' }}
                            >
                                {currentStep.title}
                            </h3>
                            <button
                                type="button"
                                onClick={closeTour}
                                aria-label="Close guide"
                                className="p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p
                            className="text-xs sm:text-[13px] leading-relaxed mt-1.5"
                            style={{ color: isDark ? '#cbd5e1' : '#475569' }}
                        >
                            {currentStep.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-2">
                            <span
                                className="text-[11px] font-bold"
                                style={{ color: isDark ? '#34d399' : '#0284c7' }}
                            >
                                {safeIdx + 1} of {steps.length}
                            </span>

                            <div className="flex items-center gap-1.5">
                                {safeIdx > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                                        className="px-2.5 py-1.5 rounded-[10px] text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                        style={{
                                            background: isDark
                                                ? 'rgba(148, 163, 184, 0.16)'
                                                : 'rgba(15, 23, 42, 0.06)',
                                            border: isDark
                                                ? '1px solid rgba(148, 163, 184, 0.25)'
                                                : '1px solid rgba(15, 23, 42, 0.14)',
                                            color: isDark ? '#e2e8f0' : '#334155'
                                        }}
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span>Back</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isLastStep) {
                                            closeTour();
                                        } else {
                                            setStepIndex((i) => Math.min(steps.length - 1, i + 1));
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-[10px] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all hover:brightness-105 text-white"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, #059669 0%, #0284c7 100%)',
                                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                                    }}
                                >
                                    <span>{isLastStep ? 'Got It' : 'Next →'}</span>
                                    {!isLastStep && <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}