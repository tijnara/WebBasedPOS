// src/components/landing/ContactFormView.jsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AnimatedLandingIcon from './AnimatedLandingIcon';

export default function ContactFormView({
                                            businessHours,
                                            physicalAddress,
                                            facebookLink,
                                            prefillData,
                                            onBackToLogin
                                        }) {
    const [sendTick, setSendTick] = useState(0);
    const [fbTick, setFbTick] = useState(0);
    const [backTick, setBackTick] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        setFocus
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            email: '',
            message: '',
            honeypot: ''
        }
    });

    useEffect(() => {
        if (!prefillData) return;
        setValue('email', prefillData.email || '');
        setValue('message', prefillData.message || '');
        const timer = setTimeout(() => {
            setFocus(prefillData.focus || 'email');
        }, 100);
        return () => clearTimeout(timer);
    }, [prefillData, setValue, setFocus]);

    const onSubmit = async (data) => {
        if (data.honeypot) return;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Message sent successfully!');
                reset();
                onBackToLogin();
            } else {
                throw new Error('Failed to send message');
            }
        } catch {
            alert('Failed to send message. Please try again.');
        }
    };

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full translate-z-[20px] transform-gpu">
            <div className="mb-5 text-center">
                <h2 className="text-2xl sm:text-3xl font-black mb-1 text-slate-900 dark:text-white tracking-tight">
                    Contact Us
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                    We&apos;d love to hear from you
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-5">
                <div className="bg-slate-50/90 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5f7d00] dark:text-emerald-400 mb-1 uppercase tracking-wider">
                        <AnimatedLandingIcon name="clock" size={15} strokeColor="currentColor" loop />
                        <span>Business Hours:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                        {businessHours}
                    </p>
                </div>
                <div className="bg-slate-50/90 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 dark:text-cyan-400 mb-1 uppercase tracking-wider">
                        <AnimatedLandingIcon name="explore" size={16} strokeColor="currentColor" loop />
                        <span>Address:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {physicalAddress}
                    </p>
                </div>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="hidden">
                    <label htmlFor="honeypot">Do not fill this out</label>
                    <input type="text" id="honeypot" {...register('honeypot')} />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                        Your Email Address
                    </label>
                    <input
                        type="email"
                        {...register('email', {
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        })}
                        className={`seaside-glass-input w-full px-4 py-2.5 bg-white/85 dark:bg-slate-950/70 border ${
                            errors.email
                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                : 'border-slate-200/90 dark:border-white/15 focus:border-[#8DB600] focus:ring-[#8DB600]/20'
                        } rounded-xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm`}
                        placeholder="example@email.com"
                    />
                    {errors.email && (
                        <p className="text-rose-500 dark:text-rose-400 text-[10px] mt-0.5 ml-1 font-medium">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                        Message
                    </label>
                    <textarea
                        rows="3"
                        {...register('message', {
                            required: 'Message is required',
                            minLength: { value: 10, message: 'Message must be at least 10 characters' },
                            maxLength: { value: 500, message: 'Message must be less than 500 characters' }
                        })}
                        className={`seaside-glass-input w-full px-4 py-2.5 bg-white/85 dark:bg-slate-950/70 border ${
                            errors.message
                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                : 'border-slate-200/90 dark:border-white/15 focus:border-[#8DB600] focus:ring-[#8DB600]/20'
                        } rounded-xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none text-xs sm:text-sm`}
                        placeholder="Write your message here..."
                    />
                    {errors.message && (
                        <p className="text-rose-500 dark:text-rose-400 text-[10px] mt-0.5 ml-1 font-medium">
                            {errors.message.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onMouseEnter={() => setSendTick((t) => t + 1)}
                        style={{
                            background: 'linear-gradient(135deg, #8DB600 0%, #0d9488 100%)',
                            color: '#ffffff'
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                        <AnimatedLandingIcon
                            name="mail"
                            size={16}
                            strokeColor="#ffffff"
                            triggerKey={sendTick}
                        />
                        <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    </button>

                    <a
                        href={facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={() => setFbTick((t) => t + 1)}
                        className="inline-flex items-center gap-1.5 text-blue-600 dark:text-sky-400 hover:underline font-bold transition-colors text-xs"
                    >
                        <AnimatedLandingIcon
                            name="facebook"
                            size={18}
                            strokeColor="currentColor"
                            triggerKey={fbTick}
                        />
                        <span>Message us on Facebook</span>
                    </a>
                </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 text-center">
                <button
                    type="button"
                    onClick={onBackToLogin}
                    onMouseEnter={() => setBackTick((t) => t + 1)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                    <AnimatedLandingIcon
                        name="arrowLeft"
                        size={16}
                        strokeColor="currentColor"
                        triggerKey={backTick}
                    />
                    <span>Back to Login</span>
                </button>
            </div>
        </div>
    );
}