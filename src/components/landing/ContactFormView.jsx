// src/components/landing/ContactFormView.jsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Clock, MapPin, ArrowLeft } from 'lucide-react';

export default function ContactFormView({
                                            businessHours,
                                            physicalAddress,
                                            facebookLink,
                                            prefillData,
                                            onBackToLogin
                                        }) {
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
                    <div className="flex items-center text-[11px] font-bold text-[#5f7d00] dark:text-emerald-400 mb-1 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Business Hours:
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                        {businessHours}
                    </p>
                </div>
                <div className="bg-slate-50/90 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-2xs">
                    <div className="flex items-center text-[11px] font-bold text-cyan-700 dark:text-cyan-400 mb-1 uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                        Address:
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
                        style={{
                            background: 'linear-gradient(135deg, #8DB600 0%, #0d9488 100%)',
                            color: '#ffffff'
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    </button>

                    <a
                        href={facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-sky-400 hover:underline font-bold transition-colors text-xs"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Message us on Facebook
                    </a>
                </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 text-center">
                <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Login</span>
                </button>
            </div>
        </div>
    );
}