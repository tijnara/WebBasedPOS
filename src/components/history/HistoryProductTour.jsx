// src/components/history/HistoryProductTour.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useStore } from '../../store/useStore';

const HISTORY_TOUR_STORAGE_KEY = 'seaside_has_seen_history_tour';

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
    if (text.includes('Loading Workspace...') || text.includes('Loading Shift...')) {
        return true;
    }

    return false;
}

export default function HistoryProductTour({ isSalesLoading = false, isAdmin = false }) {
    const darkMode = useStore((s) => s.darkMode);
    const driverInstanceRef = useRef(null);
    const hasAutoTriggeredRef = useRef(false);

    const launchTour = useCallback(() => {
        if (typeof window === 'undefined') return;

        if (driverInstanceRef.current) {
            driverInstanceRef.current.destroy();
        }

        const isDesktop = window.innerWidth >= 768;
        const listSelector =
            isDesktop && isElementVisible(document.getElementById('tour-history-desktop-table'))
                ? '#tour-history-desktop-table'
                : '#tour-history-mobile-list';

        const steps = [
            {
                popover: {
                    title: '🧾 Welcome to Sales History',
                    description:
                        'Review past station transactions, filter by customer or date range, view receipts, and settle unpaid charges—press Esc anytime to exit.',
                    align: 'center'
                }
            },
            {
                element: '#tour-history-filters',
                popover: {
                    title: '1. Search & Filter Transactions',
                    description:
                        'Press / to search by customer, staff, or status, filter by product, or pick a From / To date range (Manila time).',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: listSelector,
                popover: {
                    title: '2. Transaction Ledger & Actions',
                    description: isAdmin
                        ? 'Click the eye icon to open a printable receipt, "Settle" unpaid charges, or use Edit and Delete to adjust or reverse a sale.'
                        : 'Click the eye icon to view and print a transaction receipt, or click "Settle" on unpaid orders.',
                    side: 'top',
                    align: 'center'
                }
            }
        ];

        if (isElementVisible(document.getElementById('tour-history-pagination'))) {
            steps.push({
                element: '#tour-history-pagination',
                popover: {
                    title: '3. Page Navigation',
                    description:
                        'Browse through pages of recorded station sales using the pagination controls.',
                    side: 'top',
                    align: 'end'
                }
            });
        }

        const tourObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayOpacity: darkMode ? 0.74 : 0.52,
            stagePadding: 8,
            stageRadius: 18,
            popoverClass: darkMode
                ? 'seaside-driver-popover dark-tour'
                : 'seaside-driver-popover light-tour',
            progressText: '{{current}} of {{total}}',
            nextBtnText: 'Next →',
            prevBtnText: '← Back',
            doneBtnText: 'Got It',
            onDestroyed: () => {
                try {
                    localStorage.setItem(HISTORY_TOUR_STORAGE_KEY, 'true');
                } catch {
                    // Ignore storage restrictions
                }
            },
            steps
        });

        driverInstanceRef.current = tourObj;
        tourObj.drive();
    }, [darkMode, isAdmin]);

    useEffect(() => {
        if (typeof window === 'undefined' || hasAutoTriggeredRef.current) return;

        let hasSeen = false;
        try {
            hasSeen = Boolean(localStorage.getItem(HISTORY_TOUR_STORAGE_KEY));
        } catch {
            hasSeen = false;
        }

        if (hasSeen) return;

        let pollTimer = null;
        let settleTimer = null;
        let maxWaitTimer = null;
        let cancelled = false;

        const triggerOnce = () => {
            if (cancelled || hasAutoTriggeredRef.current) return;
            hasAutoTriggeredRef.current = true;
            if (pollTimer) clearInterval(pollTimer);
            if (maxWaitTimer) clearTimeout(maxWaitTimer);

            settleTimer = setTimeout(() => {
                if (!cancelled) {
                    launchTour();
                }
            }, 300);
        };

        const checkReady = () => {
            if (cancelled || hasAutoTriggeredRef.current) return;
            const filtersReady = Boolean(document.getElementById('tour-history-filters'));
            if (!isSalesLoading && !hasActiveLoadingUi() && filtersReady) {
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
    }, [isSalesLoading, launchTour]);

    useEffect(() => {
        return () => {
            if (driverInstanceRef.current) {
                driverInstanceRef.current.destroy();
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
                    max-width: 340px;
                    backdrop-filter: blur(18px);
                }

                .driver-popover.seaside-driver-popover.dark-tour {
                    background: linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(10, 16, 28, 0.99) 100%);
                    color: #f1f5f9;
                    border: 1.5px solid rgba(163, 230, 53, 0.4);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 28px rgba(132, 204, 22, 0.18);
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.01em;
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-description {
                    font-size: 13px;
                    line-height: 1.55;
                    color: #cbd5e1;
                    margin-top: 6px;
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-progress-text {
                    font-size: 11px;
                    font-weight: 700;
                    color: #a3e635;
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-close-btn {
                    color: #94a3b8;
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-close-btn:hover {
                    color: #ffffff;
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-arrow-side-left.driver-popover-arrow {
                    border-left-color: rgba(15, 23, 42, 0.97);
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-arrow-side-right.driver-popover-arrow {
                    border-right-color: rgba(15, 23, 42, 0.97);
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-arrow-side-top.driver-popover-arrow {
                    border-top-color: rgba(15, 23, 42, 0.97);
                }
                .driver-popover.seaside-driver-popover.dark-tour .driver-popover-arrow-side-bottom.driver-popover-arrow {
                    border-bottom-color: rgba(15, 23, 42, 0.97);
                }

                .driver-popover.seaside-driver-popover.light-tour {
                    background: linear-gradient(155deg, #ffffff 0%, #f0fdf8 100%);
                    color: #0f172a;
                    border: 1.5px solid rgba(16, 185, 129, 0.35);
                    box-shadow: 0 22px 45px -12px rgba(15, 23, 42, 0.25);
                }
                .driver-popover.seaside-driver-popover.light-tour .driver-popover-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .driver-popover.seaside-driver-popover.light-tour .driver-popover-description {
                    font-size: 13px;
                    line-height: 1.55;
                    color: #475569;
                    margin-top: 6px;
                }
                .driver-popover.seaside-driver-popover.light-tour .driver-popover-progress-text {
                    font-size: 11px;
                    font-weight: 800;
                    color: #059669;
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
                title="Replay History Guide"
                aria-label="Replay History Guide"
                className={`fixed bottom-28 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                    darkMode
                        ? 'bg-[#0f172a]/90 hover:bg-[#162238] border-lime-400/35 text-slate-200 shadow-black/50'
                        : 'bg-white/95 hover:bg-emerald-50 border-emerald-500/30 text-slate-700 shadow-teal-900/10'
                }`}
            >
                <HelpCircle
                    className={`w-4 h-4 ${darkMode ? 'text-lime-400' : 'text-emerald-600'}`}
                />
                <span className="hidden sm:inline">History Guide</span>
            </button>
        </>
    );
}