// src/components/tracking/WaterTestScheduleCard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
    FlaskConical,
    CalendarClock,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Sliders,
    History,
    Sparkles
} from 'lucide-react';

function buildManilaTargetDate(dateStr, timeStr = '09:00') {
    const cleanDate = String(dateStr || '').trim().slice(0, 10);
    const cleanTime = /^\d{2}:\d{2}/.test(String(timeStr || '').trim())
        ? String(timeStr).trim().slice(0, 5)
        : '09:00';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return null;
    const target = new Date(`${cleanDate}T${cleanTime}:00+08:00`);
    return Number.isNaN(target.getTime()) ? null : target;
}

export default function WaterTestScheduleCard({
                                                  schedule,
                                                  isAdmin = false,
                                                  isSaving = false,
                                                  onOpenScheduleModal,
                                                  onRecordTestComplete,
                                                  onViewHistory
                                              }) {
    const [nowMs, setNowMs] = useState(() => Date.now());

    // Live 1-second countdown ticker
    useEffect(() => {
        const timer = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const countdownState = useMemo(() => {
        const targetDate = buildManilaTargetDate(
            schedule?.next_test_date,
            schedule?.test_time || '09:00'
        );

        if (!targetDate) {
            return {
                hasSchedule: false,
                isOverdue: false,
                isDueSoon: false,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                totalDaysLeft: 0,
                percentElapsed: 0,
                formattedTarget: 'Not scheduled yet'
            };
        }

        const diffMs = targetDate.getTime() - nowMs;
        const isOverdue = diffMs <= 0;
        const absMs = Math.abs(diffMs);

        const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((absMs / (1000 * 60)) % 60);
        const seconds = Math.floor((absMs / 1000) % 60);

        const totalDaysLeft = isOverdue ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isDueSoon = !isOverdue && totalDaysLeft <= 7;

        const intervalDays = Math.max(1, Number(schedule?.interval_days || 30));
        const daysRemainingExact = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.max(0, intervalDays - daysRemainingExact);
        const percentElapsed = isOverdue
            ? 100
            : Math.min(100, Math.max(0, Math.round((daysElapsed / intervalDays) * 100)));

        const formattedTarget = targetDate.toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const formattedTime = targetDate.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return {
            hasSchedule: true,
            isOverdue,
            isDueSoon,
            days,
            hours,
            minutes,
            seconds,
            totalDaysLeft,
            percentElapsed,
            formattedTarget: `${formattedTarget} • ${formattedTime}`
        };
    }, [schedule, nowMs]);

    const {
        hasSchedule,
        isOverdue,
        isDueSoon,
        days,
        hours,
        minutes,
        seconds,
        totalDaysLeft,
        percentElapsed,
        formattedTarget
    } = countdownState;

    const testType = schedule?.test_type || 'Monthly Water Quality Test';
    const notes =
        schedule?.notes ||
        'Water quality parameters are normal. No immediate lab testing action required until scheduled date.';

    // Dynamic theme classes based on urgency
    const cardTheme = !hasSchedule
        ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        : isOverdue
            ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 water-card-urgent'
            : isDueSoon
                ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 water-card-soon'
                : 'bg-cyan-50/75 dark:bg-cyan-950/25 border-cyan-200 dark:border-cyan-800/80 water-card-normal';

    const badgeTheme = !hasSchedule
        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        : isOverdue
            ? 'bg-rose-600 text-white animate-pulse'
            : isDueSoon
                ? 'bg-amber-500 text-white animate-bounce'
                : 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';

    const statusBadgeText = !hasSchedule
        ? 'UNSET'
        : isOverdue
            ? 'TEST DUE'
            : isDueSoon
                ? `${totalDaysLeft}D LEFT`
                : 'SCHEDULED';

    return (
        <div
            className={`relative rounded-2xl border p-4 shadow-2xs overflow-hidden transition-all duration-300 water-card-enter ${cardTheme}`}
        >
            {/* Subtle animated shimmer sweep */}
            <div className="pointer-events-none absolute inset-0 water-card-shimmer" />

            {/* Top Row: Icon, Title, Notes & Status Pill (Matches "All Filters in Good Condition" card) */}
            <div className="relative flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                    <div
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isOverdue
                                ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                                : isDueSoon
                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                    : 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300'
                        }`}
                    >
                        <span
                            className={`absolute inset-0 rounded-xl opacity-40 water-sonar-ping ${
                                isOverdue
                                    ? 'bg-rose-400'
                                    : isDueSoon
                                        ? 'bg-amber-400'
                                        : 'bg-cyan-400'
                            }`}
                        />
                        <FlaskConical className="w-4 h-4 relative z-10 water-flask-float" />
                    </div>

                    <div className="min-w-0">
                        <h4
                            className={`text-xs font-extrabold leading-snug ${
                                isOverdue
                                    ? 'text-rose-950 dark:text-rose-100'
                                    : isDueSoon
                                        ? 'text-amber-950 dark:text-amber-100'
                                        : 'text-cyan-950 dark:text-cyan-100'
                            }`}
                        >
                            {isOverdue
                                ? 'Water Test Schedule Due'
                                : 'Water Test Schedule'}
                        </h4>
                        <p
                            className={`text-[11px] font-bold truncate mt-0.5 ${
                                isOverdue
                                    ? 'text-rose-700 dark:text-rose-300'
                                    : isDueSoon
                                        ? 'text-amber-800 dark:text-amber-300'
                                        : 'text-cyan-800 dark:text-cyan-300'
                            }`}
                            title={testType}
                        >
                            {testType}
                        </p>
                        <p
                            className={`text-[11px] leading-relaxed mt-1 ${
                                isOverdue
                                    ? 'text-rose-700/90 dark:text-rose-300/90'
                                    : isDueSoon
                                        ? 'text-amber-800/90 dark:text-amber-300/90'
                                        : 'text-cyan-800/85 dark:text-cyan-300/85'
                            }`}
                        >
                            {notes}
                        </p>
                    </div>
                </div>

                <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${badgeTheme}`}
                >
                    {statusBadgeText}
                </span>
            </div>

            {/* Live Countdown Box */}
            {hasSchedule && (
                <div className="relative mt-3.5 pt-3 border-t border-black/5 dark:border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <CalendarClock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Target: {formattedTarget}</span>
                        </span>
                    </div>

                    {/* 4-Unit Live Ticking Countdown Grid */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                        {[
                            { label: 'DAYS', value: days },
                            { label: 'HRS', value: String(hours).padStart(2, '0') },
                            { label: 'MIN', value: String(minutes).padStart(2, '0') },
                            { label: 'SEC', value: String(seconds).padStart(2, '0') }
                        ].map((unit) => (
                            <div
                                key={unit.label}
                                className={`py-1.5 px-1 rounded-xl border bg-white/90 dark:bg-slate-900/90 shadow-2xs ${
                                    isOverdue
                                        ? 'border-rose-200 dark:border-rose-800/80'
                                        : isDueSoon
                                            ? 'border-amber-200 dark:border-amber-800/80'
                                            : 'border-cyan-200/80 dark:border-cyan-800/60'
                                }`}
                            >
                                <div
                                    className={`text-sm font-black font-mono leading-none ${
                                        unit.label === 'SEC' ? 'water-sec-tick' : ''
                                    } ${
                                        isOverdue
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : isDueSoon
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-cyan-700 dark:text-cyan-300'
                                    }`}
                                >
                                    {unit.value}
                                </div>
                                <div className="text-[8px] font-extrabold tracking-wider text-slate-400 mt-1">
                                    {unit.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {isOverdue && (
                        <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/60 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                                Overdue by {days}d {hours}h {minutes}m — Please conduct water test!
                            </span>
                        </div>
                    )}

                    {/* Cycle Progress Bar */}
                    <div>
                        <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{schedule?.interval_days || 30}-Day Test Cycle</span>
                            </span>
                            <span className="font-mono text-slate-700 dark:text-slate-200">
                                {percentElapsed}% elapsed
                            </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isOverdue
                                        ? 'bg-rose-500'
                                        : isDueSoon
                                            ? 'bg-amber-500'
                                            : 'bg-cyan-500'
                                }`}
                                style={{ width: `${percentElapsed}%` }}
                            />
                        </div>
                    </div>

                    {schedule?.last_tested_at && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            Last tested:{' '}
                            <strong className="text-slate-700 dark:text-slate-200">
                                {format(new Date(schedule.last_tested_at), 'MMM d, yyyy')}
                            </strong>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="relative mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center gap-1.5">
                {isAdmin && (
                    <button
                        type="button"
                        onClick={onOpenScheduleModal}
                        disabled={isSaving}
                        className="flex-1 min-w-[105px] h-8 px-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                        <Sliders className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span>Set Schedule</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={onRecordTestComplete}
                    disabled={isSaving}
                    className={`flex-1 min-w-[115px] h-8 px-2.5 rounded-xl text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer ${
                        isOverdue
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Log Test Done</span>
                </button>

                {onViewHistory && (
                    <button
                        type="button"
                        onClick={onViewHistory}
                        className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                        title="View Water Test History"
                    >
                        <History className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Scoped Animations */}
            <style jsx>{`
                @keyframes waterCardEnter {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes flaskFloat {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-2px) rotate(-6deg); }
                }

                @keyframes sonarPing {
                    0% {
                        transform: scale(0.95);
                        opacity: 0.45;
                    }
                    75%, 100% {
                        transform: scale(1.45);
                        opacity: 0;
                    }
                }

                @keyframes shimmerSlide {
                    0% { transform: translateX(-120%) skewX(-20deg); }
                    55%, 100% { transform: translateX(240%) skewX(-20deg); }
                }

                @keyframes secPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }

                @keyframes urgentGlow {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.35);
                    }
                    50% {
                        box-shadow: 0 0 0 6px rgba(225, 29, 72, 0);
                    }
                }

                @keyframes soonGlow {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 0 5px rgba(245, 158, 11, 0);
                    }
                }

                .water-card-enter {
                    animation: waterCardEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }

                .water-flask-float {
                    animation: flaskFloat 2.8s ease-in-out infinite;
                }

                .water-sonar-ping {
                    animation: sonarPing 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                .water-card-shimmer {
                    width: 40%;
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.35) 50%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    animation: shimmerSlide 4s ease-in-out infinite;
                }

                .water-sec-tick {
                    display: inline-block;
                    animation: secPulse 1s ease-in-out infinite;
                }

                .water-card-urgent {
                    animation: waterCardEnter 0.4s ease-out forwards, urgentGlow 2s infinite;
                }

                .water-card-soon {
                    animation: waterCardEnter 0.4s ease-out forwards, soonGlow 2.4s infinite;
                }
            `}</style>
        </div>
    );
}