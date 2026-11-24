// src/components/landing/ForgotPasswordModal.jsx
import React, { useState, useEffect } from 'react';

const DEFAULT_ADMIN_RECEIVER = 'aranjitarchita@gmail.com'; // Admin user id = 1

export default function ForgotPasswordModal({
                                                isOpen,
                                                onClose,
                                                initialEmail = '',
                                                defaultReceiver = DEFAULT_ADMIN_RECEIVER
                                            }) {
    const [requesterEmail, setRequesterEmail] = useState(initialEmail);
    const [recipientEmail, setRecipientEmail] = useState(defaultReceiver);
    const [isEditingReceiver, setIsEditingReceiver] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (initialEmail) {
            setRequesterEmail(initialEmail);
        }
    }, [initialEmail]);

    useEffect(() => {
        if (defaultReceiver) {
            setRecipientEmail(defaultReceiver);
        }
    }, [defaultReceiver]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);
        setLoading(true);

        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterEmail,
                    recipientEmailOverride: recipientEmail,
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
        setNotes('');
        setIsEditingReceiver(false);
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl text-slate-800 dark:text-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-extrabold tracking-tight">Forgot Password</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Sends directly to Contact Messages & Admin (ID #1).
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

                {/* Editable Admin Receiver */}
                <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Request Receiver (Admin #1)
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsEditingReceiver((prev) => !prev)}
                            className="text-[11px] font-bold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                        >
                            {isEditingReceiver ? 'Done' : 'Change Receiver'}
                        </button>
                    </div>

                    {isEditingReceiver ? (
                        <input
                            type="email"
                            required
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="aranjitarchita@gmail.com"
                            className="mt-2 w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                        />
                    ) : (
                        <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                            Aranjit Archita —{' '}
                            <span className="text-[#0284c7] dark:text-sky-400">{recipientEmail}</span>
                        </p>
                    )}
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

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">
                            Your Account Email
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
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-[#8DB600] hover:bg-lime-600 text-white text-sm font-extrabold transition cursor-pointer disabled:opacity-60"
                    >
                        {loading ? 'Sending Request...' : 'Send Reset Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}