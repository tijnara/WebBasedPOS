// src/components/landing/LoginFormView.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

export default function LoginFormView({
                                          onLogin,
                                          onDemoLogin,
                                          isDemoLoading,
                                          authError,
                                          pendingApprovalInfo,
                                          onDismissPending,
                                          onNotifyAdmin,
                                          onForgotPassword,
                                          onSwitchToSignUp
                                      }) {
    const darkMode = useStore((s) => s.darkMode);
    const [showPassword, setShowPassword] = useState(false);
    const [emailTick, setEmailTick] = useState(0);
    const [lockTick, setLockTick] = useState(0);
    const [eyeTick, setEyeTick] = useState(0);
    const [submitTick, setSubmitTick] = useState(0);
    const [demoTick, setDemoTick] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { isSubmitting }
    } = useForm({
        defaultValues: { email: '', password: '' }
    });

    const emailField = register('email', { required: true });
    const passwordField = register('password', { required: true });

    const containerSurfaceStyle = darkMode
        ? {
            background:
                'linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(10, 16, 28, 0.82) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
        }
        : {
            background:
                'linear-gradient(155deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 253, 248, 0.96) 55%, rgba(225, 246, 240, 0.98) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.25)',
            boxShadow:
                '0 18px 40px -12px rgba(14, 116, 144, 0.14), inset 0 1.5px 2px rgba(255, 255, 255, 1)'
        };

    const inputClasses = darkMode
        ? 'bg-slate-950/70 border-white/15 text-white placeholder-slate-500 focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20'
        : 'bg-white border-emerald-900/15 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]';

    return (
        <div
            style={containerSurfaceStyle}
            className="rounded-3xl p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95"
        >
            <div className="mb-6 text-center">
                <h2
                    className={`text-3xl sm:text-4xl font-black mb-1.5 tracking-tight ${
                        darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                >
                    Welcome Back
                </h2>
                <p
                    className={`font-medium text-xs sm:text-sm ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                >
                    Log in to your Seaside dashboard.
                </p>
            </div>

            {/* Blended Pending Administrator Approval Handler */}
            {pendingApprovalInfo && (
                <div
                    className={`mb-5 rounded-2xl p-4 border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 ${
                        darkMode
                            ? 'bg-gradient-to-br from-amber-500/15 via-slate-950/75 to-[#8DB600]/10 border-amber-400/35 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.25)]'
                            : 'bg-gradient-to-br from-amber-50 via-white/95 to-lime-50 border-amber-300/80 shadow-[0_10px_25px_-10px_rgba(245,158,11,0.2)]'
                    }`}
                >
                    <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3">
                            <div
                                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-inner ${
                                    darkMode
                                        ? 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                                        : 'bg-amber-100 border-amber-300 text-amber-700'
                                }`}
                            >
                                <AnimatedLandingIcon
                                    name="clock"
                                    size={18}
                                    strokeColor="currentColor"
                                    loop
                                />
                            </div>
                            <div className="space-y-1">
                                <span
                                    className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                        darkMode
                                            ? 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                                            : 'bg-amber-100 text-amber-800 border-amber-300/80'
                                    }`}
                                >
                                    Pending Admin Review
                                </span>
                                <h4
                                    className={`text-xs sm:text-sm font-black leading-snug ${
                                        darkMode ? 'text-white' : 'text-slate-900'
                                    }`}
                                >
                                    {pendingApprovalInfo.title}
                                </h4>
                                <p
                                    className={`text-[11px] leading-relaxed ${
                                        darkMode ? 'text-slate-300' : 'text-slate-600'
                                    }`}
                                >
                                    {pendingApprovalInfo.message}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onDismissPending}
                            className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                                darkMode
                                    ? 'text-slate-400 hover:text-white hover:bg-white/10'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                            }`}
                            aria-label="Dismiss notice"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div
                        className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-2 ${
                            darkMode ? 'border-white/10' : 'border-amber-200/70'
                        }`}
                    >
                        <span
                            className={`text-[10px] font-medium truncate ${
                                darkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                        >
                            Account:{' '}
                            <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>
                                {pendingApprovalInfo.identifier}
                            </strong>
                        </span>
                        <button
                            type="button"
                            onClick={onNotifyAdmin}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#8DB600]/40 text-[10.5px] font-bold transition-colors shrink-0 cursor-pointer ${
                                darkMode
                                    ? 'bg-[#8DB600]/20 hover:bg-[#8DB600]/30 text-[#b8eb00]'
                                    : 'bg-[#8DB600]/15 hover:bg-[#8DB600]/25 text-[#5f7d00]'
                            }`}
                        >
                            <AnimatedLandingIcon name="mail" size={14} strokeColor="currentColor" />
                            <span>Notify Admin</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Invalid Credentials / Error Alert */}
            {authError && (
                <div
                    className={`mb-4 rounded-2xl p-3.5 text-xs font-semibold border flex items-start gap-2.5 backdrop-blur-md animate-in fade-in duration-150 ${
                        darkMode
                            ? 'bg-rose-500/15 text-rose-200 border-rose-500/30'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                >
                    <AnimatedLandingIcon
                        name="alertCircle"
                        size={18}
                        strokeColor={darkMode ? '#fb7185' : '#e11d48'}
                        loop
                        className="mt-0.5"
                    />
                    <span className="leading-relaxed">{authError}</span>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onLogin)}>
                <div className="space-y-1.5">
                    <label
                        className={`block text-[10px] font-bold uppercase tracking-widest ml-1 ${
                            darkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}
                    >
                        Username or Email
                    </label>
                    <div className="relative group">
                        <div
                            className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors ${
                                darkMode
                                    ? 'group-focus-within:text-[#8DB600]'
                                    : 'group-focus-within:text-emerald-600'
                            }`}
                        >
                            <AnimatedLandingIcon
                                name="mail"
                                size={17}
                                strokeColor="currentColor"
                                triggerKey={emailTick}
                            />
                        </div>
                        <input
                            type="text"
                            {...emailField}
                            onFocus={() => setEmailTick((t) => t + 1)}
                            className={`w-full h-12 pl-11 pr-4 border rounded-2xl transition-all font-medium text-sm outline-none ${inputClasses}`}
                            placeholder="name@seaside.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label
                            className={`text-[10px] font-bold uppercase tracking-widest ${
                                darkMode ? 'text-slate-300' : 'text-slate-600'
                            }`}
                        >
                            Password
                        </label>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className={`text-[11px] font-bold hover:underline transition-colors cursor-pointer ${
                                darkMode
                                    ? 'text-[#a3d100] hover:text-lime-300'
                                    : 'text-emerald-700 hover:text-emerald-600'
                            }`}
                        >
                            Forgot?
                        </button>
                    </div>
                    <div className="relative group">
                        <div
                            className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors ${
                                darkMode
                                    ? 'group-focus-within:text-[#8DB600]'
                                    : 'group-focus-within:text-emerald-600'
                            }`}
                        >
                            <AnimatedLandingIcon
                                name="lock"
                                size={17}
                                strokeColor="currentColor"
                                triggerKey={lockTick}
                            />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            {...passwordField}
                            onFocus={() => setLockTick((t) => t + 1)}
                            className={`w-full h-12 pl-11 pr-11 border rounded-2xl transition-all font-medium text-sm outline-none ${inputClasses}`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setShowPassword((prev) => !prev);
                                setEyeTick((t) => t + 1);
                            }}
                            className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors cursor-pointer ${
                                darkMode
                                    ? 'text-slate-400 hover:text-white'
                                    : 'text-slate-400 hover:text-slate-700'
                            }`}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <AnimatedLandingIcon
                                name="visibility"
                                size={18}
                                strokeColor="currentColor"
                                triggerKey={eyeTick}
                            />
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || isDemoLoading}
                        onMouseEnter={() => setSubmitTick((t) => t + 1)}
                        style={{
                            background: 'linear-gradient(135deg, #8DB600 0%, #65a30d 50%, #0d9488 100%)',
                            color: '#ffffff'
                        }}
                        className="relative overflow-hidden w-full h-12 rounded-2xl font-black text-sm sm:text-base shadow-[0_10px_25px_-5px_rgba(141,182,0,0.45)] border border-lime-300/40 transition-all hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                    >
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shimmer" />
                        {isSubmitting ? (
                            <>
                                <SpinnerIcon className="text-white" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <AnimatedLandingIcon
                                    name="arrowRight"
                                    size={18}
                                    strokeColor="#ffffff"
                                    triggerKey={submitTick}
                                />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onSwitchToSignUp}
                    className={`text-xs font-semibold transition-colors cursor-pointer ${
                        darkMode
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    New Seaside staff?{' '}
                    <span
                        className={`underline font-bold ${
                            darkMode ? 'text-[#a3d100]' : 'text-emerald-700'
                        }`}
                    >
                        Register an account
                    </span>
                </button>
            </div>

            <div className="mt-5 relative flex items-center justify-center">
                <hr
                    className={`w-full ${
                        darkMode ? 'border-white/10' : 'border-emerald-900/10'
                    }`}
                />
                <span
                    className={`absolute px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-full border ${
                        darkMode
                            ? 'bg-slate-900 border-white/10'
                            : 'bg-white border-emerald-900/10 text-slate-500'
                    }`}
                >
                    Or
                </span>
            </div>

            <button
                type="button"
                onClick={onDemoLogin}
                onMouseEnter={() => setDemoTick((t) => t + 1)}
                disabled={isSubmitting || isDemoLoading}
                className={`mt-5 w-full h-11 border rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-[0.985] flex items-center justify-center gap-2 disabled:opacity-60 text-xs sm:text-sm backdrop-blur-md cursor-pointer ${
                    darkMode
                        ? 'border-white/15 bg-white/10 hover:bg-white/15 text-white shadow-2xs'
                        : 'border-emerald-900/15 bg-white hover:bg-emerald-50/80 text-slate-800 shadow-sm'
                }`}
            >
                {isDemoLoading ? (
                    <>
                        <SpinnerIcon className={darkMode ? 'text-white' : 'text-slate-700'} />
                        <span>Loading Demo...</span>
                    </>
                ) : (
                    <>
                        <AnimatedLandingIcon
                            name="userPlus"
                            size={17}
                            strokeColor={darkMode ? '#a3d100' : '#059669'}
                            triggerKey={demoTick}
                        />
                        <span>Try Demo Version</span>
                    </>
                )}
            </button>
        </div>
    );
}

function SpinnerIcon({ className = '' }) {
    return (
        <svg
            className={`animate-spin h-4 w-4 ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}