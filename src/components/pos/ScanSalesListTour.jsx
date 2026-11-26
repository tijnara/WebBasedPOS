// src/components/pos/ScanSalesListTour.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

const SCAN_TOUR_STORAGE_KEY = 'seaside_has_seen_scan_list_tour';

const SCAN_TOUR_STEPS = [
    {
        id: 'intro',
        targetId: null,
        title: '📷 Scan Sales Sheet Guide',
        description:
            'Extract handwritten or printed delivery logs with AI, link customers, and save the sheet photo—press Esc anytime to exit.',
        side: 'bottom'
    },
    {
        id: 'delivery-date',
        targetId: 'tour-scan-delivery-date',
        title: '1. Delivery Date',
        description:
            'Select the delivery date these scanned orders belong to before saving them to sales history.',
        side: 'bottom'
    },
    {
        id: 'sub-tabs',
        targetId: 'tour-scan-sub-tabs',
        title: '2. Scan New Sheet vs. Saved Images',
        description:
            'Switch to "Scan New Sheet" to process a photo, or open "Saved Scan Images" to inspect previously archived delivery sheets.',
        side: 'bottom'
    },
    {
        id: 'capture-zone',
        targetId: 'tour-scan-capture-zone',
        title: '3. Take Photo or Upload Image',
        description:
            'Use "Take Photo" with your camera or "Upload Image" from your device to automatically transcribe customer rows, quantities, and totals.',
        side: 'bottom'
    },
    {
        id: 'save-bar',
        targetId: 'tour-scan-save-bar',
        title: '4. Save Sales & Scan Image',
        description:
            'Once rows are reviewed, click Save to record the sales, update credit/stock, and archive the scan image.',
        side: 'top'
    }
];

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

export default function ScanSalesListTour({ isModalOpen = false, isBusy = false }) {
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

    const closeTour = useCallback(() => {
        setIsOpen(false);
        try {
            localStorage.setItem(SCAN_TOUR_STORAGE_KEY, 'true');
        } catch {
            // Ignore storage restrictions
        }
    }, []);

    const openTour = useCallback(() => {
        if (!isModalOpen) return;
        setStepIndex(0);
        setIsOpen(true);
    }, [isModalOpen]);

    useEffect(() => {
        if (!isModalOpen && isOpen) {
            setIsOpen(false);
        }
    }, [isModalOpen, isOpen]);

    // Auto-launch once on first time opening ScanSalesListModal after UI/loading settles
    useEffect(() => {
        if (!isModalOpen || hasAutoTriggered || isBusy || typeof window === 'undefined') return;

        let hasSeen = false;
        try {
            hasSeen = Boolean(localStorage.getItem(SCAN_TOUR_STORAGE_KEY));
        } catch {
            hasSeen = false;
        }

        if (hasSeen) {
            setHasAutoTriggered(true);
            return;
        }

        const timer = setTimeout(() => {
            const tabsReady = isElementVisible(document.getElementById('tour-scan-sub-tabs'));
            if (tabsReady && !isBusy) {
                setHasAutoTriggered(true);
                setStepIndex(0);
                setIsOpen(true);
            }
        }, 280);

        return () => clearTimeout(timer);
    }, [isModalOpen, hasAutoTriggered, isBusy]);

    // Measure current step target and scroll into view when needed on mobile/desktop
    useEffect(() => {
        if (!isOpen || typeof window === 'undefined') {
            setTargetRect(null);
            return;
        }

        const step = SCAN_TOUR_STEPS[stepIndex];
        if (!step?.targetId) {
            setTargetRect(null);
            return;
        }

        const el = document.getElementById(step.targetId);
        if (!el || !isElementVisible(el)) {
            setTargetRect(null);
            return;
        }

        if (step.id !== 'save-bar') {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        const updateRect = () => {
            const currentEl = document.getElementById(step.targetId);
            if (!currentEl || !isElementVisible(currentEl)) {
                setTargetRect(null);
                return;
            }
            const rect = currentEl.getBoundingClientRect();
            const pad = 6;
            setTargetRect({
                top: Math.max(8, rect.top - pad),
                left: Math.max(8, rect.left - pad),
                width: Math.min(window.innerWidth - 16, rect.width + pad * 2),
                height: Math.min(window.innerHeight - 16, rect.height + pad * 2)
            });
        };

        const t1 = setTimeout(updateRect, 60);
        const t2 = setTimeout(updateRect, 240);

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [isOpen, stepIndex]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeTour();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setStepIndex((prev) =>
                    prev < SCAN_TOUR_STEPS.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, closeTour]);

    if (!mounted || !isModalOpen) return null;

    const currentStep = SCAN_TOUR_STEPS[stepIndex] || SCAN_TOUR_STEPS[0];
    const isLastStep = stepIndex === SCAN_TOUR_STEPS.length - 1;

    const getPopoverStyle = () => {
        if (typeof window === 'undefined') return {};
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = Math.min(340, vw - 24);

        if (!targetRect) {
            return {
                top: '50%',
                left: '50%',
                width: `${width}px`,
                transform: 'translate(-50%, -50%)'
            };
        }

        const estHeight = 205;
        const gap = 12;
        const clampedLeft = Math.min(
            Math.max(12, targetRect.left + targetRect.width / 2 - width / 2),
            vw - width - 12
        );

        const belowTop = targetRect.top + targetRect.height + gap;
        const aboveTop = targetRect.top - estHeight - gap;

        if (currentStep.side === 'top') {
            if (aboveTop >= 12) {
                return { top: `${aboveTop}px`, left: `${clampedLeft}px`, width: `${width}px` };
            }
            if (belowTop + estHeight <= vh - 12) {
                return { top: `${belowTop}px`, left: `${clampedLeft}px`, width: `${width}px` };
            }
        } else {
            if (belowTop + estHeight <= vh - 12) {
                return { top: `${belowTop}px`, left: `${clampedLeft}px`, width: `${width}px` };
            }
            if (aboveTop >= 12) {
                return { top: `${aboveTop}px`, left: `${clampedLeft}px`, width: `${width}px` };
            }
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
            ? '1.5px solid rgba(163, 230, 53, 0.45)'
            : '1.5px solid rgba(16, 185, 129, 0.35)',
        boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 28px rgba(132, 204, 22, 0.2)'
            : '0 22px 45px -12px rgba(15, 23, 42, 0.25)'
    };

    return createPortal(
        <>
            {!isOpen && (
                <button
                    type="button"
                    onClick={openTour}
                    title="Replay Scan Guide"
                    aria-label="Replay Scan Guide"
                    className={`fixed bottom-28 md:bottom-6 right-4 sm:right-6 z-[10001] flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                        isDark
                            ? 'bg-[#0f172a]/90 hover:bg-[#162238] border-lime-400/35 text-slate-200 shadow-black/50'
                            : 'bg-white/95 hover:bg-emerald-50 border-emerald-500/30 text-slate-700 shadow-teal-900/10'
                    }`}
                >
                    <HelpCircle
                        className={`w-4 h-4 ${isDark ? 'text-lime-400' : 'text-emerald-600'}`}
                    />
                    <span className="hidden sm:inline">Scan Guide</span>
                </button>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-[10000] pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Scan Sales Sheet Guide"
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
                                border: isDark ? '2px solid #a3e635' : '2px solid #10b981',
                                boxShadow: isDark
                                    ? '0 0 0 9999px rgba(2, 6, 23, 0.72), 0 0 24px rgba(163, 230, 53, 0.45)'
                                    : '0 0 0 9999px rgba(15, 23, 42, 0.48), 0 0 22px rgba(16, 185, 129, 0.35)'
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
                                style={{ color: isDark ? '#a3e635' : '#059669' }}
                            >
                                {stepIndex + 1} of {SCAN_TOUR_STEPS.length}
                            </span>

                            <div className="flex items-center gap-1.5">
                                {stepIndex > 0 && (
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
                                            setStepIndex((i) =>
                                                Math.min(SCAN_TOUR_STEPS.length - 1, i + 1)
                                            );
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-[10px] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all hover:brightness-105"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, #84cc16 0%, #10b981 100%)',
                                        color: '#052e16',
                                        boxShadow: '0 4px 12px rgba(132, 204, 22, 0.35)'
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