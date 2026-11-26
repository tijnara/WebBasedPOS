// src/components/landing/LandingLiveTour.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Sparkles,
    ChevronRight,
    ChevronLeft,
    X,
    Compass,
    CheckCircle2,
    Play,
    RotateCcw
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const TOUR_STORAGE_KEY = 'seaside_landing_tour_completed_v1';

function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function findElementByText(selector, text) {
    if (typeof document === 'undefined') return null;
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
        if ((node.textContent || '').trim().includes(text) && isVisible(node)) {
            return node;
        }
    }
    return null;
}

const TOUR_STEPS = [
    {
        id: 'overview',
        badge: 'Welcome • Step 1 of 8',
        title: 'Welcome to Seaside Station!',
        description:
            'Welcome! Whether you are a visiting guest checking out our purified water station or a staff member logging into the Seaside Sales System, this quick tour shows you around.',
        usageTip: 'Use Next / Back (or your Left & Right arrow keys) to step through the page, or click Skip anytime.',
        cardTarget: 'login',
        findElement: () => {
            const hero = document.querySelector('[data-tour="hero-features"]');
            if (isVisible(hero)) return hero;
            return document.querySelector('.volt-login-root');
        }
    },
    {
        id: 'header-nav',
        badge: 'For Guests • Step 2 of 8',
        title: 'Guest Info, About & Theme Switcher',
        description:
            'Visiting guests can click "FOR OUR GUESTS: Learn about Seaside Station" or "About" to explore our 21-stage RO water purification process, or tap the Sun/Moon icon to toggle Day & Night mode.',
        usageTip: 'Click "About" for station info, "Contact" to message us, or the Sun/Moon icon to switch themes.',
        cardTarget: 'login',
        findElement: () =>
            document.querySelector('[data-tour="landing-header-nav"]') ||
            findElementByText('button, a', 'About')?.parentElement
    },
    {
        id: 'volt-mascot',
        badge: 'Interactive Mascot • Step 3 of 8',
        title: 'Meet Volt — Your Seaside Companion',
        description:
            'Volt reacts live as you interact with the form! Whenever you type your email or password, Volt closes his glowing eyes tight to protect your privacy.',
        usageTip: 'Watch Volt’s dialogue bubble above his head for helpful status updates and reactions.',
        cardTarget: 'login',
        findElement: () =>
            document.querySelector('[aria-label="Robot dialogue"]')?.parentElement
    },
    {
        id: 'login-form',
        badge: 'Staff Portal • Step 4 of 8',
        title: 'Staff & Admin Sign In',
        description:
            'Authorized Seaside staff and administrators sign in here with their username or email to access real-time POS checkout, inventory, customer records, and delivery tracking.',
        usageTip: 'Need a password reset? Click "Forgot?" right above the password field.',
        cardTarget: 'login',
        findElement: () =>
            document.getElementById('volt-email')?.closest('form') ||
            document.querySelector('.volt-login-root section:last-of-type')
    },
    {
        id: 'signup-tab',
        badge: 'New Staff • Step 5 of 8',
        title: 'Staff Account Registration',
        description:
            'New Seaside team members can switch to "+ Staff Sign Up" to register their name, email, and +63 mobile number for Administrator approval.',
        usageTip: 'New staff accounts stay safely in Pending Review until approved by an Admin.',
        cardTarget: 'signup',
        findElement: () =>
            document.querySelector('.volt-login-root section:last-of-type')
    },
    {
        id: 'contact-station',
        badge: 'Direct Support • Step 6 of 8',
        title: 'Contact Seaside Station',
        description:
            'Guests with water delivery inquiries or staff following up on account approval can view our Labrador, Pangasinan address, operating hours, Facebook link, and send a direct message.',
        usageTip: 'Fill in your email and message to send an instant inquiry straight to Seaside administration.',
        cardTarget: 'contact',
        findElement: () =>
            document.querySelector('.volt-login-root section:last-of-type')
    },
    {
        id: 'demo-sandbox',
        badge: 'Guest Preview • Step 7 of 8',
        title: 'Try the Live Demo Version',
        description:
            'Curious how the Seaside POS & Sales System works inside? Guests and visitors can test-drive the full dashboard with sample data—no account required!',
        usageTip: 'Click "+ Try Demo Version" to jump straight into the interactive sandbox.',
        cardTarget: 'login',
        findElement: () => findElementByText('button', 'Try Demo Version')
    },
    {
        id: 'ready',
        badge: 'Complete • Step 8 of 8',
        title: 'You’re Ready to Explore!',
        description:
            'That’s everything on the welcome page! Sign in to your dashboard, learn more about Seaside Station, or test-drive the live Demo Version.',
        usageTip: 'Want to see this tour again later? Click the "Interactive Tour" button at the bottom-right corner anytime.',
        cardTarget: 'login',
        findElement: () =>
            document.querySelector('.volt-login-root section:last-of-type')
    }
];

export default function LandingLiveTour({
                                            activeCard = 'login',
                                            onSwitchCard,
                                            onStartDemo
                                        }) {
    const darkMode = useStore((s) => s.darkMode);
    const [isOpen, setIsOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState(null);
    const previousCardRef = useRef(activeCard);

    const currentStep = TOUR_STEPS[stepIndex];

    // Auto-start the interactive tour immediately for first-time guests/visitors
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const hasVisitedBefore = localStorage.getItem(TOUR_STORAGE_KEY);
            if (!hasVisitedBefore) {
                const timer = setTimeout(() => {
                    previousCardRef.current = 'login';
                    setStepIndex(0);
                    setIsOpen(true);
                    try {
                        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
                    } catch {
                        // Ignore storage write errors
                    }
                }, 650);
                return () => clearTimeout(timer);
            }
        } catch {
            // Fallback if localStorage is blocked (e.g. strict privacy mode)
            const timer = setTimeout(() => {
                setStepIndex(0);
                setIsOpen(true);
            }, 650);
            return () => clearTimeout(timer);
        }
    }, []);

    const measureTarget = useCallback(() => {
        if (!isOpen || typeof window === 'undefined') return;
        const step = TOUR_STEPS[stepIndex];
        if (!step) return;

        const el = step.findElement?.();
        if (!el || !isVisible(el)) {
            setSpotlightRect(null);
            return;
        }

        const rect = el.getBoundingClientRect();
        const pad = 10;
        const clampedTop = Math.max(8, rect.top - pad);
        const clampedLeft = Math.max(8, rect.left - pad);
        const clampedWidth = Math.min(window.innerWidth - clampedLeft - 8, rect.width + pad * 2);
        const clampedHeight = Math.min(window.innerHeight - clampedTop - 8, rect.height + pad * 2);

        setSpotlightRect({
            top: clampedTop,
            left: clampedLeft,
            width: clampedWidth,
            height: clampedHeight
        });
    }, [isOpen, stepIndex]);

    useEffect(() => {
        if (!isOpen) return;
        const step = TOUR_STEPS[stepIndex];
        if (step?.cardTarget && onSwitchCard && activeCard !== step.cardTarget) {
            onSwitchCard(step.cardTarget);
        }

        const timer = setTimeout(() => {
            const el = step?.findElement?.();
            if (el && window.innerHeight < 760) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            measureTarget();
        }, 120);

        const timer2 = setTimeout(measureTarget, 320);
        return () => {
            clearTimeout(timer);
            clearTimeout(timer2);
        };
    }, [isOpen, stepIndex, activeCard, onSwitchCard, measureTarget]);

    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener('resize', measureTarget);
        window.addEventListener('scroll', measureTarget, true);
        return () => {
            window.removeEventListener('resize', measureTarget);
            window.removeEventListener('scroll', measureTarget, true);
        };
    }, [isOpen, measureTarget]);

    const closeTour = useCallback(() => {
        setIsOpen(false);
        try {
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        } catch {
            // Ignore storage errors
        }
        if (onSwitchCard && previousCardRef.current) {
            onSwitchCard(previousCardRef.current);
        }
    }, [onSwitchCard]);

    const handleNext = useCallback(() => {
        if (stepIndex < TOUR_STEPS.length - 1) {
            setStepIndex((i) => i + 1);
        } else {
            closeTour();
        }
    }, [stepIndex, closeTour]);

    const handlePrev = useCallback(() => {
        if (stepIndex > 0) {
            setStepIndex((i) => i - 1);
        }
    }, [stepIndex]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeTour();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeTour, handleNext, handlePrev]);

    const startTourManually = () => {
        previousCardRef.current = activeCard || 'login';
        setStepIndex(0);
        setIsOpen(true);
    };

    const getTooltipPositionStyle = () => {
        if (typeof window === 'undefined' || !spotlightRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(370px, calc(100vw - 24px))'
            };
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cardWidth = Math.min(370, vw - 24);

        if (vw < 860) {
            const isTargetInLowerHalf = spotlightRect.top + spotlightRect.height / 2 > vh * 0.52;
            return isTargetInLowerHalf
                ? { top: '16px', left: '50%', transform: 'translateX(-50%)', width: `${cardWidth}px` }
                : { bottom: '16px', left: '50%', transform: 'translateX(-50%)', width: `${cardWidth}px` };
        }

        const spaceLeft = spotlightRect.left;
        const spaceRight = vw - (spotlightRect.left + spotlightRect.width);

        if (spaceLeft >= cardWidth + 36) {
            const topPos = Math.min(Math.max(24, spotlightRect.top + 8), vh - 300);
            return {
                top: `${topPos}px`,
                left: `${spotlightRect.left - cardWidth - 22}px`,
                width: `${cardWidth}px`
            };
        }

        if (spaceRight >= cardWidth + 36) {
            const topPos = Math.min(Math.max(24, spotlightRect.top + 8), vh - 300);
            return {
                top: `${topPos}px`,
                left: `${spotlightRect.left + spotlightRect.width + 22}px`,
                width: `${cardWidth}px`
            };
        }

        const spaceBelow = vh - (spotlightRect.top + spotlightRect.height);
        if (spaceBelow >= 250) {
            return {
                top: `${spotlightRect.top + spotlightRect.height + 18}px`,
                left: `${Math.min(Math.max(16, spotlightRect.left), vw - cardWidth - 16)}px`,
                width: `${cardWidth}px`
            };
        }

        return {
            top: `${Math.max(16, spotlightRect.top - 250)}px`,
            left: `${Math.min(Math.max(16, spotlightRect.left), vw - cardWidth - 16)}px`,
            width: `${cardWidth}px`
        };
    };

    return (
        <>
            {/* Replay Button in Bottom-Right Corner When Tour Is Closed */}
            {!isOpen && (
                <div className="fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-50 flex flex-col items-end">
                    <button
                        type="button"
                        onClick={startTourManually}
                        className={`group flex items-center gap-2 px-3.5 py-2 rounded-full border font-bold text-xs backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                            darkMode
                                ? 'bg-[#0f172a]/90 hover:bg-[#162238] border-lime-400/40 text-slate-100 shadow-black/50'
                                : 'bg-white/95 hover:bg-emerald-50 border-emerald-500/35 text-slate-800 shadow-teal-900/10'
                        }`}
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <Compass
                            className={`w-4 h-4 transition-transform duration-300 group-hover:rotate-45 ${
                                darkMode ? 'text-lime-400' : 'text-emerald-600'
                            }`}
                        />
                        <span>Interactive Tour</span>
                    </button>
                </div>
            )}

            {/* Full-Screen Auto-Launching Spotlight & Guided Tour Card */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] pointer-events-none"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Welcome tour"
                >
                    <div
                        onClick={closeTour}
                        className="fixed inset-0 pointer-events-auto cursor-pointer"
                        style={{
                            background: spotlightRect ? 'transparent' : 'rgba(2, 6, 23, 0.72)'
                        }}
                    />

                    {spotlightRect && (
                        <div
                            className="fixed rounded-[24px] pointer-events-none transition-all duration-300 ease-out"
                            style={{
                                top: `${spotlightRect.top}px`,
                                left: `${spotlightRect.left}px`,
                                width: `${spotlightRect.width}px`,
                                height: `${spotlightRect.height}px`,
                                boxShadow: darkMode
                                    ? '0 0 0 9999px rgba(2, 6, 23, 0.76), 0 0 0 2.5px #a3e635, 0 0 32px 6px rgba(163, 230, 53, 0.45)'
                                    : '0 0 0 9999px rgba(15, 23, 42, 0.58), 0 0 0 2.5px #10b981, 0 0 30px 6px rgba(16, 185, 129, 0.4)'
                            }}
                        >
                            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-lime-400 shadow-[0_0_12px_#a3e635] animate-ping" />
                        </div>
                    )}

                    <div
                        style={getTooltipPositionStyle()}
                        className={`fixed pointer-events-auto rounded-[24px] p-4 sm:p-5 border backdrop-blur-2xl transition-all duration-300 shadow-2xl ${
                            darkMode
                                ? 'bg-[#0c1424]/95 border-lime-400/35 text-slate-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)]'
                                : 'bg-white/95 border-emerald-500/35 text-slate-800 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.3)]'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border ${
                                    darkMode
                                        ? 'bg-lime-400/15 text-lime-300 border-lime-400/30'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-500/25'
                                }`}
                            >
                                <Sparkles className="w-3 h-3" />
                                {currentStep.badge}
                            </span>

                            <button
                                type="button"
                                onClick={closeTour}
                                aria-label="Skip tour"
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                    darkMode
                                        ? 'text-slate-400 hover:text-white hover:bg-white/10'
                                        : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <h3
                            className={`text-lg font-black tracking-tight leading-snug mb-1.5 ${
                                darkMode ? 'text-white' : 'text-slate-900'
                            }`}
                        >
                            {currentStep.title}
                        </h3>

                        <p
                            className={`text-xs sm:text-[13px] leading-relaxed mb-3 ${
                                darkMode ? 'text-slate-300' : 'text-slate-600'
                            }`}
                        >
                            {currentStep.description}
                        </p>

                        <div
                            className={`rounded-xl p-2.5 mb-3.5 border text-[11.5px] leading-snug flex items-start gap-2 ${
                                darkMode
                                    ? 'bg-[#080e1b] border-sky-400/20 text-sky-200'
                                    : 'bg-emerald-50/80 border-emerald-500/20 text-emerald-900'
                            }`}
                        >
                            <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    darkMode ? 'text-lime-400' : 'text-emerald-600'
                                }`}
                            />
                            <span>
                                <strong className="font-extrabold">Tip: </strong>
                                {currentStep.usageTip}
                            </span>
                        </div>

                        {(currentStep.id === 'demo-sandbox' || currentStep.id === 'ready') &&
                            onStartDemo && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeTour();
                                        onStartDemo();
                                    }}
                                    className={`w-full mb-3 py-2 px-3 rounded-xl font-extrabold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        darkMode
                                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/40 text-lime-300'
                                            : 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/30 text-emerald-800'
                                    }`}
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Launch Demo Sandbox Right Now</span>
                                </button>
                            )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-500/15">
                            <div className="flex items-center gap-1.5">
                                {TOUR_STEPS.map((s, idx) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setStepIndex(idx)}
                                        aria-label={`Go to step ${idx + 1}`}
                                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                            idx === stepIndex
                                                ? 'w-5 bg-gradient-to-r from-lime-400 to-emerald-500'
                                                : darkMode
                                                    ? 'w-1.5 bg-slate-700 hover:bg-slate-500'
                                                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5">
                                {stepIndex > 0 ? (
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-colors cursor-pointer ${
                                            darkMode
                                                ? 'bg-[#080e1b] hover:bg-slate-800 border-slate-800 text-slate-300'
                                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span>Back</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={closeTour}
                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                                            darkMode
                                                ? 'text-slate-400 hover:text-slate-200'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Skip tour
                                    </button>
                                )}

                                {stepIndex === TOUR_STEPS.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStepIndex(0)}
                                        title="Replay Tutorial"
                                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                                            darkMode
                                                ? 'bg-[#080e1b] hover:bg-slate-800 border-slate-800 text-slate-300'
                                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-lime-400 to-emerald-400 hover:brightness-105 shadow-md flex items-center gap-1 cursor-pointer transition-all"
                                >
                                    <span>
                                        {stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                                    </span>
                                    {stepIndex < TOUR_STEPS.length - 1 && (
                                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}