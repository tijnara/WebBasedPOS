// src/components/landing/LoginFormView.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    ArrowRight,
    Clock,
    ShieldAlert,
    MessageSquare,
    X
} from 'lucide-react';

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
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { isSubmitting }
    } = useForm({
        defaultValues: { email: '', password: '' }
    });

    return (
        <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 text-center">
                <h2 className="text-3xl sm:text-4xl font-black mb-1.5 text-slate-900 dark:text-white tracking-tight">
                    Welcome Back
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                    Log in to your Seaside dashboard.
                </p>
            </div>

            {/* Blended Pending Administrator Approval Handler */}
            {pendingApprovalInfo && (
                <div className="mb-5 rounded-2xl bg-gradient-to-br from-amber-50 via-white/95 to-lime-50 dark:from-amber-500/15 dark:via-slate-950/75 dark:to-[#8DB600]/10 p-4 border border-amber-300/80 dark:border-amber-400/35 shadow-[0_10px_25px_-10px_rgba(245,158,11,0.2)] dark:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.25)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-400/15 border border-amber-300 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                                <Clock className="w-4 h-4 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-400/30">
                                    Pending Admin Review
                                </span>
                                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug">
                                    {pendingApprovalInfo.title}
                                </h4>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {pendingApprovalInfo.message}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onDismissPending}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                            aria-label="Dismiss notice"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-amber-200/70 dark:border-white/10 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                            Account:{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                                {pendingApprovalInfo.identifier}
                            </strong>
                        </span>
                        <button
                            type="button"
                            onClick={onNotifyAdmin}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8DB600]/15 hover:bg-[#8DB600]/25 dark:bg-[#8DB600]/20 dark:hover:bg-[#8DB600]/30 border border-[#8DB600]/40 text-[#5f7d00] dark:text-[#b8eb00] text-[10.5px] font-bold transition-colors shrink-0 cursor-pointer"
                        >
                            <MessageSquare className="w-3 h-3" />
                            <span>Notify Admin</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Invalid Credentials / Error Alert */}
            {authError && (
                <div className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 backdrop-blur-md animate-in fade-in duration-150">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{authError}</span>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onLogin)}>
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 ml-1">
                        Username or Email
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                            <Mail className="h-4 w-4" />
                        </div>
                        <input
                            type="text"
                            {...register('email', { required: true })}
                            className="seaside-glass-input w-full h-12 pl-11 pr-4 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20 transition-all font-medium text-sm outline-none shadow-2xs"
                            placeholder="name@seaside.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                            Password
                        </label>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-[11px] font-bold text-[#5f7d00] hover:text-[#4a6200] dark:text-[#a3d100] dark:hover:text-lime-300 hover:underline transition-colors cursor-pointer"
                        >
                            Forgot?
                        </button>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                            <Lock className="h-4 w-4" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password', { required: true })}
                            className="seaside-glass-input w-full h-12 pl-11 pr-11 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20 transition-all font-medium text-sm outline-none shadow-2xs"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || isDemoLoading}
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
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onSwitchToSignUp}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                    New Seaside staff?{' '}
                    <span className="underline font-bold text-[#5f7d00] dark:text-[#a3d100]">
                        Register an account
                    </span>
                </button>
            </div>

            <div className="mt-5 relative flex items-center justify-center">
                <hr className="w-full border-slate-200 dark:border-white/10" />
                <span className="absolute bg-white/90 dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-full border border-slate-200/80 dark:border-white/10">
                    Or
                </span>
            </div>

            <button
                type="button"
                onClick={onDemoLogin}
                disabled={isSubmitting || isDemoLoading}
                className="mt-5 w-full h-11 border border-slate-200/90 dark:border-white/15 bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-[0.985] flex items-center justify-center gap-2 disabled:opacity-60 text-xs sm:text-sm backdrop-blur-md shadow-2xs cursor-pointer"
            >
                {isDemoLoading ? (
                    <>
                        <SpinnerIcon className="text-slate-700 dark:text-white" />
                        <span>Loading Demo...</span>
                    </>
                ) : (
                    <>
                        <User className="h-4 w-4 text-[#659000] dark:text-[#a3d100]" />
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