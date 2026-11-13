// src/components/ScheduledFloaterToast.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { useSettings } from '../hooks/useSettings';
import { useStore } from '../store/useStore';
import { BellRing, Calendar, CheckCircle2, AlertTriangle, Megaphone } from 'lucide-react';

const MONTH_NAMES = [
    'Every Month',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

// Clear all local & session floater cooldown flags
export function resetScheduledFloaterStorage() {
    if (typeof window === 'undefined') return;
    try {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('seaside_scheduled_floater_')) {
                localStorage.removeItem(key);
            }
        });
        Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith('seaside_scheduled_floater_')) {
                sessionStorage.removeItem(key);
            }
        });
    } catch {
        // Ignore storage restrictions
    }
}

// Get current Year, Month (1-12), Day (1-31), and YYYY-MM-DD strictly in Asia/Manila (UTC+8)
function getManilaDateParts() {
    const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date()); // "YYYY-MM-DD"

    const [year, month, day] = dateStr.split('-').map(Number);
    return { dateStr, year, month, day };
}

function isDayInRange(currentDay, startDay, endDay) {
    if (startDay <= endDay) {
        return currentDay >= startDay && currentDay <= endDay;
    }
    return currentDay >= startDay || currentDay <= endDay;
}

export default function ScheduledFloaterToast() {
    const router = useRouter();
    const { data: settings, isLoading } = useSettings();
    const user = useStore(s => s.user);

    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [previewOverride, setPreviewOverride] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const lastEvaluatedRouteRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isPublicPage =
        ['/', '/about', '/terms', '/privacy', '/contact'].includes(router.pathname) ||
        router.pathname.startsWith('/resources');

    const isAdmin = Boolean(
        user && (
            user.isadmin === true ||
            user.isAdmin === true ||
            user.isSuperAdmin === true ||
            String(user.role?.name || user.role || '').toLowerCase().includes('admin')
        )
    );

    useEffect(() => {
        if (!mounted || isLoading) return;

        // 1. Never show on public customer-facing pages or when logged out
        if (isPublicPage || !user) {
            if (!previewOverride) setIsVisible(false);
            return;
        }

        // Fallback defaults if SQL columns were just added
        const enabled = settings ? settings.promo_floater_enabled !== false : true;
        if (!enabled) {
            if (!previewOverride) setIsVisible(false);
            return;
        }

        // 2. Role visibility check ('pos' = all staff/admins, 'admin' = admins only)
        const audience = settings?.promo_floater_audience || 'pos';
        if (audience === 'admin' && !isAdmin) {
            if (!previewOverride) setIsVisible(false);
            return;
        }

        const frequency = settings?.promo_floater_frequency || 'once_a_day';
        const { dateStr, month, day } = getManilaDateParts();
        const targetMonth = Number(settings?.promo_floater_month ?? 0);
        const startDay = Math.min(31, Math.max(1, Number(settings?.promo_floater_start_day ?? 10)));
        const endDay = Math.min(31, Math.max(1, Number(settings?.promo_floater_end_day ?? 15)));

        // 3. Check global reset timestamp from DB so changing options resets all staff browsers
        const dbResetToken = String(settings?.promo_floater_reset_at || 'default');
        const localResetToken = localStorage.getItem('seaside_scheduled_floater_reset_token');
        if (localResetToken !== dbResetToken) {
            resetScheduledFloaterStorage();
            localStorage.setItem('seaside_scheduled_floater_reset_token', dbResetToken);
            lastEvaluatedRouteRef.current = null;
        }

        // 4. Date range check (bypassed in 'testing' or 'every_day_all_month' modes)
        const bypassDateWindow = frequency === 'testing' || frequency === 'every_day_all_month';
        if (!bypassDateWindow) {
            const monthMatches = targetMonth === 0 || targetMonth === month;
            const dayMatches = isDayInRange(day, startDay, endDay);
            if (!monthMatches || !dayMatches) {
                if (!previewOverride) setIsVisible(false);
                return;
            }
        }

        // 5. Evaluate frequency rules
        const dailyKey = `seaside_scheduled_floater_seen_${dateStr}`;
        const sessionKey = `seaside_scheduled_floater_session_seen`;
        const routeKey = `${router.asPath}_${dbResetToken}`;

        let shouldShow = false;

        if (frequency === 'testing' || frequency === 'every_page') {
            if (lastEvaluatedRouteRef.current !== routeKey) {
                lastEvaluatedRouteRef.current = routeKey;
                shouldShow = true;
            }
        } else if (frequency === 'every_session') {
            if (!sessionStorage.getItem(sessionKey)) {
                shouldShow = true;
            }
        } else {
            // 'once_a_day' or 'every_day_all_month'
            if (!localStorage.getItem(dailyKey)) {
                shouldShow = true;
            }
        }

        if (shouldShow) {
            setPreviewOverride(null);
            setSecondsLeft(frequency === 'testing' ? 0 : 3);
            setIsVisible(true);

            // Delay writing seen flags by 600ms so React 18 Strict Mode's immediate remount doesn't swallow the popup
            const markSeenTimer = setTimeout(() => {
                if (frequency === 'once_a_day' || frequency === 'every_day_all_month') {
                    localStorage.setItem(dailyKey, 'true');
                } else if (frequency === 'every_session') {
                    sessionStorage.setItem(sessionKey, 'true');
                }
            }, 600);

            return () => clearTimeout(markSeenTimer);
        }
    }, [mounted, settings, isLoading, isPublicPage, user, isAdmin, router.asPath, previewOverride]);

    // Countdown timer for the read-focus lock
    useEffect(() => {
        if (!isVisible || secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [isVisible, secondsLeft]);

    // Listen for manual preview or reset triggers from Page Settings
    useEffect(() => {
        const handlePreviewTrigger = (e) => {
            setPreviewOverride(e?.detail || null);
            setSecondsLeft(0);
            setIsVisible(true);
        };
        const handleResetTrigger = (e) => {
            resetScheduledFloaterStorage();
            lastEvaluatedRouteRef.current = null;
            if (e?.detail?.showNow) {
                setPreviewOverride(e.detail.draft || null);
                setSecondsLeft(0);
                setIsVisible(true);
            }
        };

        window.addEventListener('preview-scheduled-floater', handlePreviewTrigger);
        window.addEventListener('reset-scheduled-floater', handleResetTrigger);
        return () => {
            window.removeEventListener('preview-scheduled-floater', handlePreviewTrigger);
            window.removeEventListener('reset-scheduled-floater', handleResetTrigger);
        };
    }, []);

    if (!mounted) return null;

    const activeData = previewOverride || settings || {
        promo_floater_title: 'Monthly Schedule & Reminder',
        promo_floater_content: 'Reminder: Our monthly promo & billing schedule is active from the 10th to the 15th of the month!',
        promo_floater_month: 0,
        promo_floater_start_day: 10,
        promo_floater_end_day: 15,
        promo_floater_frequency: 'once_a_day'
    };

    if (!isVisible || isPublicPage || !user) return null;

    const targetMonth = Number(activeData.promo_floater_month ?? 0);
    const startDay = Number(activeData.promo_floater_start_day ?? 10);
    const endDay = Number(activeData.promo_floater_end_day ?? 15);
    const frequency = activeData.promo_floater_frequency || 'once_a_day';

    const scheduleLabel =
        frequency === 'testing'
            ? 'Testing Mode (Active Now)'
            : frequency === 'every_day_all_month'
                ? 'Daily Reminder (Every Day)'
                : targetMonth === 0
                    ? `Every ${startDay}–${endDay} of the Month`
                    : `${MONTH_NAMES[targetMonth] || 'Monthly'} ${startDay}–${endDay}`;

    const isLocked = secondsLeft > 0 && !previewOverride && frequency !== 'testing';

    const handleDismiss = () => {
        if (isLocked) return;
        const { dateStr } = getManilaDateParts();
        if (frequency === 'once_a_day' || frequency === 'every_day_all_month') {
            localStorage.setItem(`seaside_scheduled_floater_seen_${dateStr}`, 'true');
        } else if (frequency === 'every_session') {
            sessionStorage.setItem('seaside_scheduled_floater_session_seen', 'true');
        }
        setIsVisible(false);
        setPreviewOverride(null);
    };

    const portalTarget = document.getElementById('modal-root') || document.body;

    return createPortal(
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="scheduled-floater-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md floater-backdrop-in"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-[#8DB600] dark:border-lime-500 rounded-3xl shadow-2xl overflow-hidden floater-card-enter floater-glow-ring"
            >
                {/* Top High-Impact Banner */}
                <div
                    className="relative px-5 py-4 flex items-center justify-between text-white overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #5ea832 0%, #458922 50%, #38721a 100%)' }}
                >
                    <div className="pointer-events-none absolute inset-0 floater-shimmer" />

                    <div className="relative flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                            <BellRing className="w-5 h-5 text-white floater-bell-swing" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 shadow-2xs">
                                    <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                                    {previewOverride ? 'Preview Notice' : frequency === 'testing' ? 'Testing Mode' : 'Important Staff Notice'}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-lime-100 mt-1 truncate">
                                {scheduleLabel}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 sm:p-7 space-y-4">
                    {(activeData.promo_floater_title || 'Monthly Schedule & Reminder') && (
                        <div className="flex items-start gap-2.5">
                            <Megaphone className="w-5 h-5 text-[#8DB600] dark:text-lime-400 shrink-0 mt-1" />
                            <h3
                                id="scheduled-floater-title"
                                className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug tracking-tight"
                            >
                                {activeData.promo_floater_title || 'Monthly Schedule & Reminder'}
                            </h3>
                        </div>
                    )}

                    {(activeData.promo_floater_content || 'Reminder: Our monthly promo & billing schedule is active from the 10th to the 15th of the month!') && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-l-4 border-[#8DB600] dark:border-lime-500 border-y border-r border-slate-200/80 dark:border-slate-700/80 shadow-inner">
                            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                                {activeData.promo_floater_content || 'Reminder: Our monthly promo & billing schedule is active from the 10th to the 15th of the month!'}
                            </p>
                        </div>
                    )}

                    {/* Footer Acknowledgement */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-[#8DB600]" />
                            {scheduleLabel}
                        </span>

                        <button
                            type="button"
                            onClick={handleDismiss}
                            disabled={isLocked}
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black tracking-wide transition-all shadow-md ${
                                isLocked
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                    : 'bg-[#8DB600] hover:bg-[#7ca000] text-white active:scale-95 cursor-pointer'
                            }`}
                        >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>
                                {isLocked
                                    ? `Please Read (${secondsLeft}s)...`
                                    : 'I Have Read & Understood'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes backdropFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes aggressivePopShake {
                    0% {
                        opacity: 0;
                        transform: scale(0.72) translateY(24px);
                    }
                    45% {
                        opacity: 1;
                        transform: scale(1.04) translateY(-4px);
                    }
                    60% {
                        transform: scale(0.98) translateX(-7px);
                    }
                    72% {
                        transform: scale(1.01) translateX(7px);
                    }
                    84% {
                        transform: scale(0.995) translateX(-4px);
                    }
                    92% {
                        transform: scale(1) translateX(3px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateX(0);
                    }
                }

                @keyframes glowPulse {
                    0%, 100% {
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.55),
                                    0 0 0 0 rgba(141, 182, 0, 0.55);
                    }
                    50% {
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.55),
                                    0 0 0 12px rgba(141, 182, 0, 0);
                    }
                }

                @keyframes bellSwing {
                    0%, 100% { transform: rotate(0deg); }
                    15% { transform: rotate(18deg); }
                    30% { transform: rotate(-16deg); }
                    45% { transform: rotate(12deg); }
                    60% { transform: rotate(-10deg); }
                    75% { transform: rotate(6deg); }
                }

                @keyframes shimmerSweep {
                    0% { transform: translateX(-100%) skewX(-20deg); }
                    60%, 100% { transform: translateX(220%) skewX(-20deg); }
                }

                .floater-backdrop-in {
                    animation: backdropFadeIn 0.25s ease-out forwards;
                }

                .floater-card-enter {
                    animation: aggressivePopShake 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }

                .floater-glow-ring {
                    animation: aggressivePopShake 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                               glowPulse 2s ease-in-out 0.65s infinite;
                }

                .floater-bell-swing {
                    transform-origin: top center;
                    animation: bellSwing 1.2s ease-in-out infinite;
                }

                .floater-shimmer {
                    width: 45%;
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.28) 50%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    animation: shimmerSweep 2.6s ease-in-out infinite;
                }
            `}</style>
        </div>,
        portalTarget
    );
}