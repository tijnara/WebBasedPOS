// src/components/landing/VoltAuthCard.jsx
import React, { useState, useEffect } from 'react';
import {
    Lock,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    Check,
    User,
    Phone,
    MapPin,
    Clock,
    Send,
    AlertCircle,
    X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function VoltAuthCard({
                                         activeCard = 'login', // 'login' | 'signup' | 'contact'
                                         onSwitchCard,
                                         onLogin,
                                         onDemoLogin,
                                         isDemoLoading = false,
                                         isLoggingIn = false,
                                         authError = null,
                                         pendingApprovalInfo = null,
                                         onDismissPending,
                                         onNotifyAdmin,
                                         onForgotPassword,
                                         onSignUp,
                                         regError = null,
                                         businessHours = '',
                                         physicalAddress = '',
                                         facebookLink = '',
                                         contactPrefill = null
                                     }) {
    // Login form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Staff Sign Up form state
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhoneDigits, setRegPhoneDigits] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [localRegError, setLocalRegError] = useState(null);
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Contact form state
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [contactLoading, setContactLoading] = useState(false);
    const [contactStatus, setContactStatus] = useState(null);

    // Volt interactive mascot state
    const [eyesClosed, setEyesClosed] = useState(false);
    const [celebrateEyes, setCelebrateEyes] = useState(false);
    const [voltMessage, setVoltMessage] = useState('Look at our pure Seaside water! 💧');

    useEffect(() => {
        if (contactPrefill) {
            setContactEmail(contactPrefill.email || '');
            setContactMessage(contactPrefill.message || '');
            setContactStatus(null);
        }
    }, [contactPrefill]);

    useEffect(() => {
        if (authError) {
            setCelebrateEyes(false);
            setVoltMessage('Oops! Double-check your login details! 💧');
        }
    }, [authError]);

    useEffect(() => {
        if (regError) {
            setVoltMessage('Hmm, could not register yet—check details below! 💧');
        }
    }, [regError]);

    const handleInputFocus = (type) => {
        setEyesClosed(true);
        if (type === 'password') {
            setVoltMessage('Eyes closed tight! Your password is safe with me! 🤫');
        } else {
            setVoltMessage('Showing off pure Seaside water while you type... 💧✨');
        }
    };

    const handleInputBlur = () => {
        setEyesClosed(false);
        setVoltMessage('Look at our pure Seaside water! 💧');
    };

    const handleTogglePassword = () => {
        setShowPassword((prev) => {
            const next = !prev;
            setVoltMessage(
                next
                    ? 'Password visible! Still not peeking! 🙈💧'
                    : 'Seaside vault locked tight! 💧'
            );
            return next;
        });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (isLoggingIn || isDemoLoading) return;

        setEyesClosed(false);
        setCelebrateEyes(true);
        setVoltMessage('Verifying credentials! Seaside Pure on deck! 💧');

        await onLogin?.({
            email: loginEmail,
            password: loginPassword
        });

        setTimeout(() => {
            setCelebrateEyes(false);
        }, 1800);
    };

    const handleDemoClick = () => {
        if (isLoggingIn || isDemoLoading) return;
        setLoginEmail('demo@gmail.com');
        setLoginPassword('demodemo');
        setVoltMessage('Demo credentials loaded! Ready to explore! 💧');
        onDemoLogin?.();
    };

    const sanitizePhDigits = (val) => {
        let digits = String(val || '').replace(/\D/g, '');
        if (digits.startsWith('63') && digits.length > 10) digits = digits.slice(2);
        if (digits.startsWith('0')) digits = digits.slice(1);
        return digits.slice(0, 10);
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setLocalRegError(null);

        if (!regName.trim() || !regEmail.trim() || !regPassword) {
            setLocalRegError('Full name, email, and password are required.');
            return;
        }
        if (!/^9\d{9}$/.test(regPhoneDigits)) {
            setLocalRegError('Please enter a valid 10-digit Philippine mobile number (+639XXXXXXXXX).');
            return;
        }
        if (regPassword.length < 6) {
            setLocalRegError('Password must be at least 6 characters.');
            return;
        }
        if (regPassword !== regConfirmPassword) {
            setLocalRegError('Passwords do not match.');
            return;
        }

        setIsSigningUp(true);
        setEyesClosed(false);
        setVoltMessage('Submitting your staff account for approval! 💧');

        try {
            const ok = await onSignUp?.({
                name: regName.trim(),
                email: regEmail.trim(),
                phone: `+63${regPhoneDigits}`,
                password: regPassword
            });
            if (ok) {
                setRegName('');
                setRegEmail('');
                setRegPhoneDigits('');
                setRegPassword('');
                setRegConfirmPassword('');
                setVoltMessage('Account submitted! Admin will review it soon! ✨');
            }
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!contactEmail.trim() || !contactMessage.trim()) return;
        setContactLoading(true);
        setContactStatus(null);

        try {
            const now = new Date();
            const manilaParts = new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
                .format(now)
                .replace(' ', 'T');
            const isoManila = new Date(`${manilaParts}+08:00`).toISOString();

            const { error } = await supabase.from('contact_messages').insert([
                {
                    email: contactEmail.trim().toLowerCase(),
                    message: contactMessage.trim(),
                    created_at: isoManila
                }
            ]);

            if (error) throw error;

            setContactStatus({
                type: 'success',
                text: 'Message sent! Our Seaside team will get back to you shortly.'
            });
            setContactMessage('');
            setVoltMessage('Message delivered to Seaside HQ! 💧📨');
        } catch (err) {
            setContactStatus({
                type: 'error',
                text: err?.message || 'Could not send message right now.'
            });
        } finally {
            setContactLoading(false);
        }
    };

    return (
        <div className="volt-login-root w-full flex justify-center items-center">
            <style jsx>{`
                @keyframes sippingBob {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    25% {
                        transform: translateY(-4px) rotate(-0.5deg);
                    }
                    50% {
                        transform: translateY(-1px) rotate(0deg);
                    }
                    70% {
                        transform: translateY(-6px) scale(1.01) rotate(0.5deg);
                    }
                    85% {
                        transform: translateY(-2px) scale(0.995);
                    }
                }
                .robot-sipping-bob {
                    animation: sippingBob 2.6s ease-in-out infinite;
                }

                @keyframes hydroFootLeft {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    25% {
                        transform: translateY(-4.5px) rotate(-5deg);
                    }
                    50% {
                        transform: translateY(2px) rotate(2.5deg);
                    }
                    75% {
                        transform: translateY(-2.5px) rotate(-2.5deg);
                    }
                }
                .robot-foot-left {
                    animation: hydroFootLeft 2.6s ease-in-out infinite;
                    transform-origin: top center;
                }

                @keyframes hydroFootRight {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    25% {
                        transform: translateY(2px) rotate(2.5deg);
                    }
                    50% {
                        transform: translateY(-5px) rotate(5deg);
                    }
                    75% {
                        transform: translateY(1px) rotate(-2.5deg);
                    }
                }
                .robot-foot-right {
                    animation: hydroFootRight 2.6s ease-in-out infinite;
                    transform-origin: top center;
                }

                @keyframes thrusterConePulse {
                    0%, 100% {
                        transform: scaleX(0.92) scaleY(0.92);
                        opacity: 0.78;
                    }
                    50% {
                        transform: scaleX(1.14) scaleY(1.16);
                        opacity: 1;
                    }
                }
                .thruster-cone {
                    animation: thrusterConePulse 1.45s ease-in-out infinite;
                    transform-origin: 38px 20px;
                }

                @keyframes thrusterBubbleDrift {
                    0% {
                        transform: translateY(0px) scale(0.75);
                        opacity: 0.9;
                    }
                    65% {
                        transform: translateY(13px) scale(1.08);
                        opacity: 0.7;
                    }
                    100% {
                        transform: translateY(22px) scale(0.5);
                        opacity: 0;
                    }
                }
                .thruster-bubble-a {
                    animation: thrusterBubbleDrift 2s ease-out infinite;
                }
                .thruster-bubble-b {
                    animation: thrusterBubbleDrift 2.4s ease-out infinite 0.55s;
                }
                .thruster-bubble-c {
                    animation: thrusterBubbleDrift 1.85s ease-out infinite 1.05s;
                }

                @keyframes peaceWave {
                    0%, 100% {
                        transform: rotate(-10deg) translateY(0px);
                    }
                    50% {
                        transform: rotate(-3deg) translateY(-2px);
                    }
                }
                .peace-hand-wave {
                    animation: peaceWave 2.4s ease-in-out infinite;
                    transform-origin: bottom center;
                }

                @keyframes naturalBlink {
                    0%, 92%, 100% {
                        transform: scaleY(1);
                    }
                    96% {
                        transform: scaleY(0.12);
                    }
                }
                .eye-blink {
                    animation: naturalBlink 4.2s infinite ease-in-out;
                    transform-origin: center;
                }

                .robot-eye {
                    width: 14px;
                    height: 13px;
                    border-radius: 9999px;
                    background: linear-gradient(145deg, #bef264 0%, #a3e635 45%, #4ade80 100%);
                    box-shadow: 0 0 14px rgba(163, 230, 53, 0.95), 0 0 24px rgba(74, 222, 128, 0.6), inset 0 1.5px 2.5px rgba(255, 255, 255, 0.95);
                    position: relative;
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .robot-eye::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 3px;
                    width: 4px;
                    height: 3px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.95);
                    box-shadow: 0 0 2px white;
                }
                .robot-eye.celebrate {
                    box-shadow: 0 0 25px #bef264, 0 0 35px #4ade80;
                }

                .eyes-closed .robot-eye {
                    height: 3px;
                    border-radius: 9999px;
                    transform: scaleY(0.25) scaleX(1.15) rotate(3deg);
                    box-shadow: 0 0 10px rgba(163, 230, 53, 0.8);
                    background: linear-gradient(90deg, #bef264 0%, #a3e635 50%, #4ade80 100%);
                }
                .eyes-closed .robot-eye::after {
                    opacity: 0;
                }

                @keyframes gulpExpansion {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.15;
                    }
                    65% {
                        transform: scale(1.05);
                        opacity: 0.25;
                    }
                    74% {
                        transform: scale(1.4) translateY(1px);
                        opacity: 0.85;
                    }
                    84% {
                        transform: scale(1.15);
                        opacity: 0.45;
                    }
                }
                .gulp-swallow {
                    animation: gulpExpansion 2.6s ease-out infinite;
                }

                @keyframes bottleDisplayHold {
                    0%, 100% {
                        transform: rotate(-2deg) translateY(0px);
                    }
                    50% {
                        transform: rotate(2deg) translateY(-3px);
                    }
                }
                .bottle-showcase-hold {
                    animation: bottleDisplayHold 2.6s ease-in-out infinite;
                    transform-origin: bottom center;
                }

                @keyframes riseBubbles {
                    0% {
                        transform: translateY(24px) scale(0.4);
                        opacity: 0;
                    }
                    30% {
                        opacity: 0.9;
                    }
                    70% {
                        opacity: 0.7;
                        transform: translateY(5px) scale(1.1) translateX(1px);
                    }
                    100% {
                        transform: translateY(-7px) scale(0.8) translateX(-1px);
                        opacity: 0;
                    }
                }
                .rising-bubble-1 {
                    animation: riseBubbles 1.9s infinite cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rising-bubble-2 {
                    animation: riseBubbles 2.4s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
                }
                .rising-bubble-3 {
                    animation: riseBubbles 2.1s infinite cubic-bezier(0.4, 0, 0.2, 1) 1.1s;
                }
                .rising-bubble-4 {
                    animation: riseBubbles 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.8s;
                }

                @keyframes waterSlosh {
                    0%, 100% {
                        transform: rotate(0deg) scaleY(1);
                    }
                    50% {
                        transform: rotate(-2deg) scaleY(1.05);
                    }
                }
                .water-surface-slosh {
                    animation: waterSlosh 2.6s ease-in-out infinite;
                }

                @keyframes bubbleFloat {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-3px);
                    }
                }
                .bubble-float {
                    animation: bubbleFloat 3.8s ease-in-out infinite 0.3s;
                }

                .dark-glass-card {
                    background: linear-gradient(180deg, rgba(16, 24, 40, 0.95) 0%, rgba(10, 16, 28, 0.98) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px -5px rgba(16, 185, 129, 0.08);
                }

                .btn-neon-glow {
                    background: linear-gradient(90deg, #84cc16 0%, #10b981 100%);
                    box-shadow: 0 10px 25px -4px rgba(132, 204, 22, 0.4), 0 4px 12px rgba(16, 185, 129, 0.3);
                    transition: all 0.2s ease-in-out;
                }
                .btn-neon-glow:hover:not(:disabled) {
                    box-shadow: 0 14px 30px -4px rgba(132, 204, 22, 0.55), 0 6px 16px rgba(16, 185, 129, 0.4);
                    transform: translateY(-1px);
                }
                .btn-neon-glow:active:not(:disabled) {
                    transform: translateY(1px);
                    box-shadow: 0 6px 16px -4px rgba(132, 204, 22, 0.4);
                }

                .speech-tail-dark {
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 6px solid #1e293b;
                }
                .speech-tail-dark-inner {
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 5px solid #0f172a;
                }
                .bottle-shimmer {
                    background: linear-gradient(
                            135deg,
                            rgba(255, 255, 255, 0.45) 0%,
                            rgba(125, 211, 252, 0.18) 40%,
                            rgba(56, 189, 248, 0.35) 100%
                    );
                }
            `}</style>

            <div className="w-full max-w-[385px] sm:max-w-[400px] flex flex-col items-center relative my-0 pb-10 z-10 mx-auto">
                {/* Speech Bubble */}
                <section
                    aria-label="Robot dialogue"
                    className="bubble-float flex flex-col items-center mb-1 z-30"
                >
                    <div className="bg-[#0f172a] border border-[#1e293b] shadow-lg shadow-black/40 px-3 py-1 rounded-full text-center flex items-center gap-2 max-w-[330px]">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shrink-0" />
                        <p className="text-[11.5px] font-semibold text-slate-200 tracking-tight leading-tight select-none">
                            {voltMessage}
                        </p>
                    </div>
                    <div className="relative flex justify-center -mt-[1px]">
                        <div className="speech-tail-dark" />
                        <div className="speech-tail-dark-inner absolute -top-[1px]" />
                    </div>
                </section>

                {/* Volt Robot Mascot Holding Full Seaside Bottle With Peace-Hand Spacing */}
                <div className="robot-sipping-bob relative flex items-center justify-center z-10 -mb-[20px]">
                    <div className="relative w-[100px] h-[78px] flex items-center justify-center">
                        {/* Robot Left Ear Bolt */}
                        <div className="absolute -left-2 top-[28px] w-2.5 h-3.5 bg-[#1e293b] border border-[#334155] rounded-l-md z-0 shadow-inner" />
                        {/* Robot Right Ear Bolt */}
                        <div className="absolute -right-2 top-[28px] w-2.5 h-3.5 bg-[#1e293b] border border-[#334155] rounded-r-md z-0 shadow-inner" />

                        {/* Head Outer Slate Frame */}
                        <div className="w-full h-full bg-[#131d2e] border-2 border-[#1e293b] rounded-[20px] p-1.5 flex items-center justify-center relative z-10 shadow-xl">
                            {/* Robot Screen / Face */}
                            <div className="w-full h-full bg-[#070b14] rounded-[15px] p-1.5 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 border border-[#1e293b]/70">
                                {/* Eyes Wrapper */}
                                <div
                                    className={`flex items-center justify-between w-[50px] mb-1 px-1 relative transition-all duration-300 ${
                                        eyesClosed ? 'eyes-closed' : ''
                                    }`}
                                >
                                    <div
                                        className={`robot-eye ${!eyesClosed ? 'eye-blink' : ''} ${
                                            celebrateEyes ? 'celebrate' : ''
                                        }`}
                                    />
                                    <div
                                        className={`robot-eye ${!eyesClosed ? 'eye-blink' : ''} ${
                                            celebrateEyes ? 'celebrate' : ''
                                        }`}
                                    />
                                </div>

                                {/* Robot Smiling Mouth */}
                                <div className="relative flex items-center justify-center w-6 h-2.5">
                                    <svg
                                        className="w-6 h-2.5 overflow-visible drop-shadow-[0_0_6px_rgba(163,230,53,0.9)]"
                                        fill="none"
                                        viewBox="0 0 24 12"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M3 3.5C6.5 10 17.5 10 21 3.5"
                                            stroke="#a3e635"
                                            strokeLinecap="round"
                                            strokeWidth="2.5"
                                        />
                                        <ellipse
                                            cx="16"
                                            cy="6.2"
                                            fill="#84cc16"
                                            rx="2.5"
                                            ry="2.2"
                                            stroke="#bef264"
                                            strokeWidth="0.8"
                                        />
                                    </svg>
                                    <div className="gulp-swallow absolute -bottom-1 right-1 w-3 h-2 rounded-full bg-lime-400/30 blur-[1px] pointer-events-none" />
                                </div>

                                {/* Blushing Cheeks */}
                                <div className="gulp-swallow absolute bottom-1.5 left-2.5 w-2 h-1.5 bg-lime-400/80 rounded-full blur-[0.6px]" />
                                <div className="gulp-swallow absolute bottom-1.5 right-2.5 w-2 h-1.5 bg-lime-400/80 rounded-full blur-[0.6px]" />
                            </div>
                        </div>
                    </div>

                    {/* FULL SEASIDE BOTTLE HELD UPRIGHT WITH SPACE MATCHING PEACE HAND */}
                    <div className="bottle-showcase-hold absolute -right-[54px] top-[14px] z-30 flex flex-col items-center select-none pointer-events-none">
                        <div className="relative flex flex-col items-center z-20">
                            <div className="w-3.5 h-1.5 bg-sky-200/95 border border-sky-300 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.75)]" />
                            <div className="w-3 h-1.5 bg-gradient-to-b from-sky-200/70 to-sky-400/55 border-x border-sky-300/60 relative overflow-hidden">
                                <div className="absolute inset-0 bg-lime-400/30 animate-pulse" />
                            </div>
                        </div>

                        <div className="relative w-9 h-[58px] rounded-xl bottle-shimmer border border-sky-300/50 backdrop-blur-sm shadow-[0_4px_18px_rgba(2,132,199,0.5)] flex flex-col items-center justify-center overflow-hidden">
                            <div className="water-surface-slosh absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-sky-500/70 via-sky-400/40 to-sky-300/25" />
                            <div className="rising-bubble-1 absolute bottom-1.5 left-2 w-1.5 h-1.5 rounded-full bg-white/85 border border-sky-200 shadow-sm" />
                            <div className="rising-bubble-2 absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm" />
                            <div className="rising-bubble-3 absolute bottom-2.5 left-3 w-1 h-1 rounded-full bg-white/75" />

                            <div className="relative z-10 w-full bg-[#0369a1]/95 py-1 px-0.5 border-y border-sky-300/70 flex flex-col items-center shadow-inner">
                                <span className="text-[7px] font-black tracking-tight leading-none text-[#a3e635] drop-shadow-[0_0_4px_rgba(163,230,53,0.85)]">
                                    SEASIDE
                                </span>
                                <span className="text-[4px] font-extrabold tracking-wider uppercase leading-none mt-0.5 text-[#bef264]">
                                    PURIFIED WATER
                                </span>
                            </div>
                        </div>

                        {/* Volt's Right Paw Holding Base of Bottle */}
                        <div className="absolute bottom-2 -left-2.5 z-20 flex items-center pointer-events-none">
                            <div className="w-3.5 h-5 bg-[#131d2e] border border-[#334155] rounded-l-lg flex flex-col justify-evenly py-0.5 px-0.5 shadow-md">
                                <div className="w-2 h-[2px] bg-[#38bdf8]/60 rounded" />
                                <div className="w-2 h-[2px] bg-[#38bdf8]/60 rounded" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Card Container with Volt's Peace Hand & Hydro-Thruster Boots Behind Card */}
                <div className="relative w-full z-20">
                    {/* Volt Left Peace-Sign Hand Behind Top-Left Edge of Card */}
                    <div
                        className="peace-hand-wave absolute -top-[44px] left-6 sm:left-9 z-10 pointer-events-none select-none"
                        data-purpose="robot-peace-hand"
                        aria-hidden="true"
                    >
                        <svg
                            width="44"
                            height="56"
                            viewBox="0 0 44 56"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <filter id="peaceLimeGlow" x="-40%" y="-40%" width="180%" height="180%">
                                    <feGaussianBlur stdDeviation="2.2" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <filter id="peaceCyanGlow" x="-40%" y="-40%" width="180%" height="180%">
                                    <feGaussianBlur stdDeviation="1.4" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Index Finger (Left V) */}
                            <path
                                d="M12.5 23L8.2 6.2C7.8 4.6 9.1 3.1 10.7 3.3C12.2 3.5 13.4 4.6 13.8 6.1L18.2 22"
                                fill="#131d2e"
                                stroke="#334155"
                                strokeWidth="2.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="10.8" cy="6.6" r="2.1" fill="#a3e635" filter="url(#peaceLimeGlow)" />
                            <rect x="9.5" y="13.5" width="4.4" height="2.2" rx="1.1" transform="rotate(-14 9.5 13.5)" fill="#38bdf8" filter="url(#peaceCyanGlow)" />

                            {/* Middle Finger (Right V) */}
                            <path
                                d="M23.5 22L28.5 5.5C29 3.9 30.8 3.1 32.3 3.7C33.8 4.3 34.5 6 33.9 7.6L28.8 23.5"
                                fill="#131d2e"
                                stroke="#334155"
                                strokeWidth="2.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="31.3" cy="6.2" r="2.1" fill="#a3e635" filter="url(#peaceLimeGlow)" />
                            <rect x="27.2" y="13.5" width="4.4" height="2.2" rx="1.1" transform="rotate(17 27.2 13.5)" fill="#38bdf8" filter="url(#peaceCyanGlow)" />

                            {/* Rounded Robot Palm */}
                            <rect
                                x="9"
                                y="19.5"
                                width="24"
                                height="19.5"
                                rx="9.5"
                                fill="#131d2e"
                                stroke="#334155"
                                strokeWidth="2.1"
                            />

                            {/* Left & Right Cyan Finger Slots on Palm */}
                            <rect x="13" y="24.5" width="7.5" height="3.2" rx="1.6" fill="#38bdf8" fillOpacity="0.85" filter="url(#peaceCyanGlow)" />
                            <rect x="13" y="30" width="7.5" height="3.2" rx="1.6" fill="#38bdf8" fillOpacity="0.7" filter="url(#peaceCyanGlow)" />

                            {/* Glowing Cyan Center Pill */}
                            <ellipse cx="26.5" cy="28" rx="4.2" ry="2.8" fill="#38bdf8" filter="url(#peaceCyanGlow)" />

                            {/* Wrist / Cuff Tucked Behind Card */}
                            <rect
                                x="12.5"
                                y="39.5"
                                width="17"
                                height="10.5"
                                rx="4"
                                fill="#0f172a"
                                stroke="#334155"
                                strokeWidth="2"
                            />
                            <rect x="16" y="43.5" width="10" height="2.6" rx="1.3" fill="#a3e635" filter="url(#peaceLimeGlow)" />
                        </svg>
                    </div>

                    {/* Left Hydro-Thruster Boot Peeking Out Behind Bottom-Left of Login Card */}
                    <div className="robot-foot-left absolute -bottom-7 left-10 sm:left-12 z-10 pointer-events-none flex flex-col items-center">
                        <svg
                            width="76"
                            height="44"
                            viewBox="0 0 76 44"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="overflow-visible drop-shadow-[0_6px_14px_rgba(56,189,248,0.35)]"
                            aria-hidden="true"
                        >
                            <defs>
                                <linearGradient id="leftHydroOuter" x1="38" y1="15" x2="38" y2="40" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.82" />
                                    <stop offset="65%" stopColor="#22d3ee" stopOpacity="0.28" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="leftHydroCore" x1="38" y1="15" x2="38" y2="30" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#bef264" stopOpacity="0.9" />
                                    <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.65" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Ankle Strut & Glowing Cyan Joint */}
                            <rect x="31" y="0" width="14" height="9.5" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1.6" />
                            <circle cx="38" cy="4.8" r="2.9" fill="#38bdf8" />
                            <circle cx="38" cy="4.8" r="1.2" fill="#e0f2fe" />

                            {/* Side Hydro-Stabilizer Fins */}
                            <path d="M12 12L17.5 10V17L12 15.5V12Z" fill="#0f172a" stroke="#334155" strokeWidth="1.4" />
                            <path d="M64 12L58.5 10V17L64 15.5V12Z" fill="#0f172a" stroke="#334155" strokeWidth="1.4" />

                            {/* Main Hydro-Thruster Boot Housing */}
                            <rect x="16.5" y="8.5" width="43" height="9.5" rx="4.75" fill="#131d2e" stroke="#38bdf8" strokeWidth="1.5" />
                            <rect x="19.5" y="11.3" width="7.5" height="4" rx="2" fill="#38bdf8" />
                            <rect x="29" y="11" width="18" height="4.5" rx="2.25" fill="#a3e635" />
                            <rect x="49" y="11.3" width="7.5" height="4" rx="2" fill="#38bdf8" />

                            {/* Bottom Nozzle Collar */}
                            <rect x="27.5" y="17.5" width="21" height="2.8" rx="1.4" fill="#0f172a" stroke="#38bdf8" strokeOpacity="0.7" strokeWidth="1" />

                            {/* Hydro-Thruster Plume */}
                            <polygon points="27,20.3 49,20.3 45.5,38 30.5,38" fill="url(#leftHydroOuter)" className="thruster-cone" />
                            <polygon points="32.5,20.3 43.5,20.3 41,30 35,30" fill="url(#leftHydroCore)" className="thruster-cone" />

                            {/* Animated Water Bubbles */}
                            <circle cx="21" cy="23" r="2.5" stroke="#7dd3fc" strokeOpacity="0.85" strokeWidth="1.15" className="thruster-bubble-a" />
                            <circle cx="55" cy="23.5" r="2.7" stroke="#7dd3fc" strokeOpacity="0.8" strokeWidth="1.15" className="thruster-bubble-b" />
                            <circle cx="25.5" cy="30" r="2" stroke="#a5f3fc" strokeOpacity="0.75" strokeWidth="1.1" className="thruster-bubble-c" />
                            <circle cx="50.5" cy="30.5" r="2.1" stroke="#a5f3fc" strokeOpacity="0.75" strokeWidth="1.1" className="thruster-bubble-a" />
                        </svg>
                    </div>

                    {/* Right Hydro-Thruster Boot Peeking Out Behind Bottom-Right of Login Card */}
                    <div className="robot-foot-right absolute -bottom-7 right-10 sm:right-12 z-10 pointer-events-none flex flex-col items-center">
                        <svg
                            width="76"
                            height="44"
                            viewBox="0 0 76 44"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="overflow-visible drop-shadow-[0_6px_14px_rgba(56,189,248,0.35)]"
                            aria-hidden="true"
                        >
                            <defs>
                                <linearGradient id="rightHydroOuter" x1="38" y1="15" x2="38" y2="40" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.82" />
                                    <stop offset="65%" stopColor="#22d3ee" stopOpacity="0.28" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="rightHydroCore" x1="38" y1="15" x2="38" y2="30" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#bef264" stopOpacity="0.9" />
                                    <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.65" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Ankle Strut & Glowing Cyan Joint */}
                            <rect x="31" y="0" width="14" height="9.5" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1.6" />
                            <circle cx="38" cy="4.8" r="2.9" fill="#38bdf8" />
                            <circle cx="38" cy="4.8" r="1.2" fill="#e0f2fe" />

                            {/* Side Hydro-Stabilizer Fins */}
                            <path d="M12 12L17.5 10V17L12 15.5V12Z" fill="#0f172a" stroke="#334155" strokeWidth="1.4" />
                            <path d="M64 12L58.5 10V17L64 15.5V12Z" fill="#0f172a" stroke="#334155" strokeWidth="1.4" />

                            {/* Main Hydro-Thruster Boot Housing */}
                            <rect x="16.5" y="8.5" width="43" height="9.5" rx="4.75" fill="#131d2e" stroke="#38bdf8" strokeWidth="1.5" />
                            <rect x="19.5" y="11.3" width="7.5" height="4" rx="2" fill="#a3e635" />
                            <rect x="29" y="11" width="18" height="4.5" rx="2.25" fill="#a3e635" />
                            <rect x="49" y="11.3" width="7.5" height="4" rx="2" fill="#38bdf8" />

                            {/* Bottom Nozzle Collar */}
                            <rect x="27.5" y="17.5" width="21" height="2.8" rx="1.4" fill="#0f172a" stroke="#38bdf8" strokeOpacity="0.7" strokeWidth="1" />

                            {/* Hydro-Thruster Plume */}
                            <polygon points="27,20.3 49,20.3 45.5,38 30.5,38" fill="url(#rightHydroOuter)" className="thruster-cone" />
                            <polygon points="32.5,20.3 43.5,20.3 41,30 35,30" fill="url(#rightHydroCore)" className="thruster-cone" />

                            {/* Animated Water Bubbles */}
                            <circle cx="20.5" cy="23.5" r="2.6" stroke="#7dd3fc" strokeOpacity="0.85" strokeWidth="1.15" className="thruster-bubble-b" />
                            <circle cx="55.5" cy="23" r="2.4" stroke="#7dd3fc" strokeOpacity="0.8" strokeWidth="1.15" className="thruster-bubble-a" />
                            <circle cx="25" cy="30.5" r="2.1" stroke="#a5f3fc" strokeOpacity="0.75" strokeWidth="1.1" className="thruster-bubble-c" />
                            <circle cx="51" cy="30" r="2" stroke="#a5f3fc" strokeOpacity="0.75" strokeWidth="1.1" className="thruster-bubble-b" />
                        </svg>
                    </div>

                    <section className="w-full dark-glass-card rounded-[26px] p-4 sm:px-6 sm:py-4 relative z-20 backdrop-blur-xl text-slate-100">
                        {/* Top Segmented Pill Toggle (Sign In / Staff Sign Up) */}
                        {activeCard !== 'contact' ? (
                            <div className="w-full bg-[#0a101d] border border-white/5 p-1 rounded-2xl flex items-center mb-3">
                                <button
                                    type="button"
                                    onClick={() => onSwitchCard?.('login')}
                                    className={`w-1/2 py-1.5 px-3 rounded-xl text-[12.5px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        activeCard === 'login'
                                            ? 'bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/40 text-white font-bold shadow-inner'
                                            : 'text-slate-400 hover:text-slate-200 font-semibold'
                                    }`}
                                >
                                    <Lock className="w-3.5 h-3.5 text-lime-400" />
                                    <span>Sign In</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSwitchCard?.('signup')}
                                    className={`w-1/2 py-1.5 px-3 rounded-xl text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        activeCard === 'signup'
                                            ? 'bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/40 text-white font-bold shadow-inner'
                                            : 'text-slate-400 hover:text-slate-200 font-semibold'
                                    }`}
                                >
                                    <span className="text-lime-400 text-sm font-bold leading-none">+</span>
                                    <span>Staff Sign Up</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-lime-400">
                                    Contact Seaside Station
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onSwitchCard?.('login')}
                                    className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-[#0a101d] border border-slate-800 cursor-pointer"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        )}

                        {/* ==================== SIGN IN VIEW ==================== */}
                        {activeCard === 'login' && (
                            <>
                                <div className="text-center mb-3">
                                    <h1 className="text-[24px] sm:text-[26px] font-extrabold text-white tracking-tight leading-tight">
                                        Welcome Back
                                    </h1>
                                    <p className="text-[12.5px] text-slate-400 mt-0.5 font-medium">
                                        Log in to your Seaside dashboard.
                                    </p>
                                </div>

                                {/* Pending Admin Approval Notice */}
                                {pendingApprovalInfo && (
                                    <div className="mb-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-extrabold text-amber-300">
                                                {pendingApprovalInfo.title}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={onDismissPending}
                                                className="text-amber-300/70 hover:text-amber-200 cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-amber-100/90 leading-snug">
                                            {pendingApprovalInfo.message}
                                        </p>
                                        {onNotifyAdmin && (
                                            <button
                                                type="button"
                                                onClick={onNotifyAdmin}
                                                className="text-[11px] font-extrabold text-lime-400 hover:underline cursor-pointer"
                                            >
                                                Follow up with Admin →
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Auth Error Banner */}
                                {authError && (
                                    <div
                                        role="alert"
                                        className="mb-3 px-3 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                        <span>{authError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                                    <div>
                                        <label
                                            htmlFor="volt-email"
                                            className="block text-[10.5px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1"
                                        >
                                            USERNAME OR EMAIL
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-lime-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <input
                                                id="volt-email"
                                                type="text"
                                                required
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                onFocus={() => handleInputFocus('email')}
                                                onBlur={handleInputBlur}
                                                placeholder="name@seaside.com"
                                                className="w-full pl-10 pr-4 py-2 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-[13px] focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-200 shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1 px-1">
                                            <label
                                                htmlFor="volt-password"
                                                className="block text-[10.5px] font-bold text-slate-300 uppercase tracking-wider"
                                            >
                                                PASSWORD
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => onForgotPassword?.(loginEmail)}
                                                className="text-[11px] font-bold text-lime-400 hover:text-lime-300 transition-colors cursor-pointer"
                                            >
                                                Forgot?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <input
                                                id="volt-password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                onFocus={() => handleInputFocus('password')}
                                                onBlur={handleInputBlur}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-11 py-2 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-[13px] tracking-wide focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-200 shadow-inner"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleTogglePassword}
                                                aria-label="Toggle password visibility"
                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <button
                                            type="submit"
                                            disabled={isLoggingIn || isDemoLoading}
                                            className="w-full py-2.5 px-4 btn-neon-glow text-slate-950 font-black text-[14px] rounded-2xl flex items-center justify-center gap-2 cursor-pointer select-none disabled:opacity-60"
                                        >
                                            {isLoggingIn ? (
                                                <>
                                                    <span>Signing In...</span>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Sign In</span>
                                                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-[12px] text-slate-400 font-medium">
                                            New Seaside staff?{' '}
                                            <button
                                                type="button"
                                                onClick={() => onSwitchCard?.('signup')}
                                                className="font-bold text-lime-400 hover:text-lime-300 underline underline-offset-2 decoration-lime-400/50 cursor-pointer"
                                            >
                                                Register an account
                                            </button>
                                        </p>
                                    </div>

                                    <div className="relative flex items-center justify-center my-1.5">
                                        <div className="border-t border-slate-800 w-full" />
                                        <span className="bg-[#0c1424] px-2.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase rounded-full border border-slate-800">
                                            OR
                                        </span>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            disabled={isDemoLoading || isLoggingIn}
                                            onClick={handleDemoClick}
                                            className="w-full py-2 px-4 bg-[#0a101d] hover:bg-[#111a2d] border border-slate-800 hover:border-slate-700 text-white font-bold text-[13px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer disabled:opacity-60"
                                        >
                                            <span className="text-lime-400 text-base leading-none font-bold">+</span>
                                            <span>
                                                {isDemoLoading ? 'Loading Demo...' : 'Try Demo Version'}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* ==================== STAFF SIGN UP VIEW ==================== */}
                        {activeCard === 'signup' && (
                            <>
                                <div className="text-center mb-3">
                                    <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
                                        Staff Registration
                                    </h2>
                                    <p className="text-[12px] text-slate-400 mt-0.5 font-medium">
                                        Create a Seaside staff account for Admin approval.
                                    </p>
                                </div>

                                {(localRegError || regError) && (
                                    <div className="mb-2.5 px-3 py-1.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                        <span>{localRegError || regError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSignUpSubmit} className="space-y-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                                            FULL NAME
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-lime-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={regName}
                                                onChange={(e) => setRegName(e.target.value)}
                                                onFocus={() => handleInputFocus('name')}
                                                onBlur={handleInputBlur}
                                                placeholder="Juan Dela Cruz"
                                                className="w-full pl-10 pr-4 py-1.5 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-[12.5px] focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                                            EMAIL ADDRESS
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-lime-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                                onFocus={() => handleInputFocus('email')}
                                                onBlur={handleInputBlur}
                                                placeholder="staff@seaside.com"
                                                className="w-full pl-10 pr-4 py-1.5 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-[12.5px] focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                                            PHONE NUMBER (+63)
                                        </label>
                                        <div className="flex items-center bg-[#080e1b] border border-[#1e293b] rounded-2xl overflow-hidden focus-within:border-lime-400 focus-within:ring-1 focus-within:ring-lime-400">
                                            <span className="px-3 py-1.5 text-xs font-extrabold text-lime-400 bg-[#0d1628] border-r border-[#1e293b] select-none flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                +63
                                            </span>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                required
                                                value={regPhoneDigits}
                                                onChange={(e) =>
                                                    setRegPhoneDigits(sanitizePhDigits(e.target.value))
                                                }
                                                onFocus={() => handleInputFocus('phone')}
                                                onBlur={handleInputBlur}
                                                placeholder="9171234567"
                                                className="w-full px-3 py-1.5 bg-transparent text-slate-100 placeholder-slate-500 text-[12.5px] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                                                PASSWORD
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showRegPassword ? 'text' : 'password'}
                                                    required
                                                    value={regPassword}
                                                    onChange={(e) => setRegPassword(e.target.value)}
                                                    onFocus={() => handleInputFocus('password')}
                                                    onBlur={handleInputBlur}
                                                    placeholder="••••••••"
                                                    className="w-full pl-3.5 pr-9 py-1.5 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-[12.5px] focus:outline-none focus:border-lime-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegPassword((p) => !p)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                                                >
                                                    {showRegPassword ? (
                                                        <EyeOff className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Eye className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                                                CONFIRM
                                            </label>
                                            <input
                                                type={showRegPassword ? 'text' : 'password'}
                                                required
                                                value={regConfirmPassword}
                                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                                onFocus={() => handleInputFocus('password')}
                                                onBlur={handleInputBlur}
                                                placeholder="••••••••"
                                                className="w-full px-3.5 py-1.5 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-[12.5px] focus:outline-none focus:border-lime-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <button
                                            type="submit"
                                            disabled={isSigningUp}
                                            className="w-full py-2.5 px-4 btn-neon-glow text-slate-950 font-black text-[13.5px] rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                        >
                                            {isSigningUp ? (
                                                <>
                                                    <span>Submitting...</span>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Submit Staff Account</span>
                                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* ==================== CONTACT VIEW ==================== */}
                        {activeCard === 'contact' && (
                            <div className="space-y-2.5">
                                <div>
                                    <h2 className="text-[21px] font-extrabold text-white tracking-tight">
                                        Get in Touch
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Send a message directly to Seaside administration.
                                    </p>
                                </div>

                                <div className="p-2.5 rounded-2xl bg-[#080e1b] border border-[#1e293b] space-y-1 text-xs text-slate-300">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                                        <span>{physicalAddress}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                        <span className="whitespace-pre-line">{businessHours}</span>
                                    </div>
                                    {facebookLink && (
                                        <a
                                            href={facebookLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block text-lime-400 font-bold hover:underline"
                                        >
                                            Visit Official Facebook Page →
                                        </a>
                                    )}
                                </div>

                                {contactStatus && (
                                    <div
                                        className={`px-3 py-1.5 rounded-2xl text-xs font-bold ${
                                            contactStatus.type === 'success'
                                                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200'
                                                : 'bg-rose-500/15 border border-rose-500/40 text-rose-200'
                                        }`}
                                    >
                                        {contactStatus.text}
                                    </div>
                                )}

                                <form onSubmit={handleContactSubmit} className="space-y-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                                            YOUR EMAIL
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            onFocus={() => handleInputFocus('email')}
                                            onBlur={handleInputBlur}
                                            placeholder="you@example.com"
                                            className="w-full px-3.5 py-1.5 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-lime-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                                            MESSAGE
                                        </label>
                                        <textarea
                                            rows={2}
                                            required
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            onFocus={() => handleInputFocus('message')}
                                            onBlur={handleInputBlur}
                                            placeholder="How can we help you?"
                                            className="w-full px-3.5 py-1.5 bg-[#080e1b] border border-[#1e293b] rounded-2xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-lime-400"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={contactLoading}
                                        className="w-full py-2.5 px-4 btn-neon-glow text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                    >
                                        <Send className="w-4 h-4" />
                                        <span>{contactLoading ? 'Sending...' : 'Send Message'}</span>
                                    </button>
                                </form>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}