// src/components/landing/LandingProductTour.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useStore } from '../../store/useStore';

const TOUR_STORAGE_KEY = 'seaside_has_seen_page_tour';

function isLoadingScreenActive() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;

    if (window.__SEASIDE_CINEMATIC_ACTIVE__ === true) {
        return true;
    }

    const selectors = [
        '[data-loading="true"]',
        '[data-preloader="true"]',
        '[class*="loading-screen"]',
        '[class*="splash-screen"]',
        '[class*="preloader"]'
    ];

    for (const sel of selectors) {
        const nodes = document.querySelectorAll(sel);
        for (const node of nodes) {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            const isShown =
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                Number(style.opacity) > 0.05 &&
                rect.width > 120 &&
                rect.height > 120;
            if (isShown) return true;
        }
    }

    // Fallback check for the 20-Liter purified water preloader overlay
    const fullScreenOverlays = document.querySelectorAll('div.fixed.inset-0');
    for (const overlay of fullScreenOverlays) {
        const text = (overlay.textContent || '').toUpperCase();
        if (text.includes('20-LITER') || text.includes('PURIFIED CONTAINER') || /\d+(\.\d+)?\s*\/\s*20\.0\s*L/.test(text)) {
            const style = window.getComputedStyle(overlay);
            if (style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.05) {
                return true;
            }
        }
    }

    return false;
}

export default function LandingProductTour({ onSwitchCard }) {
    const darkMode = useStore((s) => s.darkMode);
    const driverInstanceRef = useRef(null);
    const hasAutoTriggeredRef = useRef(false);

    const launchTour = useCallback(() => {
        if (typeof window === 'undefined') return;

        if (driverInstanceRef.current) {
            driverInstanceRef.current.destroy();
        }

        onSwitchCard?.('login');

        const tourObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayOpacity: darkMode ? 0.76 : 0.58,
            stagePadding: 8,
            stageRadius: 20,
            popoverClass: darkMode ? 'seaside-driver-popover dark-tour' : 'seaside-driver-popover light-tour',
            progressText: '{{current}} of {{total}}',
            nextBtnText: 'Next →',
            prevBtnText: '← Back',
            doneBtnText: 'Get Started',
            onDestroyed: () => {
                try {
                    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
                } catch {
                    // Ignore storage restrictions
                }
                onSwitchCard?.('login');
            },
            steps: [
                // Step 0: Centered Welcome Modal
                {
                    popover: {
                        title: '👋 Welcome to Seaside Portal',
                        description:
                            'Take a quick 4-step tour to see how guests, new staff, and administrators use this page—or press Esc anytime to skip.',
                        align: 'center'
                    }
                },
                // Step 1: Top Navigation (Guests, About, Contact & Theme Toggle)
                {
                    element: '#tour-navbar',
                    popover: {
                        title: '1. Guest Info, Contact & Theme',
                        description:
                            'Visiting guests can explore our 21-stage RO water station info via "About", message us via "Contact", or switch between Day & Night mode.',
                        side: 'bottom',
                        align: 'end'
                    }
                },
                // Step 2: Sign In / Staff Sign Up Tabs
                {
                    element: '#tour-auth-tabs',
                    popover: {
                        title: '2. Sign In or Register as Staff',
                        description:
                            'Switch between "Sign In" for approved accounts and "+ Staff Sign Up" if you are a new team member requesting Admin approval.',
                        side: 'top',
                        align: 'center'
                    }
                },
                // Step 3: Main Credentials Form (+ Volt Privacy Mascot)
                {
                    element: '#tour-auth-card',
                    popover: {
                        title: '3. Secure Dashboard Login',
                        description:
                            'Enter your username or email and password here to access POS sales, inventory, and delivery tracking. (Watch Volt close his eyes while you type!)',
                        side: 'left',
                        align: 'center'
                    }
                },
                // Step 4: Instant Demo Sandbox
                {
                    element: '#tour-demo-btn',
                    popover: {
                        title: '4. Try the Live Demo Sandbox',
                        description:
                            'No account yet? Click "+ Try Demo Version" anytime to test-drive the full Seaside POS & Sales dashboard with sample data.',
                        side: 'top',
                        align: 'center'
                    }
                }
            ]
        });

        driverInstanceRef.current = tourObj;
        tourObj.drive();
    }, [darkMode, onSwitchCard]);

    // Wait until the loading screen finishes and the landing page is visible before starting first-time tour
    useEffect(() => {
        if (typeof window === 'undefined' || hasAutoTriggeredRef.current) return;

        let hasSeen = false;
        try {
            hasSeen = Boolean(localStorage.getItem(TOUR_STORAGE_KEY));
        } catch {
            hasSeen = false;
        }

        if (hasSeen) return;

        let pollTimer = null;
        let settleTimer = null;
        let maxWaitTimer = null;
        let cancelled = false;

        const triggerOnceAfterSettle = () => {
            if (cancelled || hasAutoTriggeredRef.current) return;
            hasAutoTriggeredRef.current = true;
            if (pollTimer) clearInterval(pollTimer);
            if (maxWaitTimer) clearTimeout(maxWaitTimer);

            // Brief settle pause so the landing page transition completes smoothly
            settleTimer = setTimeout(() => {
                if (!cancelled) {
                    launchTour();
                }
            }, 250);
        };

        const checkIfReady = () => {
            if (cancelled || hasAutoTriggeredRef.current) return;
            const authCardReady = Boolean(document.getElementById('tour-auth-card'));
            if (!isLoadingScreenActive() && authCardReady) {
                triggerOnceAfterSettle();
            }
        };

        // Initial check after mount
        checkIfReady();

        pollTimer = setInterval(checkIfReady, 180);
        window.addEventListener('seaside-cinematic-done', checkIfReady);

        // Safety fallback in case the loading screen takes longer than expected
        maxWaitTimer = setTimeout(() => {
            if (!isLoadingScreenActive()) {
                triggerOnceAfterSettle();
            }
        }, 8000);

        return () => {
            cancelled = true;
            if (pollTimer) clearInterval(pollTimer);
            if (settleTimer) clearTimeout(settleTimer);
            if (maxWaitTimer) clearTimeout(maxWaitTimer);
            window.removeEventListener('seaside-cinematic-done', checkIfReady);
        };
    }, [launchTour]);

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

                /* Night Mode Popover */
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

                /* Day Mode Popover */
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

            {/* Replay Button in Bottom-Right Corner */}
            <button
                type="button"
                onClick={launchTour}
                title="Replay Page Guide"
                aria-label="Replay Page Guide"
                className={`fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                    darkMode
                        ? 'bg-[#0f172a]/90 hover:bg-[#162238] border-lime-400/35 text-slate-200 shadow-black/50'
                        : 'bg-white/95 hover:bg-emerald-50 border-emerald-500/30 text-slate-700 shadow-teal-900/10'
                }`}
            >
                <HelpCircle className={`w-4 h-4 ${darkMode ? 'text-lime-400' : 'text-emerald-600'}`} />
                <span className="hidden sm:inline">Page Guide</span>
            </button>
        </>
    );
}