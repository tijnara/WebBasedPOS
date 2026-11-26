// src/components/landing/VoltAuthCard.jsx
import React, { useState, useEffect, useRef } from 'react';
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
                                         contactPrefill = null,
                                         isDarkMode: isDarkModeProp,
                                         darkMode,
                                         theme
                                     }) {
    const rootRef = useRef(null);

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

    // Detect Day vs Night mode strictly for the Login/Sign-Up/Contact Form Card
    const explicitDarkProp =
        typeof isDarkModeProp === 'boolean'
            ? isDarkModeProp
            : typeof darkMode === 'boolean'
                ? darkMode
                : theme === 'dark'
                    ? true
                    : theme === 'light' || theme === 'day'
                        ? false
                        : undefined;

    const [detectedDark, setDetectedDark] = useState(true);

    useEffect(() => {
        if (typeof explicitDarkProp === 'boolean') {
            setDetectedDark(explicitDarkProp);
            return;
        }
        if (typeof window === 'undefined') return;

        const parseLuminance = (colorStr) => {
            if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
                return null;
            }
            const nums = colorStr.match(/[\d.]+/g);
            if (!nums || nums.length < 3) return null;
            const r = Number(nums[0]);
            const g = Number(nums[1]);
            const b = Number(nums[2]);
            const a = nums.length >= 4 ? Number(nums[3]) : 1;
            if (a < 0.15) return null;
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        };

        const checkTheme = () => {
            // 1. Check header sun/moon toggle icon on the landing page:
            // In Day Mode, the toggle button renders the Moon icon (.lucide-moon); in Night Mode, Sun (.lucide-sun).
            const hasMoonToggle = document.querySelector('button svg.lucide-moon, svg.lucide-moon');
            const hasSunToggle = document.querySelector('button svg.lucide-sun, svg.lucide-sun');
            if (hasMoonToggle && !hasSunToggle) {
                setDetectedDark(false);
                return;
            }
            if (hasSunToggle && !hasMoonToggle) {
                setDetectedDark(true);
                return;
            }

            // 2. Check common localStorage theme keys
            try {
                for (const key of [
                    'theme',
                    'seaside-theme',
                    'seaside_theme',
                    'landing-theme',
                    'color-theme',
                    'darkMode',
                    'isDarkMode'
                ]) {
                    const val = localStorage.getItem(key);
                    if (val === 'light' || val === 'day' || val === 'false') {
                        setDetectedDark(false);
                        return;
                    }
                    if (val === 'dark' || val === 'night' || val === 'true') {
                        setDetectedDark(true);
                        return;
                    }
                }
            } catch {
                // Ignore storage errors
            }

            // 3. Walk up ancestor wrappers above VoltAuthCard (excluding body/html defaults)
            let el = rootRef.current?.parentElement;
            while (el && el !== document.body && el !== document.documentElement) {
                const dt = el.getAttribute('data-theme') || el.getAttribute('data-mode');
                if (dt === 'light' || dt === 'day' || el.classList.contains('light')) {
                    setDetectedDark(false);
                    return;
                }
                if (dt === 'dark' || dt === 'night' || el.classList.contains('dark')) {
                    setDetectedDark(true);
                    return;
                }

                const style = window.getComputedStyle(el);
                const lum = parseLuminance(style.backgroundColor);
                if (lum !== null) {
                    setDetectedDark(lum < 0.55);
                    return;
                }

                const bgImg = style.backgroundImage;
                if (bgImg && bgImg !== 'none') {
                    const rgbMatches = [...bgImg.matchAll(/rgba?\(([^)]+)\)/g)];
                    if (rgbMatches.length > 0) {
                        const lums = rgbMatches
                            .map((m) => parseLuminance(`rgb(${m[1]})`))
                            .filter((v) => v !== null);
                        if (lums.length > 0) {
                            const avgLum = lums.reduce((a, b) => a + b, 0) / lums.length;
                            setDetectedDark(avgLum < 0.55);
                            return;
                        }
                    }
                }

                el = el.parentElement;
            }

            // 4. Fallback to html/body attributes
            const html = document.documentElement;
            const body = document.body;
            if (
                html.getAttribute('data-theme') === 'light' ||
                body?.getAttribute('data-theme') === 'light' ||
                html.classList.contains('light') ||
                body?.classList.contains('light')
            ) {
                setDetectedDark(false);
                return;
            }
            if (
                html.getAttribute('data-theme') === 'dark' ||
                body?.getAttribute('data-theme') === 'dark' ||
                html.classList.contains('dark') ||
                body?.classList.contains('dark')
            ) {
                setDetectedDark(true);
            }
        };

        checkTheme();

        const observer = new MutationObserver(() => {
            requestAnimationFrame(checkTheme);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class', 'data-theme', 'data-mode', 'style']
        });

        const handleClick = () => setTimeout(checkTheme, 30);
        window.addEventListener('click', handleClick);
        window.addEventListener('storage', checkTheme);

        return () => {
            observer.disconnect();
            window.removeEventListener('click', handleClick);
            window.removeEventListener('storage', checkTheme);
        };
    }, [explicitDarkProp]);

    const isDark = typeof explicitDarkProp === 'boolean' ? explicitDarkProp : detectedDark;

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

    // Adaptive classes ONLY for the Login / Sign-Up / Contact Form Card
    const labelClass = isDark ? 'text-slate-300' : 'text-slate-600';

    const inputClass = isDark
        ? 'bg-[#080e1b] border-[#1e293b] text-slate-100 placeholder-slate-500 focus:border-lime-400 focus:ring-lime-400 shadow-inner'
        : 'bg-white/95 border-emerald-900/15 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/30 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]';

    const iconAccentClass = isDark ? 'text-lime-400' : 'text-emerald-600';

    return (
        <div ref={rootRef} className="volt-login-root w-full flex justify-center items-center">
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
                        transform: translateY(-5px) rotate(-5deg);
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
                        transform: translateY(-5.5px) rotate(5deg);
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
                        transform: scaleX(0.9) scaleY(0.88);
                        opacity: 0.78;
                    }
                    45% {
                        transform: scaleX(1.24) scaleY(1.24);
                        opacity: 1;
                    }
                    75% {
                        transform: scaleX(1.08) scaleY(1.05);
                        opacity: 0.9;
                    }
                }
                .thruster-cone {
                    animation: thrusterConePulse 1.15s ease-in-out infinite;
                    transform-origin: 41px 21px;
                }

                @keyframes boosterWaveRing {
                    0% {
                        transform: translateY(0px) scaleX(0.75);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateY(22px) scaleX(1.45);
                        opacity: 0;
                    }
                }
                .booster-ring-1 {
                    animation: boosterWaveRing 1.2s ease-out infinite;
                    transform-origin: 41px 24px;
                }
                .booster-ring-2 {
                    animation: boosterWaveRing 1.2s ease-out infinite 0.6s;
                    transform-origin: 41px 24px;
                }

                @keyframes thrusterBubbleDrift {
                    0% {
                        transform: translateY(0px) scale(0.75);
                        opacity: 0.95;
                    }
                    65% {
                        transform: translateY(15px) scale(1.15);
                        opacity: 0.75;
                    }
                    100% {
                        transform: translateY(26px) scale(0.45);
                        opacity: 0;
                    }
                }
                .thruster-bubble-a {
                    animation: thrusterBubbleDrift 1.45s ease-out infinite;
                }
                .thruster-bubble-b {
                    animation: thrusterBubbleDrift 1.75s ease-out infinite 0.4s;
                }
                .thruster-bubble-c {
                    animation: thrusterBubbleDrift 1.35s ease-out infinite 0.8s;
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

                /* Metallic Glossy Apple Green Chassis Finishes (Unchanged Across Day/Night) */
                .apple-metal-head {
                    background: linear-gradient(
                            155deg,
                            #f7fee7 0%,
                            #bef264 16%,
                            #84cc16 46%,
                            #4d7c0f 80%,
                            #365314 100%
                    );
                    border: 1.8px solid #d9f99d;
                    box-shadow:
                            0 10px 24px rgba(54, 83, 20, 0.45),
                            0 0 18px rgba(132, 204, 22, 0.35),
                            inset 0 2px 3px rgba(255, 255, 255, 0.88),
                            inset 0 -3px 6px rgba(26, 46, 5, 0.65);
                }

                .apple-metal-bolt {
                    background: linear-gradient(180deg, #ecfccb 0%, #84cc16 48%, #3f6212 100%);
                    border: 1px solid #bef264;
                    box-shadow:
                            inset 0 1px 1.5px rgba(255, 255, 255, 0.85),
                            0 2px 6px rgba(0, 0, 0, 0.35);
                }

                .apple-metal-paw {
                    background: linear-gradient(145deg, #ecfccb 0%, #a3e635 30%, #65a30d 72%, #365314 100%);
                    border: 1px solid #d9f99d;
                    box-shadow:
                            inset 0 1.5px 2px rgba(255, 255, 255, 0.85),
                            inset 0 -1.5px 2px rgba(26, 46, 5, 0.6),
                            0 3px 8px rgba(0, 0, 0, 0.4);
                }

                /* Subtle Periodic Diagonal Specular Shimmer Across Metallic Armor */
                @keyframes armorShimmerSweep {
                    0%, 66% {
                        transform: translateX(-175%) skewX(-24deg);
                        opacity: 0;
                    }
                    72% {
                        opacity: 0.9;
                    }
                    88% {
                        transform: translateX(250%) skewX(-24deg);
                        opacity: 0.85;
                    }
                    92%, 100% {
                        transform: translateX(275%) skewX(-24deg);
                        opacity: 0;
                    }
                }

                .apple-shimmer-surface {
                    position: relative;
                    overflow: hidden;
                }
                .apple-shimmer-surface::after {
                    content: '';
                    position: absolute;
                    top: -25%;
                    bottom: -25%;
                    left: 0;
                    width: 44%;
                    background: linear-gradient(
                            90deg,
                            rgba(255, 255, 255, 0) 0%,
                            rgba(236, 252, 203, 0.28) 28%,
                            rgba(255, 255, 255, 0.72) 50%,
                            rgba(236, 252, 203, 0.28) 72%,
                            rgba(255, 255, 255, 0) 100%
                    );
                    pointer-events: none;
                    z-index: 15;
                    animation: armorShimmerSweep 5.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .shimmer-delay-head::after {
                    animation-delay: 0.15s;
                }
                .shimmer-delay-right::after {
                    animation-delay: 0.4s;
                }

                @keyframes svgArmorShimmer {
                    0%, 66% {
                        transform: translateX(-55px) skewX(-24deg);
                        opacity: 0;
                    }
                    72% {
                        opacity: 0.85;
                    }
                    88% {
                        transform: translateX(95px) skewX(-24deg);
                        opacity: 0.8;
                    }
                    92%, 100% {
                        transform: translateX(105px) skewX(-24deg);
                        opacity: 0;
                    }
                }
                .svg-shimmer-band {
                    animation: svgArmorShimmer 5.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    pointer-events: none;
                }
                .svg-shimmer-peace {
                    animation-delay: 0s;
                }
                .svg-shimmer-boot-left {
                    animation-delay: 0.55s;
                }
                .svg-shimmer-boot-right {
                    animation-delay: 0.8s;
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

                /* Synced Showcase Float — Always Stays Above Top Edge of Card */
                @keyframes bottleFloatBob {
                    0%, 100% {
                        transform: translateY(0px) rotate(-2deg);
                    }
                    25% {
                        transform: translateY(-4px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-2px) rotate(2deg);
                    }
                    70% {
                        transform: translateY(-6px) rotate(1deg);
                    }
                    85% {
                        transform: translateY(-2px) rotate(-1deg);
                    }
                }
                .bottle-showcase-hold {
                    animation: bottleFloatBob 2.6s ease-in-out infinite;
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

                /* Night Mode Login Form Glass Card */
                .dark-glass-card {
                    background: linear-gradient(180deg, rgba(16, 24, 40, 0.95) 0%, rgba(10, 16, 28, 0.98) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px -5px rgba(16, 185, 129, 0.08);
                }

                /* Day Mode Login Form Frosted Water-Mint Glass Card */
                .day-glass-card {
                    background: linear-gradient(
                            180deg,
                            rgba(255, 255, 255, 0.88) 0%,
                            rgba(240, 253, 248, 0.93) 55%,
                            rgba(228, 248, 243, 0.96) 100%
                    );
                    border: 1.5px solid rgba(16, 185, 129, 0.24);
                    box-shadow:
                            0 22px 45px -12px rgba(14, 116, 144, 0.16),
                            0 8px 24px -6px rgba(16, 185, 129, 0.12),
                            inset 0 1.5px 2px rgba(255, 255, 255, 0.98);
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

            <div className="w-full max-w-[385px] sm:max-w-[400px] flex flex-col items-center relative my-0 pb-14 z-10 mx-auto">
                {/* Speech Bubble (Kept Identical Across Day & Night Mode) */}
                <section
                    aria-label="Robot dialogue"
                    className="bubble-float flex flex-col items-center mb-2.5 z-30"
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

                {/* Volt Robot Mascot (Kept 100% Identical Across Day & Night Mode) */}
                <div className="robot-sipping-bob relative flex items-center justify-center z-10 -mb-[20px]">
                    <div className="relative w-[100px] h-[78px] flex items-center justify-center">
                        {/* Robot Left Ear Bolt */}
                        <div className="apple-metal-bolt apple-shimmer-surface absolute -left-2 top-[28px] w-2.5 h-3.5 rounded-l-md z-0" />
                        {/* Robot Right Ear Bolt */}
                        <div className="apple-metal-bolt apple-shimmer-surface shimmer-delay-right absolute -right-2 top-[28px] w-2.5 h-3.5 rounded-r-md z-0" />

                        {/* Head Outer Metallic Glossy Apple Green Frame */}
                        <div className="apple-metal-head apple-shimmer-surface shimmer-delay-head w-full h-full rounded-[20px] p-[5px] flex items-center justify-center relative z-10">
                            <div className="absolute top-[2px] inset-x-3 h-[5px] rounded-full bg-gradient-to-b from-white/75 to-transparent pointer-events-none z-20" />

                            {/* Robot Screen / Visor */}
                            <div className="w-full h-full bg-[#070b14] rounded-[15px] p-1.5 flex flex-col items-center justify-center relative z-20 overflow-hidden transition-colors duration-300 border border-[#1a2e05]/80 shadow-inner">
                                <div className="absolute -top-3 -left-3 w-12 h-8 bg-white/5 rotate-[-18deg] rounded-full pointer-events-none" />

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
                </div>

                {/* Form Card Container with Unchanged Robot Parts & Adaptive Day/Night Login Form */}
                <div className="relative w-full z-20">
                    {/* FULL SEASIDE BOTTLE (Unchanged Across Day & Night Mode, No Arm Connector) */}
                    <div
                        className="bottle-showcase-hold absolute -top-[68px] left-[calc(50%+68px)] z-30 flex flex-col items-center select-none pointer-events-none"
                        data-purpose="seaside-bottle-showcase"
                        aria-hidden="true"
                    >
                        <div className="relative flex flex-col items-center z-20">
                            <div className="w-3.5 h-1.5 bg-sky-200/95 border border-sky-300 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.75)]" />
                            <div className="w-3 h-1.5 bg-gradient-to-b from-sky-200/70 to-sky-400/55 border-x border-sky-300/60 relative overflow-hidden">
                                <div className="absolute inset-0 bg-lime-400/30 animate-pulse" />
                            </div>
                        </div>

                        <div className="relative w-9 h-[58px] rounded-xl bottle-shimmer border border-sky-300/55 backdrop-blur-sm shadow-[0_4px_18px_rgba(2,132,199,0.5)] flex flex-col items-center justify-center overflow-hidden">
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

                        {/* Volt's Right Metallic Apple Green Paw Holding Base of Bottle */}
                        <div className="absolute bottom-2.5 -left-2.5 z-20 flex items-center pointer-events-none">
                            <div className="apple-metal-paw apple-shimmer-surface shimmer-delay-right w-3.5 h-5 rounded-l-lg flex flex-col justify-evenly py-0.5 px-0.5">
                                <div className="w-2 h-[2px] bg-[#0f172a]/75 rounded relative z-20" />
                                <div className="w-2 h-[2px] bg-[#38bdf8] shadow-[0_0_4px_#38bdf8] rounded relative z-20" />
                            </div>
                        </div>
                    </div>

                    {/* Volt Left Peace-Sign Hand Behind Top-Left Edge of Card (Unchanged) */}
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
                                <linearGradient id="appleMetalPalm" x1="9" y1="18" x2="33" y2="41" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#f7fee7" />
                                    <stop offset="22%" stopColor="#bef264" />
                                    <stop offset="55%" stopColor="#84cc16" />
                                    <stop offset="85%" stopColor="#4d7c0f" />
                                    <stop offset="100%" stopColor="#365314" />
                                </linearGradient>
                                <linearGradient id="appleMetalFinger" x1="8" y1="3" x2="34" y2="24" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#ecfccb" />
                                    <stop offset="35%" stopColor="#a3e635" />
                                    <stop offset="78%" stopColor="#65a30d" />
                                    <stop offset="100%" stopColor="#3f6212" />
                                </linearGradient>
                                <linearGradient id="appleMetalCuff" x1="12" y1="39" x2="30" y2="50" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#bef264" />
                                    <stop offset="50%" stopColor="#65a30d" />
                                    <stop offset="100%" stopColor="#29410b" />
                                </linearGradient>
                                <linearGradient id="peaceShimmerGrad" x1="0" y1="0" x2="16" y2="0" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.72" />
                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </linearGradient>
                                <clipPath id="peaceArmorClip">
                                    <path d="M12.5 23L8.2 6.2C7.8 4.6 9.1 3.1 10.7 3.3C12.2 3.5 13.4 4.6 13.8 6.1L18.2 22Z" />
                                    <path d="M23.5 22L28.5 5.5C29 3.9 30.8 3.1 32.3 3.7C33.8 4.3 34.5 6 33.9 7.6L28.8 23.5Z" />
                                    <rect x="9" y="19.5" width="24" height="19.5" rx="9.5" />
                                    <rect x="12.5" y="39.5" width="17" height="10.5" rx="4" />
                                </clipPath>
                                <filter id="peaceLimeGlow" x="-40%" y="-40%" width="180%" height="180%">
                                    <feGaussianBlur stdDeviation="1.8" result="blur" />
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

                            <path
                                d="M12.5 23L8.2 6.2C7.8 4.6 9.1 3.1 10.7 3.3C12.2 3.5 13.4 4.6 13.8 6.1L18.2 22"
                                fill="url(#appleMetalFinger)"
                                stroke="#365314"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="10.8" cy="6.6" r="2" fill="#ecfccb" filter="url(#peaceLimeGlow)" />
                            <rect x="9.5" y="13.5" width="4.4" height="2.2" rx="1.1" transform="rotate(-14 9.5 13.5)" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.7" />

                            <path
                                d="M23.5 22L28.5 5.5C29 3.9 30.8 3.1 32.3 3.7C33.8 4.3 34.5 6 33.9 7.6L28.8 23.5"
                                fill="url(#appleMetalFinger)"
                                stroke="#365314"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="31.3" cy="6.2" r="2" fill="#ecfccb" filter="url(#peaceLimeGlow)" />
                            <rect x="27.2" y="13.5" width="4.4" height="2.2" rx="1.1" transform="rotate(17 27.2 13.5)" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.7" />

                            <rect
                                x="9"
                                y="19.5"
                                width="24"
                                height="19.5"
                                rx="9.5"
                                fill="url(#appleMetalPalm)"
                                stroke="#365314"
                                strokeWidth="1.8"
                            />
                            <path d="M13.5 22.2C17.5 20.8 24.5 20.8 28.5 22.2" stroke="white" strokeOpacity="0.75" strokeWidth="1.4" strokeLinecap="round" />

                            <rect
                                x="12.5"
                                y="39.5"
                                width="17"
                                height="10.5"
                                rx="4"
                                fill="url(#appleMetalCuff)"
                                stroke="#365314"
                                strokeWidth="1.8"
                            />

                            <g clipPath="url(#peaceArmorClip)">
                                <rect
                                    x="0"
                                    y="-4"
                                    width="16"
                                    height="64"
                                    fill="url(#peaceShimmerGrad)"
                                    className="svg-shimmer-band svg-shimmer-peace"
                                />
                            </g>

                            <rect x="12.5" y="24.5" width="8" height="3.4" rx="1.7" fill="#0f172a" stroke="#365314" strokeWidth="0.8" />
                            <rect x="13.5" y="25.3" width="6" height="1.8" rx="0.9" fill="#38bdf8" filter="url(#peaceCyanGlow)" />

                            <rect x="12.5" y="30" width="8" height="3.4" rx="1.7" fill="#0f172a" stroke="#365314" strokeWidth="0.8" />
                            <rect x="13.5" y="30.8" width="6" height="1.8" rx="0.9" fill="#38bdf8" fillOpacity="0.85" filter="url(#peaceCyanGlow)" />

                            <ellipse cx="26.5" cy="28.5" rx="4.6" ry="3.2" fill="#0f172a" />
                            <ellipse cx="26.5" cy="28.5" rx="3.4" ry="2.1" fill="#38bdf8" filter="url(#peaceCyanGlow)" />

                            <rect x="15.5" y="43.2" width="11" height="3" rx="1.5" fill="#0f172a" />
                            <rect x="16.5" y="43.9" width="9" height="1.6" rx="0.8" fill="#38bdf8" filter="url(#peaceCyanGlow)" />
                        </svg>
                    </div>

                    {/* Left Hydro-Thruster Boot Behind Bottom-Left of Login Card (Unchanged) */}
                    <div className="robot-foot-left absolute -bottom-11 left-8 sm:left-10 z-10 pointer-events-none flex flex-col items-center">
                        <svg
                            width="82"
                            height="54"
                            viewBox="0 0 82 54"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="overflow-visible drop-shadow-[0_8px_20px_rgba(56,189,248,0.65)]"
                            aria-hidden="true"
                        >
                            <defs>
                                <linearGradient id="leftBootAppleBody" x1="17" y1="8" x2="65" y2="20" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#f7fee7" />
                                    <stop offset="22%" stopColor="#bef264" />
                                    <stop offset="55%" stopColor="#84cc16" />
                                    <stop offset="85%" stopColor="#4d7c0f" />
                                    <stop offset="100%" stopColor="#365314" />
                                </linearGradient>
                                <linearGradient id="leftBootAppleStrut" x1="34" y1="0" x2="48" y2="10" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#d9f99d" />
                                    <stop offset="50%" stopColor="#65a30d" />
                                    <stop offset="100%" stopColor="#365314" />
                                </linearGradient>
                                <linearGradient id="leftBootShimmerGrad" x1="0" y1="0" x2="18" y2="0" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </linearGradient>
                                <clipPath id="leftBootArmorClip">
                                    <rect x="34" y="0" width="14" height="10" rx="2.5" />
                                    <path d="M12 12.5L18.5 10.5V17.5L12 16V12.5Z" />
                                    <path d="M70 12.5L63.5 10.5V17.5L70 16V12.5Z" />
                                    <rect x="17.5" y="9" width="47" height="10" rx="5" />
                                </clipPath>
                                <linearGradient id="leftBoosterOuter" x1="41" y1="18" x2="41" y2="50" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                                    <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.48" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="leftBoosterCore" x1="41" y1="18" x2="41" y2="38" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#bef264" stopOpacity="1" />
                                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            <rect x="34" y="0" width="14" height="10" rx="2.5" fill="url(#leftBootAppleStrut)" stroke="#365314" strokeWidth="1.5" />
                            <path d="M12 12.5L18.5 10.5V17.5L12 16V12.5Z" fill="url(#leftBootAppleStrut)" stroke="#365314" strokeWidth="1.3" />
                            <path d="M70 12.5L63.5 10.5V17.5L70 16V12.5Z" fill="url(#leftBootAppleStrut)" stroke="#365314" strokeWidth="1.3" />
                            <rect x="17.5" y="9" width="47" height="10" rx="5" fill="url(#leftBootAppleBody)" stroke="#365314" strokeWidth="1.6" />
                            <path d="M22 10.7H60" stroke="white" strokeOpacity="0.78" strokeWidth="1.3" strokeLinecap="round" />

                            <g clipPath="url(#leftBootArmorClip)">
                                <rect
                                    x="0"
                                    y="-4"
                                    width="18"
                                    height="28"
                                    fill="url(#leftBootShimmerGrad)"
                                    className="svg-shimmer-band svg-shimmer-boot-left"
                                />
                            </g>

                            <circle cx="41" cy="5" r="3.4" fill="#0f172a" />
                            <circle cx="41" cy="5" r="2.4" fill="#38bdf8" />
                            <circle cx="41" cy="5" r="1" fill="#e0f2fe" />

                            <rect x="20" y="11.6" width="42" height="5" rx="2.5" fill="#0f172a" fillOpacity="0.88" />
                            <rect x="21.5" y="12.4" width="7.5" height="3.4" rx="1.7" fill="#38bdf8" />
                            <rect x="31" y="12.2" width="20" height="3.8" rx="1.9" fill="#bef264" />
                            <rect x="53" y="12.4" width="7.5" height="3.4" rx="1.7" fill="#38bdf8" />

                            <rect x="29.5" y="18.5" width="23" height="3.2" rx="1.6" fill="#1a2e05" stroke="#bef264" strokeOpacity="0.9" strokeWidth="1.1" />

                            <polygon points="27,21.7 55,21.7 51,48 31,48" fill="url(#leftBoosterOuter)" className="thruster-cone" />
                            <polygon points="33.5,21.7 48.5,21.7 45.5,37 36.5,37" fill="url(#leftBoosterCore)" className="thruster-cone" />

                            <ellipse cx="41" cy="25" rx="11" ry="2.2" stroke="#bef264" strokeOpacity="0.85" strokeWidth="1.2" className="booster-ring-1" />
                            <ellipse cx="41" cy="27" rx="13" ry="2.5" stroke="#38bdf8" strokeOpacity="0.8" strokeWidth="1.2" className="booster-ring-2" />

                            <circle cx="20" cy="24" r="3" stroke="#7dd3fc" strokeOpacity="0.95" strokeWidth="1.25" className="thruster-bubble-a" />
                            <circle cx="62" cy="24.5" r="3.2" stroke="#bef264" strokeOpacity="0.9" strokeWidth="1.25" className="thruster-bubble-b" />
                            <circle cx="25" cy="34" r="2.4" stroke="#a5f3fc" strokeOpacity="0.85" strokeWidth="1.15" className="thruster-bubble-c" />
                            <circle cx="57" cy="34.5" r="2.5" stroke="#a5f3fc" strokeOpacity="0.85" strokeWidth="1.15" className="thruster-bubble-a" />
                            <circle cx="16.5" cy="39" r="1.8" fill="#38bdf8" fillOpacity="0.8" className="thruster-bubble-b" />
                            <circle cx="65.5" cy="39" r="1.8" fill="#a3e635" fillOpacity="0.8" className="thruster-bubble-c" />
                        </svg>
                    </div>

                    {/* Right Hydro-Thruster Boot Behind Bottom-Right of Login Card (Unchanged) */}
                    <div className="robot-foot-right absolute -bottom-11 right-8 sm:right-10 z-10 pointer-events-none flex flex-col items-center">
                        <svg
                            width="82"
                            height="54"
                            viewBox="0 0 82 54"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="overflow-visible drop-shadow-[0_8px_20px_rgba(56,189,248,0.65)]"
                            aria-hidden="true"
                        >
                            <defs>
                                <linearGradient id="rightBootAppleBody" x1="17" y1="8" x2="65" y2="20" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#f7fee7" />
                                    <stop offset="22%" stopColor="#bef264" />
                                    <stop offset="55%" stopColor="#84cc16" />
                                    <stop offset="85%" stopColor="#4d7c0f" />
                                    <stop offset="100%" stopColor="#365314" />
                                </linearGradient>
                                <linearGradient id="rightBootAppleStrut" x1="34" y1="0" x2="48" y2="10" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#d9f99d" />
                                    <stop offset="50%" stopColor="#65a30d" />
                                    <stop offset="100%" stopColor="#365314" />
                                </linearGradient>
                                <linearGradient id="rightBootShimmerGrad" x1="0" y1="0" x2="18" y2="0" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </linearGradient>
                                <clipPath id="rightBootArmorClip">
                                    <rect x="34" y="0" width="14" height="10" rx="2.5" />
                                    <path d="M12 12.5L18.5 10.5V17.5L12 16V12.5Z" />
                                    <path d="M70 12.5L63.5 10.5V17.5L70 16V12.5Z" />
                                    <rect x="17.5" y="9" width="47" height="10" rx="5" />
                                </clipPath>
                                <linearGradient id="rightBoosterOuter" x1="41" y1="18" x2="41" y2="50" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                                    <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.48" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="rightBoosterCore" x1="41" y1="18" x2="41" y2="38" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#bef264" stopOpacity="1" />
                                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            <rect x="34" y="0" width="14" height="10" rx="2.5" fill="url(#rightBootAppleStrut)" stroke="#365314" strokeWidth="1.5" />
                            <path d="M12 12.5L18.5 10.5V17.5L12 16V12.5Z" fill="url(#rightBootAppleStrut)" stroke="#365314" strokeWidth="1.3" />
                            <path d="M70 12.5L63.5 10.5V17.5L70 16V12.5Z" fill="url(#rightBootAppleStrut)" stroke="#365314" strokeWidth="1.3" />
                            <rect x="17.5" y="9" width="47" height="10" rx="5" fill="url(#rightBootAppleBody)" stroke="#365314" strokeWidth="1.6" />
                            <path d="M22 10.7H60" stroke="white" strokeOpacity="0.78" strokeWidth="1.3" strokeLinecap="round" />

                            <g clipPath="url(#rightBootArmorClip)">
                                <rect
                                    x="0"
                                    y="-4"
                                    width="18"
                                    height="28"
                                    fill="url(#rightBootShimmerGrad)"
                                    className="svg-shimmer-band svg-shimmer-boot-right"
                                />
                            </g>

                            <circle cx="41" cy="5" r="3.4" fill="#0f172a" />
                            <circle cx="41" cy="5" r="2.4" fill="#38bdf8" />
                            <circle cx="41" cy="5" r="1" fill="#e0f2fe" />

                            <rect x="20" y="11.6" width="42" height="5" rx="2.5" fill="#0f172a" fillOpacity="0.88" />
                            <rect x="21.5" y="12.4" width="7.5" height="3.4" rx="1.7" fill="#38bdf8" />
                            <rect x="31" y="12.2" width="20" height="3.8" rx="1.9" fill="#bef264" />
                            <rect x="53" y="12.4" width="7.5" height="3.4" rx="1.7" fill="#38bdf8" />

                            <rect x="29.5" y="18.5" width="23" height="3.2" rx="1.6" fill="#1a2e05" stroke="#bef264" strokeOpacity="0.9" strokeWidth="1.1" />

                            <polygon points="27,21.7 55,21.7 51,48 31,48" fill="url(#rightBoosterOuter)" className="thruster-cone" />
                            <polygon points="33.5,21.7 48.5,21.7 45.5,37 36.5,37" fill="url(#rightBoosterCore)" className="thruster-cone" />

                            <ellipse cx="41" cy="25" rx="11" ry="2.2" stroke="#bef264" strokeOpacity="0.85" strokeWidth="1.2" className="booster-ring-1" />
                            <ellipse cx="41" cy="27" rx="13" ry="2.5" stroke="#38bdf8" strokeOpacity="0.8" strokeWidth="1.2" className="booster-ring-2" />

                            <circle cx="20" cy="24.5" r="3.1" stroke="#bef264" strokeOpacity="0.9" strokeWidth="1.25" className="thruster-bubble-b" />
                            <circle cx="62" cy="24" r="2.9" stroke="#7dd3fc" strokeOpacity="0.95" strokeWidth="1.25" className="thruster-bubble-a" />
                            <circle cx="25" cy="34.5" r="2.5" stroke="#a5f3fc" strokeOpacity="0.85" strokeWidth="1.15" className="thruster-bubble-c" />
                            <circle cx="57" cy="34" r="2.4" stroke="#a5f3fc" strokeOpacity="0.85" strokeWidth="1.15" className="thruster-bubble-b" />
                            <circle cx="16.5" cy="39" r="1.8" fill="#a3e635" fillOpacity="0.8" className="thruster-bubble-a" />
                            <circle cx="65.5" cy="39" r="1.8" fill="#38bdf8" fillOpacity="0.8" className="thruster-bubble-c" />
                        </svg>
                    </div>

                    {/* ==================== ADAPTIVE LOGIN / SIGNUP / CONTACT FORM CARD ==================== */}
                    <section
                        className={`w-full rounded-[26px] p-4 sm:px-6 sm:py-4 relative z-20 backdrop-blur-xl transition-all duration-300 ${
                            isDark ? 'dark-glass-card text-slate-100' : 'day-glass-card text-slate-800'
                        }`}
                    >
                        {/* Top Segmented Pill Toggle (Sign In / Staff Sign Up) */}
                        {activeCard !== 'contact' ? (
                            <div
                                className={`w-full p-1 rounded-2xl flex items-center mb-3 transition-colors duration-300 ${
                                    isDark
                                        ? 'bg-[#0a101d] border border-white/5'
                                        : 'bg-emerald-950/[0.06] border border-emerald-900/10 shadow-inner'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSwitchCard?.('login')}
                                    className={`w-1/2 py-1.5 px-3 rounded-xl text-[12.5px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        activeCard === 'login'
                                            ? isDark
                                                ? 'bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/40 text-white font-bold shadow-inner'
                                                : 'bg-white border border-emerald-500/35 text-slate-900 font-bold shadow-sm shadow-emerald-900/10'
                                            : isDark
                                                ? 'text-slate-400 hover:text-slate-200 font-semibold'
                                                : 'text-slate-500 hover:text-slate-800 font-semibold'
                                    }`}
                                >
                                    <Lock className={`w-3.5 h-3.5 ${iconAccentClass}`} />
                                    <span>Sign In</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSwitchCard?.('signup')}
                                    className={`w-1/2 py-1.5 px-3 rounded-xl text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        activeCard === 'signup'
                                            ? isDark
                                                ? 'bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/40 text-white font-bold shadow-inner'
                                                : 'bg-white border border-emerald-500/35 text-slate-900 font-bold shadow-sm shadow-emerald-900/10'
                                            : isDark
                                                ? 'text-slate-400 hover:text-slate-200 font-semibold'
                                                : 'text-slate-500 hover:text-slate-800 font-semibold'
                                    }`}
                                >
                                    <span className={`${iconAccentClass} text-sm font-bold leading-none`}>+</span>
                                    <span>Staff Sign Up</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mb-3">
                                <span
                                    className={`text-xs font-extrabold uppercase tracking-wider ${
                                        isDark ? 'text-lime-400' : 'text-emerald-700'
                                    }`}
                                >
                                    Contact Seaside Station
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onSwitchCard?.('login')}
                                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                                        isDark
                                            ? 'text-slate-300 hover:text-white bg-[#0a101d] border-slate-800'
                                            : 'text-slate-700 hover:text-slate-950 bg-white/85 border-emerald-900/15 shadow-xs'
                                    }`}
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        )}

                        {/* ==================== SIGN IN VIEW ==================== */}
                        {activeCard === 'login' && (
                            <>
                                <div className="text-center mb-3">
                                    <h1
                                        className={`text-[24px] sm:text-[26px] font-extrabold tracking-tight leading-tight ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                        }`}
                                    >
                                        Welcome Back
                                    </h1>
                                    <p
                                        className={`text-[12.5px] mt-0.5 font-medium ${
                                            isDark ? 'text-slate-400' : 'text-slate-500'
                                        }`}
                                    >
                                        Log in to your Seaside dashboard.
                                    </p>
                                </div>

                                {/* Pending Admin Approval Notice */}
                                {pendingApprovalInfo && (
                                    <div
                                        className={`mb-3 p-2.5 rounded-2xl border text-xs space-y-1 ${
                                            isDark
                                                ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
                                                : 'bg-amber-50 border-amber-300 text-amber-900'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p
                                                className={`font-extrabold ${
                                                    isDark ? 'text-amber-300' : 'text-amber-800'
                                                }`}
                                            >
                                                {pendingApprovalInfo.title}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={onDismissPending}
                                                className={`cursor-pointer ${
                                                    isDark
                                                        ? 'text-amber-300/70 hover:text-amber-200'
                                                        : 'text-amber-700/70 hover:text-amber-900'
                                                }`}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p
                                            className={`leading-snug ${
                                                isDark ? 'text-amber-100/90' : 'text-amber-800/90'
                                            }`}
                                        >
                                            {pendingApprovalInfo.message}
                                        </p>
                                        {onNotifyAdmin && (
                                            <button
                                                type="button"
                                                onClick={onNotifyAdmin}
                                                className={`text-[11px] font-extrabold hover:underline cursor-pointer ${
                                                    isDark ? 'text-lime-400' : 'text-emerald-700'
                                                }`}
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
                                        className={`mb-3 px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                                            isDark
                                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                                                : 'bg-rose-50 border-rose-300 text-rose-700'
                                        }`}
                                    >
                                        <AlertCircle
                                            className={`w-4 h-4 shrink-0 ${
                                                isDark ? 'text-rose-400' : 'text-rose-600'
                                            }`}
                                        />
                                        <span>{authError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                                    <div>
                                        <label
                                            htmlFor="volt-email"
                                            className={`block text-[10.5px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}
                                        >
                                            USERNAME OR EMAIL
                                        </label>
                                        <div className="relative">
                                            <div
                                                className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${iconAccentClass}`}
                                            >
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
                                                className={`w-full pl-10 pr-4 py-2 border rounded-2xl text-[13px] focus:outline-none focus:ring-1 transition-all duration-200 ${inputClass}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1 px-1">
                                            <label
                                                htmlFor="volt-password"
                                                className={`block text-[10.5px] font-bold uppercase tracking-wider ${labelClass}`}
                                            >
                                                PASSWORD
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => onForgotPassword?.(loginEmail)}
                                                className={`text-[11px] font-bold transition-colors cursor-pointer ${
                                                    isDark
                                                        ? 'text-lime-400 hover:text-lime-300'
                                                        : 'text-emerald-700 hover:text-emerald-600'
                                                }`}
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
                                                className={`w-full pl-10 pr-11 py-2 border rounded-2xl text-[13px] tracking-wide focus:outline-none focus:ring-1 transition-all duration-200 ${inputClass}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleTogglePassword}
                                                aria-label="Toggle password visibility"
                                                className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors cursor-pointer ${
                                                    isDark
                                                        ? 'text-slate-400 hover:text-slate-200'
                                                        : 'text-slate-400 hover:text-slate-700'
                                                }`}
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
                                        <p
                                            className={`text-[12px] font-medium ${
                                                isDark ? 'text-slate-400' : 'text-slate-600'
                                            }`}
                                        >
                                            New Seaside staff?{' '}
                                            <button
                                                type="button"
                                                onClick={() => onSwitchCard?.('signup')}
                                                className={`font-bold underline underline-offset-2 cursor-pointer ${
                                                    isDark
                                                        ? 'text-lime-400 hover:text-lime-300 decoration-lime-400/50'
                                                        : 'text-emerald-700 hover:text-emerald-600 decoration-emerald-600/50'
                                                }`}
                                            >
                                                Register an account
                                            </button>
                                        </p>
                                    </div>

                                    <div className="relative flex items-center justify-center my-1.5">
                                        <div
                                            className={`border-t w-full ${
                                                isDark ? 'border-slate-800' : 'border-emerald-900/10'
                                            }`}
                                        />
                                        <span
                                            className={`px-2.5 text-[10px] font-extrabold tracking-wider uppercase rounded-full border ${
                                                isDark
                                                    ? 'bg-[#0c1424] text-slate-400 border-slate-800'
                                                    : 'bg-white/95 text-slate-500 border-emerald-900/10'
                                            }`}
                                        >
                                            OR
                                        </span>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            disabled={isDemoLoading || isLoggingIn}
                                            onClick={handleDemoClick}
                                            className={`w-full py-2 px-4 border font-bold text-[13px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-60 ${
                                                isDark
                                                    ? 'bg-[#0a101d] hover:bg-[#111a2d] border-slate-800 hover:border-slate-700 text-white shadow-md'
                                                    : 'bg-white/90 hover:bg-emerald-50/90 border-emerald-900/15 hover:border-emerald-500/40 text-slate-800 shadow-sm'
                                            }`}
                                        >
                                            <span className={`${iconAccentClass} text-base leading-none font-bold`}>
                                                +
                                            </span>
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
                                    <h2
                                        className={`text-[22px] font-extrabold tracking-tight leading-tight ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                        }`}
                                    >
                                        Staff Registration
                                    </h2>
                                    <p
                                        className={`text-[12px] mt-0.5 font-medium ${
                                            isDark ? 'text-slate-400' : 'text-slate-500'
                                        }`}
                                    >
                                        Create a Seaside staff account for Admin approval.
                                    </p>
                                </div>

                                {(localRegError || regError) && (
                                    <div
                                        className={`mb-2.5 px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                                            isDark
                                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                                                : 'bg-rose-50 border-rose-300 text-rose-700'
                                        }`}
                                    >
                                        <AlertCircle
                                            className={`w-4 h-4 shrink-0 ${
                                                isDark ? 'text-rose-400' : 'text-rose-600'
                                            }`}
                                        />
                                        <span>{localRegError || regError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSignUpSubmit} className="space-y-2">
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}>
                                            FULL NAME
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${iconAccentClass}`}>
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
                                                className={`w-full pl-10 pr-4 py-1.5 border rounded-2xl text-[12.5px] focus:outline-none focus:ring-1 ${inputClass}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}>
                                            EMAIL ADDRESS
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${iconAccentClass}`}>
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
                                                className={`w-full pl-10 pr-4 py-1.5 border rounded-2xl text-[12.5px] focus:outline-none focus:ring-1 ${inputClass}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}>
                                            PHONE NUMBER (+63)
                                        </label>
                                        <div
                                            className={`flex items-center border rounded-2xl overflow-hidden focus-within:ring-1 ${
                                                isDark
                                                    ? 'bg-[#080e1b] border-[#1e293b] focus-within:border-lime-400 focus-within:ring-lime-400'
                                                    : 'bg-white/95 border-emerald-900/15 focus-within:border-emerald-500 focus-within:ring-emerald-500/30'
                                            }`}
                                        >
                                            <span
                                                className={`px-3 py-1.5 text-xs font-extrabold border-r select-none flex items-center gap-1 ${
                                                    isDark
                                                        ? 'text-lime-400 bg-[#0d1628] border-[#1e293b]'
                                                        : 'text-emerald-700 bg-emerald-50/90 border-emerald-900/10'
                                                }`}
                                            >
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
                                                className={`w-full px-3 py-1.5 bg-transparent text-[12.5px] focus:outline-none ${
                                                    isDark
                                                        ? 'text-slate-100 placeholder-slate-500'
                                                        : 'text-slate-800 placeholder-slate-400'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}>
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
                                                    className={`w-full pl-3.5 pr-9 py-1.5 border rounded-2xl text-[12.5px] focus:outline-none focus:ring-1 ${inputClass}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegPassword((p) => !p)}
                                                    className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer ${
                                                        isDark
                                                            ? 'text-slate-400 hover:text-slate-200'
                                                            : 'text-slate-400 hover:text-slate-700'
                                                    }`}
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
                                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}>
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
                                                className={`w-full px-3.5 py-1.5 border rounded-2xl text-[12.5px] focus:outline-none focus:ring-1 ${inputClass}`}
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
                                    <h2
                                        className={`text-[21px] font-extrabold tracking-tight ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                        }`}
                                    >
                                        Get in Touch
                                    </h2>
                                    <p
                                        className={`text-xs mt-0.5 ${
                                            isDark ? 'text-slate-400' : 'text-slate-500'
                                        }`}
                                    >
                                        Send a message directly to Seaside administration.
                                    </p>
                                </div>

                                <div
                                    className={`p-2.5 rounded-2xl border space-y-1 text-xs ${
                                        isDark
                                            ? 'bg-[#080e1b] border-[#1e293b] text-slate-300'
                                            : 'bg-white/90 border-emerald-900/10 text-slate-700 shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${iconAccentClass}`} />
                                        <span>{physicalAddress}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Clock
                                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                                                isDark ? 'text-sky-400' : 'text-sky-600'
                                            }`}
                                        />
                                        <span className="whitespace-pre-line">{businessHours}</span>
                                    </div>
                                    {facebookLink && (
                                        <a
                                            href={facebookLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`inline-block font-bold hover:underline ${
                                                isDark ? 'text-lime-400' : 'text-emerald-700'
                                            }`}
                                        >
                                            Visit Official Facebook Page →
                                        </a>
                                    )}
                                </div>

                                {contactStatus && (
                                    <div
                                        className={`px-3 py-1.5 rounded-2xl text-xs font-bold border ${
                                            contactStatus.type === 'success'
                                                ? isDark
                                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                                                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                : isDark
                                                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                                                    : 'bg-rose-50 border-rose-300 text-rose-700'
                                        }`}
                                    >
                                        {contactStatus.text}
                                    </div>
                                )}

                                <form onSubmit={handleContactSubmit} className="space-y-2">
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}>
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
                                            className={`w-full px-3.5 py-1.5 border rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ml-1 ${labelClass}`}>
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
                                            className={`w-full px-3.5 py-1.5 border rounded-2xl text-xs focus:outline-none focus:ring-1 ${inputClass}`}
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