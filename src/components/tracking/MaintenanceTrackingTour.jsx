// src/components/tracking/MaintenanceTrackingTour.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

const MAINT_PAGE_TOUR_KEY = 'seaside_has_seen_maintenance_page_tour';
const MAINT_WATER_MODAL_TOUR_KEY = 'seaside_has_seen_water_test_modal_tour';
const MAINT_VEHICLE_MODAL_TOUR_KEY = 'seaside_has_seen_manage_vehicles_modal_tour';

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
        text.includes('Loading maintenance records...')
    ) {
        return true;
    }

    return false;
}

export default function MaintenanceTrackingTour({
                                                    isDataLoading = false,
                                                    activeTab = 'filters',
                                                    isWaterTestModalOpen = false,
                                                    isManageVehiclesModalOpen = false
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

    // Determine active context: water-modal | vehicle-modal | page
    const contextKey = useMemo(() => {
        if (isWaterTestModalOpen) return 'water-modal';
        if (isManageVehiclesModalOpen) return 'vehicle-modal';
        return 'page';
    }, [isWaterTestModalOpen, isManageVehiclesModalOpen]);

    const storageKey = useMemo(() => {
        if (contextKey === 'water-modal') return MAINT_WATER_MODAL_TOUR_KEY;
        if (contextKey === 'vehicle-modal') return MAINT_VEHICLE_MODAL_TOUR_KEY;
        return MAINT_PAGE_TOUR_KEY;
    }, [contextKey]);

    const steps = useMemo(() => {
        if (contextKey === 'water-modal') {
            return [
                {
                    id: 'wt-intro',
                    targetId: null,
                    title: '🧪 Water Test Schedule Guide',
                    description:
                        'Configure lab test types, recurring intervals, schedule date/time, and status notes—press Esc anytime to exit.',
                    side: 'bottom'
                },
                {
                    id: 'wt-type',
                    targetId: 'tour-wt-type-section',
                    title: '1. Test Title & Laboratory Type',
                    description:
                        'Choose a saved water test type or click "Add New Type" to create and save a custom test cycle.',
                    side: 'bottom'
                },
                {
                    id: 'wt-schedule',
                    targetId: 'tour-wt-schedule-fields',
                    title: '2. Schedule Date, Time & Cycle',
                    description:
                        'Set the next scheduled test date, Manila time, recurring cycle interval in days, and instructions.',
                    side: 'bottom'
                },
                {
                    id: 'wt-footer',
                    targetId: 'tour-wt-footer',
                    title: '3. Save or Cancel',
                    description:
                        'Click "Save Schedule" to update the live countdown card, or "Cancel" to close.',
                    side: 'top'
                }
            ];
        }

        if (contextKey === 'vehicle-modal') {
            return [
                {
                    id: 'veh-intro',
                    targetId: null,
                    title: '🚚 Manage Vehicles Guide',
                    description:
                        'Add, edit, or remove delivery vehicles and set their maintenance intervals—press Esc anytime to exit.',
                    side: 'bottom'
                },
                {
                    id: 'veh-form',
                    targetId: 'tour-veh-form',
                    title: '1. Add or Edit Vehicle',
                    description:
                        'Enter the vehicle name, maintenance interval in days, last maintained date, and servicing notes.',
                    side: 'bottom'
                },
                {
                    id: 'veh-list',
                    targetId: 'tour-veh-list',
                    title: '2. Registered Fleet List',
                    description:
                        'Edit an existing vehicle or delete a vehicle from the fleet.',
                    side: 'top'
                }
            ];
        }

        const pageSteps = [
            {
                id: 'page-intro',
                targetId: null,
                title: '🛠️ Filter & Maintenance Guide',
                description:
                    'Track filtration stage lifespans, water quality test schedules, and delivery fleet servicing—press Esc anytime to exit.',
                side: 'bottom'
            },
            {
                id: 'page-admin-actions',
                targetId: 'tour-maint-admin-actions',
                title: '1. Water Test & Vehicle Controls',
                description:
                    'Open "Water Test Schedule" to configure lab test dates/types, or "Manage Vehicles" to add and edit fleet units.',
                side: 'bottom'
            },
            {
                id: 'page-tabs',
                targetId: 'tour-maint-tabs',
                title: '2. Water Filters & Fleet Tabs',
                description:
                    'Switch between "Water Filters" and "Fleet & Logistics" to view lifespans and overdue badges.',
                side: 'bottom'
            }
        ];

        if (activeTab === 'filters') {
            pageSteps.push(
                {
                    id: 'page-filter-list',
                    targetId: 'tour-maint-filter-list',
                    title: '3. Filter Lifespan & Volume Cards',
                    description:
                        'Inspect days remaining, container volume progress, replacement history, and record replacements.',
                    side: 'top'
                },
                {
                    id: 'page-filter-sidebar',
                    targetId: 'tour-maint-filter-sidebar',
                    title: '4. Filter Alerts & Water Test Countdown',
                    description:
                        'View overdue filter status and track the upcoming water quality test countdown or log a completed test.',
                    side: 'left'
                }
            );
        } else {
            pageSteps.push({
                id: 'page-vehicle-list',
                targetId: 'tour-maint-vehicle-list',
                title: '3. Vehicle Fleet Maintenance Cards',
                description:
                    'Check elapsed days and remaining time for each vehicle, view maintenance history, or record servicing.',
                side: 'top'
            });
        }

        return pageSteps;
    }, [contextKey, activeTab]);

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

    // Close active tour if its context closes (e.g., modal dismissed)
    useEffect(() => {
        if (!isOpen) return;
        if (contextKey === 'water-modal' && !isWaterTestModalOpen) {
            setIsOpen(false);
        } else if (contextKey === 'vehicle-modal' && !isManageVehiclesModalOpen) {
            setIsOpen(false);
        }
    }, [isOpen, contextKey, isWaterTestModalOpen, isManageVehiclesModalOpen]);

    // Auto-launch once per context on first visit after loading finishes
    useEffect(() => {
        if (typeof window === 'undefined' || triggeredContexts[contextKey]) return;

        if (contextKey === 'page' && isDataLoading) return;
        if (contextKey === 'water-modal' && !isWaterTestModalOpen) return;
        if (contextKey === 'vehicle-modal' && !isManageVehiclesModalOpen) return;

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
            if (contextKey === 'page' && (isDataLoading || hasActiveLoadingUi())) return;

            const readyAnchor =
                contextKey === 'water-modal'
                    ? document.getElementById('tour-wt-footer')
                    : contextKey === 'vehicle-modal'
                        ? document.getElementById('tour-veh-form')
                        : document.getElementById('tour-maint-tabs');

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
    }, [
        contextKey,
        storageKey,
        isDataLoading,
        isWaterTestModalOpen,
        isManageVehiclesModalOpen,
        triggeredContexts
    ]);

    // Measure current target and scroll into view on mobile/desktop
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

        const el = document.getElementById(step.targetId);
        if (!el || !isElementVisible(el)) {
            setTargetRect(null);
            return;
        }

        if (step.side !== 'top') {
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
    }, [isOpen, stepIndex, steps]);

    // Keyboard navigation (Esc, ArrowLeft, ArrowRight)
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
    const isInsideModal = contextKey !== 'page';

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
                    title="Replay Maintenance Guide"
                    aria-label="Replay Maintenance Guide"
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
                        {contextKey === 'water-modal'
                            ? 'Schedule Guide'
                            : contextKey === 'vehicle-modal'
                                ? 'Fleet Modal Guide'
                                : 'Maintenance Guide'}
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