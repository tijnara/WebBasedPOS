// src/components/landing/ForgotPasswordModal.jsx
import React, { useState, useEffect } from 'react';

// Normalize pasted or typed input to up to 10 numeric digits (starting after +63)
function sanitizePhLocalDigits(rawValue) {
    let digits = String(rawValue || '').replace(/\D/g, '');

    // If user pasted full +639XXXXXXXXX or 639XXXXXXXXX, strip leading 63
    if (digits.startsWith('63') && digits.length > 10) {
        digits = digits.slice(2);
    }
    // If user typed/pasted 09XXXXXXXXX, strip leading 0
    if (digits.startsWith('0')) {
        digits = digits.slice(1);
    }

    return digits.slice(0, 10);
}

function isValidPhMobileLocal(digits) {
    return /^9\d{9}$/.test(digits);
}

export default function ForgotPasswordModal({
                                                isOpen,
                                                onClose,
                                                initialEmail = ''
                                            }) {
    const [requesterEmail, setRequesterEmail] = useState(initialEmail);
    const [phoneDigits, setPhoneDigits] = useState(''); // 10 digits after +63, e.g. 9171234567
    const [receiverInfo, setReceiverInfo] = useState({
        name: 'Aranjit Archita',
        email: 'aranjitarchita@gmail.com'
    });
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (initialEmail) {
            setRequesterEmail(initialEmail);
        }
    }, [initialEmail]);

    // Fetch current system-configured Admin receiver when modal opens
    useEffect(() => {
        if (!isOpen) return;
        let active = true;

        fetch('/api/forgot-password')
            .then((r) => r.json())
            .then((data) => {
                if (active && data?.ok && data.receiver?.email) {
                    setReceiverInfo({
                        name: data.receiver.name || 'Administrator',
                        email: data.receiver.email
                    });
                }
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isPhoneValid = isValidPhMobileLocal(phoneDigits);
    const fullPhPhone = `+63${phoneDigits}`;

    const handlePhoneChange = (e) => {
        const cleaned = sanitizePhLocalDigits(e.target.value);
        setPhoneDigits(cleaned);
        if (status?.type === 'error') {
            setStatus(null);
        }
    };

    const handlePhoneKeyDown = (e) => {
        // Allow navigation, backspace, delete, tab, copy/paste shortcuts
        if (
            ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
            e.ctrlKey ||
            e.metaKey
        ) {
            return;
        }
        // Block any non-digit key press
        if (!/^\d$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);

        if (!requesterEmail.trim()) {
            setStatus({
                type: 'error',
                text: 'Please enter your account email address.'
            });
            return;
        }

        if (!phoneDigits) {
            setStatus({
                type: 'error',
                text: 'Phone number is required and cannot be empty.'
            });
            return;
        }

        if (!isPhoneValid) {
            setStatus({
                type: 'error',
                text: 'Please enter a valid 10-digit Philippine mobile number starting with 9 (e.g., +639171234567).'
            });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterEmail: requesterEmail.trim(),
                    requesterPhone: fullPhPhone,
                    notes
                })
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setStatus({
                    type: 'error',
                    text: data.message || 'Could not submit password reset request.'
                });
                return;
            }

            setStatus({
                type: 'success',
                text: data.message
            });
            setPhoneDigits('');
            setNotes('');
        } catch (err) {
            setStatus({
                type: 'error',
                text: err?.message || 'Network error submitting password reset request.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStatus(null);
        setPhoneDigits('');
        setNotes('');
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl text-slate-800 dark:text-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-extrabold tracking-tight">Forgot Password</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Sends your password reset request to the assigned System Administrator.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                        Close
                    </button>
                </div>

                {/* Read-Only System Receiver Display */}
                <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10">
                    <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Assigned Admin Receiver
                    </span>
                    <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                        {receiverInfo.name} —{' '}
                        <span className="text-[#0284c7] dark:text-sky-400">{receiverInfo.email}</span>
                    </p>
                </div>

                {status && (
                    <div
                        className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                            status.type === 'success'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                    >
                        <p>{status.text}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">
                            Your Account Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={requesterEmail}
                            onChange={(e) => setRequesterEmail(e.target.value)}
                            placeholder="staff@seaside.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                        />
                    </div>

                    {/* Required Philippine Phone Number (+63) */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold uppercase">
                                Phone Number <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
                                Format: +639XXXXXXXXX
                            </span>
                        </div>
                        <div className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 focus-within:ring-2 focus-within:ring-[#8DB600] overflow-hidden">
                            <span className="px-3.5 py-2.5 text-sm font-extrabold text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-700/70 border-r border-slate-300 dark:border-white/10 select-none">
                                +63
                            </span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="9[0-9]{9}"
                                maxLength={10}
                                required
                                value={phoneDigits}
                                onChange={handlePhoneChange}
                                onKeyDown={handlePhoneKeyDown}
                                placeholder="9171234567"
                                className="w-full px-3 py-2.5 bg-transparent text-sm font-medium tracking-wide focus:outline-none"
                            />
                        </div>
                        {phoneDigits.length > 0 && !isPhoneValid && (
                            <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                Enter 10 digits starting with 9 ({phoneDigits.length}/10 digits).
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">
                            Optional Note for Admin
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Forgot password after shift change..."
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !requesterEmail.trim() || !isPhoneValid}
                        className="w-full py-2.5 rounded-xl bg-[#8DB600] hover:bg-lime-600 text-white text-sm font-extrabold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending Request...' : 'Send Reset Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}