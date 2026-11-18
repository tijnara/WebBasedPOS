// src/components/landing/SignUpFormView.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

export default function SignUpFormView({ onSignUp, regError, onSwitchToLogin }) {
    const darkMode = useStore((s) => s.darkMode);
    const [showPassword, setShowPassword] = useState(false);
    const [nameTick, setNameTick] = useState(0);
    const [emailTick, setEmailTick] = useState(0);
    const [phoneTick, setPhoneTick] = useState(0);
    const [lockTick, setLockTick] = useState(0);
    const [eyeTick, setEyeTick] = useState(0);
    const [submitTick, setSubmitTick] = useState(0);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: ''
        }
    });

    const onSubmit = async (data) => {
        const success = await onSignUp?.(data);
        if (success) {
            reset();
        }
    };

    const nameField = register('name', { required: 'Full name is required' });
    const emailField = register('email', {
        required: 'Email is required',
        pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Enter a valid email address'
        }
    });
    const phoneField = register('phone', { required: 'Mobile number is required' });
    const passwordField = register('password', {
        required: 'Password is required',
        minLength: { value: 6, message: 'Password must be at least 6 characters' }
    });

    return (
        <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-5 text-center">
                <h2 className="text-2xl sm:text-3xl font-black mb-1 text-slate-900 dark:text-white tracking-tight">
                    Staff Registration
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                    Create a Seaside staff account for admin approval.
                </p>
            </div>

            {regError && (
                <div className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 backdrop-blur-md animate-in fade-in duration-150">
                    <AnimatedLandingIcon
                        name="alertCircle"
                        size={18}
                        strokeColor={darkMode ? '#fb7185' : '#e11d48'}
                        loop
                        className="mt-0.5"
                    />
                    <span className="leading-relaxed">{regError}</span>
                </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
                {/* Full Name */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 ml-1">
                        Full Name
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                            <AnimatedLandingIcon
                                name="userPlus"
                                size={17}
                                strokeColor="currentColor"
                                triggerKey={nameTick}
                            />
                        </div>
                        <input
                            type="text"
                            {...nameField}
                            onFocus={() => setNameTick((t) => t + 1)}
                            className="seaside-glass-input w-full h-11 pl-11 pr-4 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20 transition-all font-medium text-sm outline-none shadow-2xs"
                            placeholder="Juan Dela Cruz"
                        />
                    </div>
                    {errors.name && (
                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-medium">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 ml-1">
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                            <AnimatedLandingIcon
                                name="mail"
                                size={17}
                                strokeColor="currentColor"
                                triggerKey={emailTick}
                            />
                        </div>
                        <input
                            type="email"
                            {...emailField}
                            onFocus={() => setEmailTick((t) => t + 1)}
                            className="seaside-glass-input w-full h-11 pl-11 pr-4 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20 transition-all font-medium text-sm outline-none shadow-2xs"
                            placeholder="staff@seaside.com"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-medium">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 ml-1">
                        Mobile Number
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                            <AnimatedLandingIcon
                                name="phone"
                                size={17}
                                strokeColor="currentColor"
                                triggerKey={phoneTick}
                            />
                        </div>
                        <input
                            type="tel"
                            {...phoneField}
                            onFocus={() => setPhoneTick((t) => t + 1)}
                            className="seaside-glass-input w-full h-11 pl-11 pr-4 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20 transition-all font-medium text-sm outline-none shadow-2xs"
                            placeholder="0917 123 4567"
                        />
                    </div>
                    {errors.phone && (
                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-medium">
                            {errors.phone.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 ml-1">
                        Password
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
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
                            className="seaside-glass-input w-full h-11 pl-11 pr-11 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20 transition-all font-medium text-sm outline-none shadow-2xs"
                            placeholder="Minimum 6 characters"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setShowPassword((prev) => !prev);
                                setEyeTick((t) => t + 1);
                            }}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
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
                    {errors.password && (
                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-medium">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onMouseEnter={() => setSubmitTick((t) => t + 1)}
                        style={{
                            background: 'linear-gradient(135deg, #8DB600 0%, #65a30d 50%, #0d9488 100%)',
                            color: '#ffffff'
                        }}
                        className="relative overflow-hidden w-full h-12 rounded-2xl font-black text-sm sm:text-base shadow-[0_10px_25px_-5px_rgba(141,182,0,0.45)] border border-lime-300/40 transition-all hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                    >
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shimmer" />
                        <span>{isSubmitting ? 'Creating Account...' : 'Submit Registration'}</span>
                        {!isSubmitting && (
                            <AnimatedLandingIcon
                                name="arrowRight"
                                size={18}
                                strokeColor="#ffffff"
                                triggerKey={submitTick}
                            />
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                    Already approved?{' '}
                    <span className="underline font-bold text-[#5f7d00] dark:text-[#a3d100]">
                        Sign in here
                    </span>
                </button>
            </div>
        </div>
    );
}