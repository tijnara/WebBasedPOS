// src/components/customers/CustomerManagementTour.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useStore } from '../../store/useStore';

const CUSTOMER_TOUR_STORAGE_KEY = 'seaside_has_seen_customer_management_tour';

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
    if (
        text.includes('Loading Workspace...') ||
        text.includes('Loading Shift...') ||
        text.includes('Loading customer records...') ||
        text.includes('Loading customer accounts...')
    ) {
        return true;
    }

    return false;
}

export default function CustomerManagementTour({ isCustomersLoading = false }) {
    const storeDarkMode = useStore((s) => s.darkMode);
    const isDark = resolveIsDark(storeDarkMode);

    const driverInstanceRef = useRef(null);
    const hasAutoTriggeredRef = useRef(false);
    const isDarkRef = useRef(isDark);

    useEffect(() => {
        isDarkRef.current = isDark;
    }, [isDark]);

    const applyPopoverThemeClass = useCallback((dark) => {
        if (typeof document === 'undefined') return;
        const popovers = document.querySelectorAll('.driver-popover.seaside-customer-tour');
        popovers.forEach((el) => {
            el.classList.toggle('dark-tour', Boolean(dark));
            el.classList.toggle('light-tour', !dark);
        });
    }, []);

    const launchTour = useCallback(() => {
        if (typeof window === 'undefined') return;

        if (driverInstanceRef.current) {
            try {
                driverInstanceRef.current.destroy();
            } catch {
                // Ignore if already destroyed
            }
            driverInstanceRef.current = null;
        }

        const currentDark = resolveIsDark(isDarkRef.current);
        const isDesktop = window.innerWidth >= 768;
        const directorySelector =
            isDesktop && isElementVisible(document.getElementById('tour-customer-desktop-table'))
                ? '#tour-customer-desktop-table'
                : '#tour-customer-mobile-list';

        const steps = [
            {
                popover: {
                    title: '👥 Customer Management Guide',
                    description:
                        'Manage customer profiles, delivery landmarks, last order dates, and utang balances—press Esc anytime to exit.',
                    align: 'center'
                }
            },
            {
                element: '#tour-customer-actions',
                popover: {
                    title: '1. Inactive Report & Add Customer',
                    description:
                        'Open the Inactive Report to spot dormant accounts, or click "Add Customer" to register a new customer or merge into an existing profile.',
                    side: 'bottom',
                    align: 'end'
                }
            },
            {
                element: '#tour-customer-kpis',
                popover: {
                    title: '2. Customer & Utang Overview',
                    description:
                        'Track total registered customers, total outstanding utang, how many accounts have balances, and clean accounts.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '#tour-customer-filters',
                popover: {
                    title: '3. Search & Balance Filters',
                    description:
                        'Press / to search by name, phone, or address, and filter between All, With Utang, or Zero Balance accounts.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: directorySelector,
                popover: {
                    title: '4. Customer Directory & Quick Actions',
                    description:
                        'Sort columns (or use the mobile sort picker), collect utang repayments, ring up orders in POS, or edit/delete customer records.',
                    side: 'top',
                    align: 'center'
                }
            }
        ];

        const tourObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayOpacity: currentDark ? 0.74 : 0.52,
            stagePadding: 8,
            stageRadius: 18,
            popoverClass: currentDark
                ? 'seaside-driver-popover seaside-customer-tour dark-tour'
                : 'seaside-driver-popover seaside-customer-tour light-tour',
            progressText: '{{current}} of {{total}}',
            nextBtnText: 'Next →',
            prevBtnText: '← Back',
            doneBtnText: 'Got It',
            onPopoverRender: () => {
                requestAnimationFrame(() => applyPopoverThemeClass(resolveIsDark(isDarkRef.current)));
            },
            onHighlightStarted: (element) => {
                if (element && window.innerWidth < 768) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                requestAnimationFrame(() => applyPopoverThemeClass(resolveIsDark(isDarkRef.current)));
            },
            onDestroyed: () => {
                driverInstanceRef.current = null;
                try {
                    localStorage.setItem(CUSTOMER_TOUR_STORAGE_KEY, 'true');
                } catch {
                    // Ignore storage restrictions
                }
            },
            steps
        });

        driverInstanceRef.current = tourObj;
        tourObj.drive();
        requestAnimationFrame(() => applyPopoverThemeClass(currentDark));
    }, [applyPopoverThemeClass]);

    useEffect(() => {
        applyPopoverThemeClass(isDark);
    }, [isDark, applyPopoverThemeClass]);

    useEffect(() => {
        if (typeof window === 'undefined' || hasAutoTriggeredRef.current || driverInstanceRef.current) {
            return;
        }

        let hasSeen = false;
        try {
            hasSeen = Boolean(localStorage.getItem(CUSTOMER_TOUR_STORAGE_KEY));
        } catch {
            hasSeen = false;
        }

        if (hasSeen) return;

        let pollTimer = null;
        let settleTimer = null;
        let maxWaitTimer = null;
        let cancelled = false;

        const triggerOnce = () => {
            if (cancelled || hasAutoTriggeredRef.current || driverInstanceRef.current) return;
            hasAutoTriggeredRef.current = true;
            if (pollTimer) clearInterval(pollTimer);
            if (maxWaitTimer) clearTimeout(maxWaitTimer);

            settleTimer = setTimeout(() => {
                if (!cancelled && !driverInstanceRef.current) {
                    launchTour();
                }
            }, 300);
        };

        const checkReady = () => {
            if (cancelled || hasAutoTriggeredRef.current || driverInstanceRef.current) return;
            const kpisReady = Boolean(document.getElementById('tour-customer-kpis'));
            if (!isCustomersLoading && !hasActiveLoadingUi() && kpisReady) {
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
    }, [isCustomersLoading, launchTour]);

    useEffect(() => {
        return () => {
            if (driverInstanceRef.current) {
                try {
                    driverInstanceRef.current.destroy();
                } catch {
                    // Ignore
                }
                driverInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <>
            <style jsx global>{`
                .driver-popover.seaside-driver-popover {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    border-radius: 22px;
                    padding: 18px 20px;
                    max-width: min(340px, calc(100vw - 24px));
                    backdrop-filter: blur(18px);
                }

                html.dark .driver-popover.seaside-customer-tour,
                .driver-popover.seaside-customer-tour.dark-tour {
                    background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 16, 28, 0.99) 100%) !important;
                    color: #f1f5f9 !important;
                    border: 1.5px solid rgba(163, 230, 53, 0.45) !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.88), 0 0 28px rgba(132, 204, 22, 0.2) !important;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-title,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #ffffff !important;
                    letter-spacing: -0.01em;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-description,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-description {
                    font-size: 13px;
                    line-height: 1.55;
                    color: #cbd5e1 !important;
                    margin-top: 6px;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-progress-text,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-progress-text {
                    font-size: 11px;
                    font-weight: 700;
                    color: #a3e635 !important;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-close-btn,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-close-btn {
                    color: #94a3b8 !important;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-close-btn:hover,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-close-btn:hover {
                    color: #ffffff !important;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-arrow-side-left.driver-popover-arrow,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-arrow-side-left.driver-popover-arrow {
                    border-left-color: rgba(15, 23, 42, 0.98) !important;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-arrow-side-right.driver-popover-arrow,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-arrow-side-right.driver-popover-arrow {
                    border-right-color: rgba(15, 23, 42, 0.98) !important;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-arrow-side-top.driver-popover-arrow,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-arrow-side-top.driver-popover-arrow {
                    border-top-color: rgba(15, 23, 42, 0.98) !important;
                }
                html.dark .driver-popover.seaside-customer-tour .driver-popover-arrow-side-bottom.driver-popover-arrow,
                .driver-popover.seaside-customer-tour.dark-tour .driver-popover-arrow-side-bottom.driver-popover-arrow {
                    border-bottom-color: rgba(15, 23, 42, 0.98) !important;
                }

                html:not(.dark) .driver-popover.seaside-customer-tour.light-tour {
                    background: linear-gradient(155deg, #ffffff 0%, #f0fdf8 100%) !important;
                    color: #0f172a !important;
                    border: 1.5px solid rgba(16, 185, 129, 0.35) !important;
                    box-shadow: 0 22px 45px -12px rgba(15, 23, 42, 0.25) !important;
                }
                html:not(.dark) .driver-popover.seaside-customer-tour.light-tour .driver-popover-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a !important;
                }
                html:not(.dark) .driver-popover.seaside-customer-tour.light-tour .driver-popover-description {
                    font-size: 13px;
                    line-height: 1.55;
                    color: #475569 !important;
                    margin-top: 6px;
                }
                html:not(.dark) .driver-popover.seaside-customer-tour.light-tour .driver-popover-progress-text {
                    font-size: 11px;
                    font-weight: 800;
                    color: #059669 !important;
                }

                .driver-popover.seaside-driver-popover .driver-popover-footer {
                    margin-top: 14px;
                }
                .driver-popover.seaside-driver-popover .driver-popover-prev-btn {
                    border-radius: 10px;
                    padding: 6px 11px;
                    font-size: 12px;
                    font-weight: 700;
                    text-shadow: none;
                    background: rgba(148, 163, 184, 0.14);
                    border: 1px solid rgba(148, 163, 184, 0.25);
                    color: inherit;
                }
                .driver-popover.seaside-driver-popover .driver-popover-next-btn {
                    border-radius: 10px;
                    padding: 6px 13px;
                    font-size: 12px;
                    font-weight: 800;
                    text-shadow: none;
                    background: linear-gradient(90deg, #84cc16 0%, #10b981 100%);
                    border: none;
                    color: #052e16;
                    box-shadow: 0 4px 12px rgba(132, 204, 22, 0.35);
                }
                .driver-popover.seaside-driver-popover .driver-popover-next-btn:hover {
                    filter: brightness(1.06);
                }
            `}</style>

            <button
                type="button"
                onClick={launchTour}
                title="Replay Customer Guide"
                aria-label="Replay Customer Guide"
                className={`fixed bottom-28 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                    isDark
                        ? 'bg-[#0f172a]/90 hover:bg-[#162238] border-lime-400/35 text-slate-200 shadow-black/50'
                        : 'bg-white/95 hover:bg-emerald-50 border-emerald-500/30 text-slate-700 shadow-teal-900/10'
                }`}
            >
                <HelpCircle
                    className={`w-4 h-4 ${isDark ? 'text-lime-400' : 'text-emerald-600'}`}
                />
                <span className="hidden sm:inline">Customer Guide</span>
            </button>
        </>
    );
}