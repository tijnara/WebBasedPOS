// src/components/navbar/NotificationBellTour.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

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

export default function NotificationBellTour({
                                                 isOpen = false,
                                                 onClose,
                                                 onEnsurePanelOpen,
                                                 idPrefix = 'desktop',
                                                 isAdmin = false
                                             }) {
    const storeDarkMode = useStore((s) => s.darkMode);
    const isDark = resolveIsDark(storeDarkMode);

    const [mounted, setMounted] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setStepIndex(0);
        }
    }, [isOpen]);

    const steps = useMemo(() => {
        const triggerId = `tour-notif-trigger-${idPrefix}`;
        const headerId = `tour-notif-header-${idPrefix}`;
        const feedId = `tour-notif-feed-${idPrefix}`;
        const footerId = `tour-notif-footer-${idPrefix}`;

        return [
            {
                id: 'notif-trigger',
                targetId: triggerId,
                title: '1. Live Action Counter Bell',
                description:
                    'Displays your live badge count for overdue water tests, filter & fleet servicing, low stock items, staff notes, and admin approvals. Press Esc anytime to close.',
                side: 'bottom',
                needsPanel: false
            },
            {
                id: 'notif-header',
                targetId: headerId,
                title: '2. Alert Status Summary',
                description:
                    'Shows the total number of pending station actions at a glance—or displays "All clear" when every system is healthy.',
                side: 'bottom',
                needsPanel: true
            },
            {
                id: 'notif-feed',
                targetId: feedId,
                title: '3. Categorized Action Feed',
                description: isAdmin
                    ? 'Prioritizes Water Tests, Staff Announcements, Filter & Fleet Maintenance, Low Stock, Scratchpad Notes, Staff Registrations, and Contact Inquiries. Click any alert row to jump straight to its page.'
                    : 'Prioritizes Water Tests, Staff Announcements, Filter & Fleet Maintenance, Low Stock, and Scratchpad Notes. Click any alert row to open the relevant module immediately.',
                side: 'bottom',
                needsPanel: true
            },
            {
                id: 'notif-footer',
                targetId: footerId,
                title: '4. Quick Module Shortcuts',
                description: isAdmin
                    ? 'Use these one-tap footer links to jump directly into Maintenance, Notes, Staff Approvals, or your Contact Inbox with live item counts.'
                    : 'Use these quick footer shortcuts to jump directly to Maintenance or Dashboard Scratchpad Notes with live counts.',
                side: 'top',
                needsPanel: true
            }
        ];
    }, [idPrefix, isAdmin]);

    const closeTour = useCallback(() => {
        onClose?.();
    }, [onClose]);

    // Ensure dropdown panel is open when needed, scroll target to center, and measure
    useEffect(() => {
        if (!isOpen || typeof window === 'undefined') {
            setTargetRect(null);
            return;
        }

        const safeIdx = Math.min(stepIndex, steps.length - 1);
        const step = steps[safeIdx];
        if (!step) return;

        if (step.needsPanel) {
            onEnsurePanelOpen?.();
        }

        if (!step.targetId) {
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
    }, [isOpen, stepIndex, steps, onEnsurePanelOpen]);

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

    if (!mounted || !isOpen) return null;

    const safeIdx = Math.min(stepIndex, steps.length - 1);
    const currentStep = steps[safeIdx] || steps[0];
    const isLastStep = safeIdx === steps.length - 1;

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

        const estHeight = 210;
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
            ? '1.5px solid rgba(163, 230, 53, 0.45)'
            : '1.5px solid rgba(16, 185, 129, 0.35)',
        boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 28px rgba(132, 204, 22, 0.2)'
            : '0 22px 45px -12px rgba(15, 23, 42, 0.25)'
    };

    return createPortal(
        <div
            data-notif-tour="true"
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
                        aria-label="Close notifications guide"
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
                            className="px-3 py-1.5 rounded-[10px] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all hover:brightness-105"
                            style={{
                                background: 'linear-gradient(90deg, #84cc16 0%, #10b981 100%)',
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
        </div>,
        document.body
    );
}