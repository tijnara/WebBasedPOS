// src/components/admin/UserManagementTour.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

const USER_PAGE_TOUR_KEY = 'seaside_has_seen_user_management_tour';
const USER_MODAL_TOUR_KEY = 'seaside_has_seen_user_modal_tour';

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
        text.includes('Loading users...')
    ) {
        return true;
    }

    return false;
}

function computeTargetRect(el, isInsideModal) {
    if (!el || !isElementVisible(el) || typeof window === 'undefined') return null;

    const rect = el.getBoundingClientRect();
    const pad = 6;

    let top = rect.top - pad;
    let left = rect.left - pad;
    let right = rect.right + pad;
    let bottom = rect.bottom + pad;

    if (isInsideModal) {
        const scrollParent = el.closest('.overflow-y-auto');
        if (scrollParent && el.id !== 'tour-user-modal-footer') {
            const spRect = scrollParent.getBoundingClientRect();
            top = Math.max(top, spRect.top + 4);
            bottom = Math.min(bottom, spRect.bottom - 4);
        }
    }

    const clampedTop = Math.max(8, top);
    const clampedLeft = Math.max(8, left);
    const clampedWidth = Math.max(
        0,
        Math.min(window.innerWidth - 8, right) - clampedLeft
    );
    const clampedHeight = Math.max(
        0,
        Math.min(window.innerHeight - 8, bottom) - clampedTop
    );

    if (clampedWidth < 12 || clampedHeight < 12) return null;

    return {
        top: clampedTop,
        left: clampedLeft,
        width: clampedWidth,
        height: clampedHeight
    };
}

export default function UserManagementTour({
                                               isUsersLoading = false,
                                               isModalOpen = false,
                                               isEditing = false
                                           }) {
    const storeDarkMode = useStore((s) => s.darkMode);
    const isDark = resolveIsDark(storeDarkMode);

    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [triggeredContexts, setTriggeredContexts] = useState({});

    useEffect(() => {
        setMounted(true);
    }, []);

    const contextKey = useMemo(() => (isModalOpen ? 'modal' : 'page'), [isModalOpen]);
    const storageKey = useMemo(
        () => (contextKey === 'modal' ? USER_MODAL_TOUR_KEY : USER_PAGE_TOUR_KEY),
        [contextKey]
    );

    const steps = useMemo(() => {
        if (contextKey === 'modal') {
            return [
                {
                    id: 'um-intro',
                    targetId: null,
                    title: isEditing ? '✏️ Edit User Guide' : '➕ Add New User Guide',
                    description: isEditing
                        ? 'Update account details, role, station color, or password—press Esc anytime to exit.'
                        : 'Register a cashier or administrator account with role, station color, and initial password—press Esc anytime to exit.',
                    side: 'bottom'
                },
                {
                    id: 'um-profile',
                    targetId: 'tour-user-modal-profile',
                    title: '1. Name, Email, Role & Station Palette',
                    description:
                        'Enter the user’s full name and email, choose a role (or add a new role), and pick a station badge color.',
                    side: 'bottom'
                },
                {
                    id: 'um-security',
                    targetId: 'tour-user-modal-security',
                    title: '2. Password & Security Credentials',
                    description:
                        'Set or update the password, confirm it, and optionally toggle password visibility.',
                    side: 'top'
                },
                {
                    id: 'um-footer',
                    targetId: 'tour-user-modal-footer',
                    title: isEditing ? '3. Update or Cancel' : '3. Create User or Cancel',
                    description: isEditing
                        ? 'Click "Update User" to save your changes, or "Cancel" to close.'
                        : 'Click "Create User" to add the account, or "Cancel" to close.',
                    side: 'top'
                }
            ];
        }

        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
        const directorySelector =
            isDesktop && isElementVisible(document.getElementById('tour-user-desktop-table'))
                ? '#tour-user-desktop-table'
                : '#tour-user-mobile-list';

        return [
            {
                id: 'u-intro',
                targetId: null,
                title: '👤 User Management Guide',
                description:
                    'Manage staff and admin accounts, role filters, password reset receiver settings, and user credentials—press Esc anytime to exit.',
                side: 'bottom'
            },
            {
                id: 'u-add-user',
                targetId: 'tour-user-add-btn',
                title: '1. Add New User Account',
                description:
                    'Open the registration modal to create a new staff or administrator account.',
                side: 'bottom'
            },
            {
                id: 'u-kpis',
                targetId: 'tour-user-kpis',
                title: '2. Account & Approval Overview',
                description:
                    'View total accounts, administrators, staff & cashiers, and pending user approvals.',
                side: 'bottom'
            },
            {
                id: 'u-receiver',
                targetId: 'tour-user-receiver-card',
                title: '3. Forgot Password Receiver',
                description:
                    'Configure which administrator receives forgot-password requests.',
                side: 'bottom'
            },
            {
                id: 'u-filters',
                targetId: 'tour-user-filters',
                title: '4. Search & Role Filter Chips',
                description:
                    'Press / to search by name or email, and filter between All, Admins, and Staff.',
                side: 'bottom'
            },
            {
                id: 'u-directory',
                targetId: directorySelector,
                title: '5. User Directory & Actions',
                description:
                    'Inspect user roles, reveal/copy passwords as admin, edit credentials, or remove accounts.',
                side: 'top'
            }
        ];
    }, [contextKey, isEditing]);

    const closeTour = useCallback(() => {
        setIsOpen(false);
        try {
            localStorage.setItem(storageKey, 'true');
        } catch {
            // Ignore storage restrictions
        }
    }, [storageKey]);

    const openTour = useCallback(() => {
        setStepIndex(0);
        setIsOpen(true);
    }, []);

    useEffect(() => {
        if (isOpen && contextKey === 'modal' && !isModalOpen) {
            setIsOpen(false);
        }
    }, [isOpen, contextKey, isModalOpen]);

    useEffect(() => {
        if (typeof window === 'undefined' || triggeredContexts[contextKey]) return;
        if (contextKey === 'page' && isUsersLoading) return;
        if (contextKey === 'modal' && !isModalOpen) return;

        let hasSeen = false;
        try {
            hasSeen = Boolean(localStorage.getItem(storageKey));
        } catch {
            hasSeen = false;
        }

        if (hasSeen) {
            setTriggeredContexts((prev) => ({ ...prev, [contextKey]: true }));
            return;
        }

        let pollTimer = null;
        let settleTimer = null;
        let cancelled = false;

        const checkReady = () => {
            if (cancelled || triggeredContexts[contextKey]) return;
            if (contextKey === 'page' && (isUsersLoading || hasActiveLoadingUi())) return;

            const readyAnchor =
                contextKey === 'modal'
                    ? document.getElementById('tour-user-modal-footer')
                    : document.getElementById('tour-user-kpis');

            if (isElementVisible(readyAnchor)) {
                setTriggeredContexts((prev) => ({ ...prev, [contextKey]: true }));
                if (pollTimer) clearInterval(pollTimer);
                settleTimer = setTimeout(() => {
                    if (!cancelled) {
                        setStepIndex(0);
                        setIsOpen(true);
                    }
                }, 220);
            }
        };

        checkReady();
        pollTimer = setInterval(checkReady, 180);

        return () => {
            cancelled = true;
            if (pollTimer) clearInterval(pollTimer);
            if (settleTimer) clearTimeout(settleTimer);
        };
    }, [contextKey, storageKey, isUsersLoading, isModalOpen, triggeredContexts]);

    // Scroll each visible target to center on mobile and desktop, then re-measure
    useEffect(() => {
        if (!isOpen || typeof window === 'undefined') {
            setTargetRect(null);
            return;
        }

        const safeIdx = Math.min(stepIndex, steps.length - 1);
        const step = steps[safeIdx];
        if (!step?.targetId) {
            setTargetRect(null);
            return;
        }

        const isInsideModal = contextKey === 'modal';
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
                currentEl.scrollIntoView({ behavior: 'auto', block: 'center' });
            }

            setTargetRect(computeTargetRect(currentEl, isInsideModal));
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
                currentEl.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
            measureStepTarget();
        }, 180);

        const t2 = setTimeout(() => measureStepTarget(), 340);

        const onViewportChange = () => {
            setTargetRect(computeTargetRect(document.getElementById(step.targetId), isInsideModal));
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
    }, [isOpen, stepIndex, steps, contextKey]);

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

    if (!mounted) return null;

    const safeIdx = Math.min(stepIndex, steps.length - 1);
    const currentStep = steps[safeIdx] || steps[0];
    const isLastStep = safeIdx === steps.length - 1;
    const isInsideModal = contextKey === 'modal';

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
        <>
            {!isOpen && (
                <button
                    type="button"
                    onClick={openTour}
                    title="Replay User Guide"
                    aria-label="Replay User Guide"
                    className={`fixed bottom-28 md:bottom-6 right-4 sm:right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                        isInsideModal ? 'z-[10001]' : 'z-40'
                    } ${
                        isDark
                            ? 'bg-[#0f172a]/90 hover:bg-[#162238] border-lime-400/35 text-slate-200 shadow-black/50'
                            : 'bg-white/95 hover:bg-emerald-50 border-emerald-500/30 text-slate-700 shadow-teal-900/10'
                    }`}
                >
                    <HelpCircle
                        className={`w-4 h-4 ${isDark ? 'text-lime-400' : 'text-emerald-600'}`}
                    />
                    <span className="hidden sm:inline">
                        {isInsideModal ? 'User Form Guide' : 'User Guide'}
                    </span>
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