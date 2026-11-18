// src/pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';
import { useSettings } from '../hooks/useSettings';
import { login, register as registerAccount } from '../lib/api';
import {
    Mail,
    Lock,
    User,
    Phone,
    Eye,
    EyeOff,
    ArrowRight,
    Send,
    Clock,
    MapPin,
    ArrowLeft,
    ShieldAlert,
    MessageSquare,
    X,
    Sun,
    Moon,
    Droplets,
    Activity
} from 'lucide-react';

const RISING_BUBBLES = [
    { left: '8%', size: 8, duration: '11s', delay: '0s' },
    { left: '16%', size: 12, duration: '14s', delay: '2.5s' },
    { left: '27%', size: 6, duration: '9.5s', delay: '1.2s' },
    { left: '38%', size: 10, duration: '13s', delay: '4s' },
    { left: '49%', size: 14, duration: '15s', delay: '0.8s' },
    { left: '58%', size: 7, duration: '10.5s', delay: '3.2s' },
    { left: '69%', size: 11, duration: '12.5s', delay: '1.8s' },
    { left: '78%', size: 8, duration: '11.5s', delay: '5s' },
    { left: '87%', size: 13, duration: '14.5s', delay: '2.1s' },
    { left: '94%', size: 7, duration: '10s', delay: '3.8s' }
];

export default function SeasideNewLanding() {
    const router = useRouter();
    const cardRef = useRef(null);

    // --- Settings and Global State ---
    const { data: settings } = useSettings() || {};
    const businessHours =
        settings?.business_hours ||
        'Monday - Saturday: 8:00 AM - 5:00 PM for Delivery\nMonday, Wednesday, Friday and Saturday: 8:00 AM - 5:00 PM';
    const physicalAddress = settings?.physical_address || 'Laois, Labrador, Pangasinan';

    const { setAuth, darkMode, toggleDarkMode } = useStore((state) => ({
        setAuth: state.setAuth,
        darkMode: state.darkMode,
        toggleDarkMode: state.toggleDarkMode
    }));

    // --- UI State: 'login' | 'signup' | 'contact' ---
    const [authError, setAuthError] = useState(null);
    const [regError, setRegError] = useState(null);
    const [pendingApprovalInfo, setPendingApprovalInfo] = useState(null);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [activeCard, setActiveCard] = useState('login');

    // Password visibility toggles
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

    // --- 3D Parallax Mouse Tracking State ---
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    useEffect(() => {
        router.prefetch('/about');
    }, [router]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        setTilt({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    // --- Login Form Logic ---
    const {
        register: registerLogin,
        handleSubmit: handleLoginSubmit,
        formState: { isSubmitting: isLoginSubmitting }
    } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onLogin = async (data) => {
        setAuthError(null);
        setPendingApprovalInfo(null);

        if (data.email === 'demo@gmail.com' && data.password === 'demodemo') {
            handleDemoLogin();
            return;
        }

        const result = await login({
            email: data.email,
            password: data.password
        });

        if (result?.status === 'PENDING_APPROVAL') {
            setPendingApprovalInfo({
                identifier: data.email.trim(),
                title: 'Account Awaiting Admin Approval',
                message:
                    result.message ||
                    'Your account is pending administrator approval before you can access the system.'
            });
            return;
        }

        if (result?.status === 'INVALID_CREDENTIALS' || result?.status === 'ERROR') {
            setAuthError(result.message || 'Invalid email or password.');
            return;
        }

        if (result && result.id) {
            const finalPayload = { ...result, isDemo: false };
            setAuth(finalPayload);
            router.push('/pos');
        } else {
            setAuthError('Invalid email or password.');
        }
    };

    // --- Staff Sign Up Form Logic ---
    const {
        register: registerSignUp,
        handleSubmit: handleSignUpSubmit,
        formState: { errors: signUpErrors, isSubmitting: isSignUpSubmitting },
        reset: resetSignUp,
        watch: watchSignUp
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSignUp = async (data) => {
        setRegError(null);
        setPendingApprovalInfo(null);

        const cleanEmail = data.email.trim().toLowerCase();
        const cleanPhone = data.phone.trim();
        const cleanName = data.name.trim();

        try {
            await registerAccount({
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                password: data.password,
                isAdmin: false,
                isApproved: false,
                categoryId: 2
            });

            resetSignUp();
            setActiveCard('login');
            setPendingApprovalInfo({
                identifier: cleanEmail,
                title: 'Registration Submitted!',
                message:
                    'Your staff account has been created and is awaiting administrator approval before you can sign in.'
            });
        } catch (err) {
            setRegError(err.message || 'Failed to create staff account. Please try again.');
        }
    };

    const handleDemoLogin = () => {
        setIsDemoLoading(true);
        const demoUser = {
            id: 'demo-user',
            name: 'Demo User',
            email: 'demo@gmail.com',
            role: 'Admin',
            isadmin: true,
            isDemo: true
        };
        setAuth(demoUser);
        router.push('/pos');
    };

    // --- Contact Form Logic ---
    const {
        register: registerContact,
        handleSubmit: handleContactSubmit,
        formState: { errors: contactErrors, isSubmitting: isContactSubmitting },
        reset: resetContact,
        setValue: setContactValue,
        setFocus: setContactFocus
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            email: '',
            message: '',
            honeypot: ''
        }
    });

    const onContactSubmit = async (data) => {
        if (data.honeypot) return;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Message sent successfully!');
                resetContact();
                setActiveCard('login');
            } else {
                throw new Error('Failed to send message');
            }
        } catch {
            alert('Failed to send message. Please try again.');
        }
    };

    const handleContactClick = () => {
        setActiveCard(activeCard === 'contact' ? 'login' : 'contact');
        if (activeCard !== 'contact') {
            setTimeout(() => {
                setContactFocus('email');
            }, 100);
        }
    };

    const handleRequestApprovalFollowUp = () => {
        const prefillEmail =
            pendingApprovalInfo?.identifier && pendingApprovalInfo.identifier.includes('@')
                ? pendingApprovalInfo.identifier
                : '';
        setActiveCard('contact');
        if (prefillEmail) {
            setContactValue('email', prefillEmail);
        }
        setContactValue(
            'message',
            `Hello Admin, I recently registered my staff account (${pendingApprovalInfo?.identifier || 'Staff'}) and would like to request access approval for Seaside POS.`
        );
        setTimeout(() => {
            setContactFocus(prefillEmail ? 'message' : 'email');
        }, 120);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f3fae6] via-[#ecfdf5] to-[#e0f2fe] dark:from-[#060b13] dark:via-[#08101c] dark:to-[#060b13] relative overflow-x-hidden font-sans text-slate-800 dark:text-slate-100 flex flex-col justify-between perspective-wrapper transition-colors duration-300">
            <Head>
                <title>Seaside | Welcome</title>
                <meta name="description" content="Seaside Enterprise Management System" />
            </Head>

            {/* Realistic 3D Water & Station System Background Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Ambient Purified Water & Lime Caustic Glows */}
                <div className="absolute top-[6%] left-[3%] w-[42vw] h-[42vw] max-w-[540px] max-h-[540px] bg-[#8DB600]/22 dark:bg-[#8DB600]/18 rounded-full blur-[130px] animate-blob" />
                <div className="absolute bottom-[6%] right-[6%] w-[38vw] h-[38vw] max-w-[480px] max-h-[480px] bg-cyan-400/25 dark:bg-cyan-500/20 rounded-full blur-[115px] animate-blob animation-delay-2000" />
                <div className="absolute top-[42%] right-[32%] w-[24vw] h-[24vw] max-w-[320px] max-h-[320px] bg-emerald-300/25 dark:bg-emerald-500/15 rounded-full blur-[95px] animate-blob animation-delay-4000" />

                {/* Realistic 3D Refractive Water Droplet #1 (Top-Right Station Drop) */}
                <div
                    className="water-droplet-3d absolute top-[15%] right-[9%] w-24 h-28 sm:w-28 sm:h-32 animate-float-slow"
                    style={{
                        transform: `translate3d(${tilt.y * -1.5}px, ${tilt.x * 1.5}px, 0)`
                    }}
                />

                {/* Realistic 3D Refractive Water Droplet #2 (Bottom-Left Purified Drop) */}
                <div
                    className="water-droplet-3d water-droplet-lime absolute bottom-[16%] left-[11%] w-28 h-32 sm:w-32 sm:h-36 animate-float-medium"
                    style={{
                        transform: `translate3d(${tilt.y * 1.3}px, ${tilt.x * -1.3}px, 0)`
                    }}
                />

                {/* Realistic 3D Refractive Water Droplet #3 (Center-Mid Micro Drop) */}
                <div
                    className="water-droplet-3d absolute top-[44%] left-[44%] w-14 h-16 sm:w-16 sm:h-20 animate-float-fast opacity-85"
                    style={{
                        transform: `translate3d(${tilt.y * -2}px, ${tilt.x * 2}px, 0)`
                    }}
                />

                {/* Realistic 3D Refractive Water Droplet #4 (Lower-Right Accent Drop) */}
                <div
                    className="hidden md:block water-droplet-3d water-droplet-lime absolute bottom-[12%] right-[38%] w-12 h-14 animate-float-slow opacity-75"
                    style={{
                        transform: `translate3d(${tilt.y * 1.6}px, ${tilt.x * 1.2}px, 0)`
                    }}
                />

                {/* Peripheral Floating 3D Glass Station Telemetry Pills */}
                <div
                    className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/45 backdrop-blur-md border border-white/80 dark:border-cyan-400/20 shadow-[0_12px_30px_rgba(6,182,212,0.12)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] absolute top-[21%] left-[41%] animate-float-medium opacity-75"
                    style={{
                        transform: `translate3d(${tilt.y * -1.1}px, ${tilt.x * 1.1}px, 0)`
                    }}
                >
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/15 dark:bg-cyan-400/15 flex items-center justify-center text-cyan-600 dark:text-cyan-300">
                        <Droplets className="w-3.5 h-3.5" />
                    </div>
                    <div className="leading-tight">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                            21-Stage RO Filtration
                        </span>
                        <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            99.9% Purified Water
                        </span>
                    </div>
                </div>

                <div
                    className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/45 backdrop-blur-md border border-white/80 dark:border-[#8DB600]/25 shadow-[0_12px_30px_rgba(141,182,0,0.12)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] absolute bottom-[22%] right-[6%] animate-float-slow opacity-75"
                    style={{
                        transform: `translate3d(${tilt.y * 1.2}px, ${tilt.x * -1.2}px, 0)`
                    }}
                >
                    <div className="w-6 h-6 rounded-lg bg-[#8DB600]/15 flex items-center justify-center text-[#5f7d00] dark:text-[#a3d100]">
                        <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div className="leading-tight">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-[#5f7d00] dark:text-[#a3d100]">
                            Station Live Sync
                        </span>
                        <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            POS • Refills • Delivery
                        </span>
                    </div>
                </div>

                {/* Effervescent Rising Purified Water Micro-Bubbles */}
                {RISING_BUBBLES.map((b, idx) => (
                    <span
                        key={idx}
                        className="water-micro-bubble"
                        style={{
                            left: b.left,
                            width: `${b.size}px`,
                            height: `${b.size}px`,
                            animationDuration: b.duration,
                            animationDelay: b.delay
                        }}
                    />
                ))}

                {/* Subtle Undulating Coastal Water Waves along Bottom Horizon */}
                <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 overflow-hidden opacity-45 dark:opacity-25">
                    <svg
                        className="w-[200%] h-full seaside-wave-slow"
                        viewBox="0 0 1440 160"
                        preserveAspectRatio="none"
                    >
                        <path
                            fill="url(#seaside-wave-grad-1)"
                            d="M0,96 C240,144 480,48 720,96 C960,144 1200,48 1440,96 L1440,160 L0,160 Z"
                        />
                        <defs>
                            <linearGradient id="seaside-wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8DB600" stopOpacity="0.28" />
                                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.32" />
                                <stop offset="100%" stopColor="#8DB600" stopOpacity="0.28" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative z-20 flex justify-between items-center p-4 sm:p-6 lg:px-12 max-w-7xl mx-auto w-full">
                {/* Animated Seaside Brand Badge & Wordmark (Starts on Page Open) */}
                <div className="group relative flex items-center space-x-2.5 sm:space-x-3.5 font-extrabold text-xl sm:text-2xl tracking-tight select-none seaside-brand-enter">
                    {/* Expanding Water-Ripple Halo on Page Load */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-[#8DB600]/60 dark:border-[#a3d100]/60 seaside-brand-ripple"
                    />

                    {/* Glassmorphic 3D Emblem Tile */}
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white/95 dark:border-white/20 p-1.5 flex items-center justify-center overflow-hidden shrink-0 seaside-tile-glow transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                        {/* Specular Glass Sheen Sweep */}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 seaside-brand-sheen"
                        />

                        {/* Gentle Coastal Breeze Sway on Palm & Wave Logo */}
                        <img
                            src="/seaside.png"
                            alt="Seaside Logo"
                            className="relative z-10 w-full h-full object-contain seaside-palm-breeze"
                        />
                    </div>

                    {/* Staggered Wordmark Reveal */}
                    <div className="relative overflow-hidden seaside-wordmark-enter">
                        <span className="relative z-10 inline-block text-green-900 dark:text-white font-black drop-shadow-2xs tracking-tight">
                            Seaside
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-5 sm:space-x-8 md:space-x-10 text-sm font-semibold tracking-wide relative z-50">
                    {/* Blended & Realistic About Link Callout */}
                    <div className="relative flex justify-center group">
                        <Link
                            href="/about"
                            className="text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-white transition-colors duration-300 cursor-pointer font-bold relative z-10 px-2 py-1"
                        >
                            About
                        </Link>

                        <div className="hidden sm:flex absolute top-[110%] left-1/2 transform -translate-x-1/2 flex-col items-center pointer-events-none w-[195px] z-[100]">
                            <div className="flex flex-col items-center animate-float-slow transition-transform duration-300 group-hover:-translate-y-1">
                                {/* Glowing Pointer Arrow */}
                                <svg
                                    className="w-5 h-5 mb-1 text-[#659000] dark:text-[#a3d100] drop-shadow-[0_0_8px_rgba(141,182,0,0.55)] dark:drop-shadow-[0_0_8px_rgba(163,209,0,0.8)] animate-pulse"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M12 4v16m0-16l-6 6m6-6l6 6"
                                    />
                                </svg>

                                {/* Realistic Glassmorphic Tooltip Badge */}
                                <div className="relative bg-white/85 dark:bg-slate-900/65 backdrop-blur-md border border-lime-500/30 dark:border-white/10 rounded-xl p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-center overflow-hidden transition-colors duration-300 group-hover:border-[#8DB600]/60 dark:group-hover:border-[#8DB600]/30 group-hover:shadow-[0_0_20px_rgba(141,182,0,0.2)]">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#8DB600]/15 to-transparent opacity-70" />

                                    <span className="relative z-10 block text-[9px] font-black uppercase tracking-widest text-[#5f7d00] dark:text-[#a3d100] mb-0.5">
                                        For Our Guests
                                    </span>
                                    <span className="relative z-10 block text-[10px] font-semibold leading-tight text-slate-700 dark:text-slate-200">
                                        Learn more about SEASIDE water refilling station
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleContactClick}
                        className="text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-[#8DB600] transition-colors duration-200 cursor-pointer outline-none font-bold"
                    >
                        {activeCard === 'contact' ? 'Login' : 'Contact'}
                    </button>

                    {/* Light / Dark Mode Switcher */}
                    {typeof toggleDarkMode === 'function' && (
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className="p-2 rounded-xl bg-white/75 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            aria-label="Toggle color theme"
                        >
                            {darkMode ? (
                                <Sun className="w-4 h-4 text-amber-400" />
                            ) : (
                                <Moon className="w-4 h-4 text-slate-700" />
                            )}
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 mt-2 sm:mt-0">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    {/* Left Side Hero Information */}
                    <div className="space-y-6">
                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white drop-shadow-2xs">
                            Seaside <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#659000] via-emerald-600 to-cyan-600 dark:from-[#8DB600] dark:via-emerald-400 dark:to-cyan-400 animate-gradient-x">
                                Sales
                            </span>{' '}
                            <br />
                            System
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-lg leading-relaxed">
                            Complete business management platform for modern water refilling stations. Streamline your operations from sales to delivery.
                        </p>

                        <div className="flex flex-col space-y-3 pt-2">
                            <Feature icon="analytics" text="Real-time Sales Analytics" />
                            <Feature icon="inventory" text="Multi-warehouse Inventory" />
                            <Feature icon="finance" text="Financial Reporting" />
                            <Feature icon="customer" text="Customer Management" />
                            <Feature icon="delivery" text="Delivery Tracking" />
                            <Feature icon="social" text="Social Media Integration" />
                        </div>
                    </div>

                    {/* Right Side 3D Interactive Authentication Card */}
                    <div
                        className="relative perspective-[1200px] w-full flex justify-center items-center h-full min-h-[560px]"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div
                            ref={cardRef}
                            className="w-full max-w-[450px] transform-gpu transition-transform duration-200 ease-out"
                            style={{
                                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            {/* Glassmorphism Card Base (Light & Dark Mode) */}
                            <div className="bg-white/75 dark:bg-slate-900/65 backdrop-blur-2xl text-slate-800 dark:text-slate-100 rounded-[2.25rem] p-6 sm:p-8 md:p-9 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.14),0_0_40px_rgba(141,182,0,0.16)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(141,182,0,0.12)] border border-white/90 dark:border-white/15 relative overflow-hidden transition-colors duration-300">
                                {/* Top Lime Accent Rim */}
                                <div
                                    className="absolute top-0 inset-x-10 h-[2px] rounded-full opacity-85"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, transparent, #8DB600, #06b6d4, transparent)'
                                    }}
                                />

                                {/* Dynamic Mouse-Follow Glare Layer */}
                                <div
                                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                                    style={{
                                        background: `radial-gradient(circle at ${50 + tilt.y * 2.5}% ${50 - tilt.x * 2.5}%, rgba(141,182,0,0.14) 0%, rgba(255,255,255,0.12) 35%, transparent 65%)`
                                    }}
                                />

                                <div className="relative z-10 w-full translate-z-[30px] transform-gpu">
                                    {/* Segmented Tab Switch */}
                                    {activeCard !== 'contact' && (
                                        <div className="flex bg-slate-200/70 dark:bg-slate-950/70 p-1.5 rounded-2xl mb-6 border border-slate-300/60 dark:border-white/10 select-none shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveCard('login');
                                                    setAuthError(null);
                                                    setRegError(null);
                                                }}
                                                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                                                    activeCard === 'login'
                                                        ? 'bg-white dark:bg-gradient-to-r dark:from-[#8DB600]/30 dark:to-teal-500/25 border border-lime-500/40 dark:border-[#8DB600]/50 text-slate-900 dark:text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                                                }`}
                                            >
                                                Sign In
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveCard('signup');
                                                    setAuthError(null);
                                                    setRegError(null);
                                                }}
                                                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                                                    activeCard === 'signup'
                                                        ? 'bg-white dark:bg-gradient-to-r dark:from-[#8DB600]/30 dark:to-teal-500/25 border border-lime-500/40 dark:border-[#8DB600]/50 text-slate-900 dark:text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                                                }`}
                                            >
                                                Staff Sign Up
                                            </button>
                                        </div>
                                    )}

                                    {/* --- CARD VIEW 1: LOGIN --- */}
                                    {activeCard === 'login' && (
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
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-400/30">
                                                                        Pending Admin Review
                                                                    </span>
                                                                </div>
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
                                                            onClick={() => setPendingApprovalInfo(null)}
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
                                                            onClick={handleRequestApprovalFollowUp}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8DB600]/15 hover:bg-[#8DB600]/25 dark:bg-[#8DB600]/20 dark:hover:bg-[#8DB600]/30 border border-[#8DB600]/40 text-[#5f7d00] dark:text-[#b8eb00] text-[10.5px] font-bold transition-colors shrink-0 cursor-pointer"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            <span>Notify Admin</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Blended Invalid Credentials / Error Handler */}
                                            {authError && (
                                                <div className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 backdrop-blur-md animate-in fade-in duration-150">
                                                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">{authError}</span>
                                                </div>
                                            )}

                                            <form className="space-y-4" onSubmit={handleLoginSubmit(onLogin)}>
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
                                                            {...registerLogin('email', { required: true })}
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
                                                            onClick={handleContactClick}
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
                                                            type={showLoginPassword ? 'text' : 'password'}
                                                            {...registerLogin('password', { required: true })}
                                                            className="seaside-glass-input w-full h-12 pl-11 pr-11 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/20 transition-all font-medium text-sm outline-none shadow-2xs"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowLoginPassword((prev) => !prev)}
                                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                                                        >
                                                            {showLoginPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={isLoginSubmitting || isDemoLoading}
                                                        style={{
                                                            background:
                                                                'linear-gradient(135deg, #8DB600 0%, #65a30d 50%, #0d9488 100%)',
                                                            color: '#ffffff'
                                                        }}
                                                        className="relative overflow-hidden w-full h-12 rounded-2xl font-black text-sm sm:text-base shadow-[0_10px_25px_-5px_rgba(141,182,0,0.45)] border border-lime-300/40 transition-all hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                                                    >
                                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shimmer" />
                                                        {isLoginSubmitting ? (
                                                            <>
                                                                <svg
                                                                    className="animate-spin h-4 w-4 text-white"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    />
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                    />
                                                                </svg>
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
                                                    onClick={() => {
                                                        setActiveCard('signup');
                                                        setAuthError(null);
                                                        setRegError(null);
                                                    }}
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
                                                onClick={handleDemoLogin}
                                                disabled={isLoginSubmitting || isDemoLoading}
                                                className="mt-5 w-full h-11 border border-slate-200/90 dark:border-white/15 bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-[0.985] flex items-center justify-center gap-2 disabled:opacity-60 text-xs sm:text-sm backdrop-blur-md shadow-2xs cursor-pointer"
                                            >
                                                {isDemoLoading ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-4 w-4 text-slate-700 dark:text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
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
                                    )}

                                    {/* --- CARD VIEW 2: STAFF SIGN UP --- */}
                                    {activeCard === 'signup' && (
                                        <div className="animate-in fade-in zoom-in-95 duration-200">
                                            <div className="mb-4 text-center">
                                                <h2 className="text-2xl sm:text-3xl font-black mb-1 text-slate-900 dark:text-white tracking-tight">
                                                    Staff Sign Up
                                                </h2>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs px-2">
                                                    Register for an account. An administrator will review and approve your access before login.
                                                </p>
                                            </div>

                                            {regError && (
                                                <div className="mb-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 p-3 text-xs font-semibold text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2 backdrop-blur-md">
                                                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                                    <span>{regError}</span>
                                                </div>
                                            )}

                                            <form className="space-y-2.5" onSubmit={handleSignUpSubmit(onSignUp)}>
                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                        Full Name <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            {...registerSignUp('name', {
                                                                required: 'Full name is required'
                                                            })}
                                                            className="seaside-glass-input w-full h-10 pl-10 pr-3.5 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-2 focus:ring-[#8DB600]/20 transition-all font-medium text-xs sm:text-sm outline-none"
                                                            placeholder="Juan Dela Cruz"
                                                        />
                                                    </div>
                                                    {signUpErrors.name && (
                                                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-semibold">
                                                            {signUpErrors.name.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                        Email Address <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                                                            <Mail className="h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            {...registerSignUp('email', {
                                                                required: 'Email is required',
                                                                pattern: {
                                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                    message: 'Invalid email address'
                                                                }
                                                            })}
                                                            className="seaside-glass-input w-full h-10 pl-10 pr-3.5 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-2 focus:ring-[#8DB600]/20 transition-all font-medium text-xs sm:text-sm outline-none"
                                                            placeholder="staff@seaside.com"
                                                        />
                                                    </div>
                                                    {signUpErrors.email && (
                                                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-semibold">
                                                            {signUpErrors.email.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                        Phone Number <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                                                            <Phone className="h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            {...registerSignUp('phone', {
                                                                required: 'Phone number is required',
                                                                pattern: {
                                                                    value: /^[0-9+() -]{7,15}$/,
                                                                    message: 'Please enter a valid phone number'
                                                                }
                                                            })}
                                                            className="seaside-glass-input w-full h-10 pl-10 pr-3.5 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-2 focus:ring-[#8DB600]/20 transition-all font-medium text-xs sm:text-sm outline-none"
                                                            placeholder="0912 345 6789"
                                                        />
                                                    </div>
                                                    {signUpErrors.phone && (
                                                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-semibold">
                                                            {signUpErrors.phone.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                        Password <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                                                            <Lock className="h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type={showRegPassword ? 'text' : 'password'}
                                                            {...registerSignUp('password', {
                                                                required: 'Password is required',
                                                                minLength: {
                                                                    value: 6,
                                                                    message: 'Must be at least 6 characters'
                                                                }
                                                            })}
                                                            className="seaside-glass-input w-full h-10 pl-10 pr-10 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-2 focus:ring-[#8DB600]/20 transition-all font-medium text-xs sm:text-sm outline-none"
                                                            placeholder="•••••••• (min 6 characters)"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowRegPassword((prev) => !prev)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                                        >
                                                            {showRegPassword ? (
                                                                <EyeOff className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Eye className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    {signUpErrors.password && (
                                                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-semibold">
                                                            {signUpErrors.password.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                        Confirm Password <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#659000] dark:group-focus-within:text-[#8DB600] transition-colors">
                                                            <Lock className="h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type={showRegConfirmPassword ? 'text' : 'password'}
                                                            {...registerSignUp('confirmPassword', {
                                                                required: 'Confirm your password',
                                                                validate: (val) =>
                                                                    val === watchSignUp('password') ||
                                                                    'Passwords do not match'
                                                            })}
                                                            className="seaside-glass-input w-full h-10 pl-10 pr-10 bg-white/85 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950/90 focus:border-[#8DB600] focus:ring-2 focus:ring-[#8DB600]/20 transition-all font-medium text-xs sm:text-sm outline-none"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowRegConfirmPassword((prev) => !prev)
                                                            }
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                                        >
                                                            {showRegConfirmPassword ? (
                                                                <EyeOff className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Eye className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    {signUpErrors.confirmPassword && (
                                                        <p className="text-rose-500 dark:text-rose-400 text-[10px] ml-1 font-semibold">
                                                            {signUpErrors.confirmPassword.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={isSignUpSubmitting}
                                                        style={{
                                                            background:
                                                                'linear-gradient(135deg, #8DB600 0%, #65a30d 50%, #0d9488 100%)',
                                                            color: '#ffffff'
                                                        }}
                                                        className="relative overflow-hidden w-full h-11 rounded-2xl font-black text-sm shadow-[0_10px_25px_-5px_rgba(141,182,0,0.45)] border border-lime-300/40 transition-all hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2 disabled:opacity-60 group cursor-pointer"
                                                    >
                                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shimmer" />
                                                        {isSignUpSubmitting ? (
                                                            <>
                                                                <svg
                                                                    className="animate-spin h-4 w-4 text-white"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    />
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                    />
                                                                </svg>
                                                                <span>Submitting Registration...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>Submit for Admin Approval</span>
                                                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveCard('login');
                                                        setRegError(null);
                                                    }}
                                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                                                >
                                                    Already registered?{' '}
                                                    <span className="underline font-bold text-[#5f7d00] dark:text-[#a3d100]">
                                                        Sign in here
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- CARD VIEW 3: CONTACT --- */}
                                    {activeCard === 'contact' && (
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

                                            <form
                                                className="space-y-3"
                                                onSubmit={handleContactSubmit(onContactSubmit)}
                                            >
                                                <div className="hidden">
                                                    <label htmlFor="honeypot">Do not fill this out</label>
                                                    <input
                                                        type="text"
                                                        id="honeypot"
                                                        {...registerContact('honeypot')}
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                        Your Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        {...registerContact('email', {
                                                            required: 'Email is required',
                                                            pattern: {
                                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                message: 'Invalid email address'
                                                            }
                                                        })}
                                                        className={`seaside-glass-input w-full px-4 py-2.5 bg-white/85 dark:bg-slate-950/70 border ${
                                                            contactErrors.email
                                                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                                                : 'border-slate-200/90 dark:border-white/15 focus:border-[#8DB600] focus:ring-[#8DB600]/20'
                                                        } rounded-xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm`}
                                                        placeholder="example@email.com"
                                                    />
                                                    {contactErrors.email && (
                                                        <p className="text-rose-500 dark:text-rose-400 text-[10px] mt-0.5 ml-1 font-medium">
                                                            {contactErrors.email.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                        Message
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        {...registerContact('message', {
                                                            required: 'Message is required',
                                                            minLength: {
                                                                value: 10,
                                                                message:
                                                                    'Message must be at least 10 characters'
                                                            },
                                                            maxLength: {
                                                                value: 500,
                                                                message:
                                                                    'Message must be less than 500 characters'
                                                            }
                                                        })}
                                                        className={`seaside-glass-input w-full px-4 py-2.5 bg-white/85 dark:bg-slate-950/70 border ${
                                                            contactErrors.message
                                                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                                                : 'border-slate-200/90 dark:border-white/15 focus:border-[#8DB600] focus:ring-[#8DB600]/20'
                                                        } rounded-xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none text-xs sm:text-sm`}
                                                        placeholder="Write your message here..."
                                                    />
                                                    {contactErrors.message && (
                                                        <p className="text-rose-500 dark:text-rose-400 text-[10px] mt-0.5 ml-1 font-medium">
                                                            {contactErrors.message.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={isContactSubmitting}
                                                        style={{
                                                            background:
                                                                'linear-gradient(135deg, #8DB600 0%, #0d9488 100%)',
                                                            color: '#ffffff'
                                                        }}
                                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                                    >
                                                        <Send className="w-3.5 h-3.5" />
                                                        <span>
                                                            {isContactSubmitting
                                                                ? 'Sending...'
                                                                : 'Send Message'}
                                                        </span>
                                                    </button>

                                                    <a
                                                        href={
                                                            settings?.facebook_link ||
                                                            'https://www.facebook.com/61587059323111/'
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center text-blue-600 dark:text-sky-400 hover:underline font-bold transition-colors text-xs"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1.5"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                        </svg>
                                                        Message us on Facebook
                                                    </a>
                                                </div>
                                            </form>

                                            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveCard('login')}
                                                    className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                    <span>Back to Login</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-20 py-4 px-6 text-center text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 border-t border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md transition-colors">
                <p>
                    &copy; {new Date().getFullYear()} Seaside Purified Water Refilling Station. All rights reserved. • By{' '}
                    <span className="font-bold text-green-800 dark:text-[#8DB600]">tijnara</span>
                </p>
            </footer>

            {/* Global Keyframes, Realistic 3D Water Droplets & Light/Dark Autofill Overrides */}
            <style jsx global>{`
                .seaside-glass-input:-webkit-autofill,
                .seaside-glass-input:-webkit-autofill:hover,
                .seaside-glass-input:-webkit-autofill:focus,
                .seaside-glass-input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
                    -webkit-text-fill-color: #0f172a !important;
                    caret-color: #0f172a !important;
                    border-color: rgba(141, 182, 0, 0.65) !important;
                    transition: background-color 5000s ease-in-out 0s;
                }

                .dark .seaside-glass-input:-webkit-autofill,
                .dark .seaside-glass-input:-webkit-autofill:hover,
                .dark .seaside-glass-input:-webkit-autofill:focus,
                .dark .seaside-glass-input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 1000px #09111e inset !important;
                    -webkit-text-fill-color: #f8fafc !important;
                    caret-color: #f8fafc !important;
                    border-color: rgba(141, 182, 0, 0.55) !important;
                    transition: background-color 5000s ease-in-out 0s;
                }

                /* --- Realistic 3D Refractive Water Droplets --- */
                .water-droplet-3d {
                    border-radius: 56% 44% 48% 52% / 62% 58% 42% 38%;
                    background: radial-gradient(
                            circle at 30% 28%,
                            rgba(255, 255, 255, 0.85) 0%,
                            rgba(224, 242, 254, 0.45) 28%,
                            rgba(6, 182, 212, 0.16) 68%,
                            rgba(141, 182, 0, 0.22) 100%
                    );
                    border: 1px solid rgba(255, 255, 255, 0.85);
                    box-shadow:
                            inset 6px 8px 18px rgba(255, 255, 255, 0.85),
                            inset -8px -10px 20px rgba(6, 182, 212, 0.28),
                            inset -2px -4px 10px rgba(141, 182, 0, 0.22),
                            0 18px 36px rgba(14, 116, 144, 0.15);
                    backdrop-filter: blur(6px);
                    animation: liquidSurfaceMorph 9s ease-in-out infinite;
                }

                .dark .water-droplet-3d {
                    background: radial-gradient(
                            circle at 30% 28%,
                            rgba(255, 255, 255, 0.28) 0%,
                            rgba(34, 211, 238, 0.14) 32%,
                            rgba(6, 182, 212, 0.06) 68%,
                            rgba(141, 182, 0, 0.14) 100%
                    );
                    border: 1px solid rgba(255, 255, 255, 0.22);
                    box-shadow:
                            inset 6px 8px 16px rgba(255, 255, 255, 0.24),
                            inset -8px -10px 22px rgba(6, 182, 212, 0.26),
                            inset -2px -4px 10px rgba(141, 182, 0, 0.2),
                            0 22px 44px rgba(0, 0, 0, 0.55);
                }

                .water-droplet-lime {
                    background: radial-gradient(
                            circle at 30% 28%,
                            rgba(255, 255, 255, 0.85) 0%,
                            rgba(236, 252, 203, 0.45) 30%,
                            rgba(141, 182, 0, 0.18) 68%,
                            rgba(6, 182, 212, 0.22) 100%
                    );
                }

                .dark .water-droplet-lime {
                    background: radial-gradient(
                            circle at 30% 28%,
                            rgba(255, 255, 255, 0.26) 0%,
                            rgba(163, 209, 0, 0.14) 32%,
                            rgba(141, 182, 0, 0.06) 68%,
                            rgba(6, 182, 212, 0.14) 100%
                    );
                }

                /* Specular Primary Light Glint inside Droplets */
                .water-droplet-3d::before {
                    content: '';
                    position: absolute;
                    top: 18%;
                    left: 22%;
                    width: 24%;
                    height: 15%;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.9);
                    transform: rotate(-28deg);
                    filter: blur(0.5px);
                }

                .dark .water-droplet-3d::before {
                    background: rgba(255, 255, 255, 0.65);
                }

                /* Secondary Caustic Glint */
                .water-droplet-3d::after {
                    content: '';
                    position: absolute;
                    bottom: 18%;
                    right: 22%;
                    width: 12%;
                    height: 12%;
                    border-radius: 50%;
                    background: rgba(163, 209, 0, 0.65);
                    filter: blur(1px);
                }

                @keyframes liquidSurfaceMorph {
                    0%,
                    100% {
                        border-radius: 56% 44% 48% 52% / 62% 58% 42% 38%;
                    }
                    33% {
                        border-radius: 48% 52% 43% 57% / 55% 63% 37% 45%;
                    }
                    66% {
                        border-radius: 61% 39% 53% 47% / 58% 49% 51% 42%;
                    }
                }

                /* --- Effervescent Rising Micro-Bubbles --- */
                .water-micro-bubble {
                    position: absolute;
                    bottom: -24px;
                    border-radius: 9999px;
                    background: radial-gradient(
                            circle at 32% 32%,
                            rgba(255, 255, 255, 0.9),
                            rgba(6, 182, 212, 0.25) 65%,
                            rgba(141, 182, 0, 0.2) 100%
                    );
                    border: 1px solid rgba(255, 255, 255, 0.7);
                    box-shadow: inset 1px 1px 3px rgba(255, 255, 255, 0.8);
                    animation: bubbleRise linear infinite;
                    opacity: 0;
                }

                .dark .water-micro-bubble {
                    background: radial-gradient(
                            circle at 32% 32%,
                            rgba(255, 255, 255, 0.45),
                            rgba(34, 211, 238, 0.14) 65%,
                            rgba(141, 182, 0, 0.12) 100%
                    );
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                @keyframes bubbleRise {
                    0% {
                        transform: translateY(0) translateX(0) scale(0.75);
                        opacity: 0;
                    }
                    15% {
                        opacity: 0.75;
                    }
                    50% {
                        transform: translateY(-48vh) translateX(8px) scale(1);
                    }
                    85% {
                        opacity: 0.55;
                    }
                    100% {
                        transform: translateY(-102vh) translateX(-6px) scale(1.1);
                        opacity: 0;
                    }
                }

                /* --- Coastal Bottom Wave Motion --- */
                @keyframes seasideWaveSlide {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                .seaside-wave-slow {
                    animation: seasideWaveSlide 18s linear infinite;
                }

                /* --- Seaside Brand Logo Opening & Living Animations --- */
                @keyframes seasideBrandEntrance {
                    0% {
                        opacity: 0;
                        transform: translate3d(-18px, 10px, 0) scale(0.8) rotate(-5deg);
                    }
                    65% {
                        opacity: 1;
                        transform: translate3d(2px, -2px, 0) scale(1.04) rotate(1deg);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
                    }
                }

                @keyframes seasideWordmarkReveal {
                    0% {
                        opacity: 0;
                        transform: translate3d(-14px, 0, 0);
                        filter: blur(4px);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                        filter: blur(0px);
                    }
                }

                @keyframes seasideRippleBurst {
                    0% {
                        opacity: 0.75;
                        transform: scale(0.85);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.65);
                    }
                }

                @keyframes seasidePalmBreeze {
                    0%,
                    100% {
                        transform: rotate(-2deg) translateY(0px);
                    }
                    50% {
                        transform: rotate(2.5deg) translateY(-1.5px);
                    }
                }

                @keyframes seasideGlassSheen {
                    0% {
                        transform: translateX(-140%) skewX(-22deg);
                    }
                    35%,
                    100% {
                        transform: translateX(240%) skewX(-22deg);
                    }
                }

                @keyframes seasideTileGlowLight {
                    0%,
                    100% {
                        box-shadow: 0 6px 20px rgba(141, 182, 0, 0.2),
                        0 0 0 1px rgba(141, 182, 0, 0.15);
                    }
                    50% {
                        box-shadow: 0 10px 28px rgba(141, 182, 0, 0.34),
                        0 0 16px rgba(6, 182, 212, 0.22);
                    }
                }

                @keyframes seasideTileGlowDark {
                    0%,
                    100% {
                        box-shadow: 0 0 18px rgba(141, 182, 0, 0.22),
                        0 0 0 1px rgba(141, 182, 0, 0.22);
                    }
                    50% {
                        box-shadow: 0 0 28px rgba(141, 182, 0, 0.42),
                        0 0 18px rgba(34, 211, 238, 0.24);
                    }
                }

                .seaside-brand-enter {
                    animation: seasideBrandEntrance 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
                }

                .seaside-wordmark-enter {
                    animation: seasideWordmarkReveal 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both;
                }

                .seaside-brand-ripple {
                    animation: seasideRippleBurst 1.35s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
                }

                .seaside-palm-breeze {
                    transform-origin: bottom center;
                    animation: seasidePalmBreeze 3.6s ease-in-out 0.8s infinite;
                }

                .seaside-brand-sheen {
                    width: 45%;
                    background: linear-gradient(
                            90deg,
                            rgba(255, 255, 255, 0) 0%,
                            rgba(255, 255, 255, 0.55) 50%,
                            rgba(255, 255, 255, 0) 100%
                    );
                    animation: seasideGlassSheen 4.5s ease-in-out 0.45s infinite;
                }

                .seaside-tile-glow {
                    animation: seasideTileGlowLight 3.5s ease-in-out 0.8s infinite;
                }

                .dark .seaside-tile-glow {
                    animation: seasideTileGlowDark 3.5s ease-in-out 0.8s infinite;
                }

                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.92);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 15s infinite alternate ease-in-out;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                @keyframes float-slow {
                    0%,
                    100% {
                        margin-top: 0px;
                    }
                    50% {
                        margin-top: -18px;
                    }
                }
                @keyframes float-medium {
                    0%,
                    100% {
                        margin-top: 0px;
                    }
                    50% {
                        margin-top: -14px;
                    }
                }
                @keyframes float-fast {
                    0%,
                    100% {
                        margin-top: 0px;
                    }
                    50% {
                        margin-top: -22px;
                    }
                }

                .animate-float-slow {
                    animation: float-slow 8s ease-in-out infinite;
                }
                .animate-float-medium {
                    animation: float-medium 6s ease-in-out infinite;
                }
                .animate-float-fast {
                    animation: float-fast 5s ease-in-out infinite;
                }

                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 1.8s infinite;
                }

                @keyframes gradient-x {
                    0%,
                    100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 4s ease infinite;
                }

                .perspective-wrapper {
                    perspective: 1200px;
                }

                .translate-z-\\[30px\\] {
                    transform: translateZ(30px);
                }

                .translate-z-\\[20px\\] {
                    transform: translateZ(20px);
                }
            `}</style>
        </div>
    );
}

function Feature({ icon, text }) {
    const renderIcon = () => {
        switch (icon) {
            case 'analytics':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                );
            case 'inventory':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                );
            case 'finance':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                );
            case 'customer':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                );
            case 'delivery':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                );
            case 'social':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                );
            default:
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                    />
                );
        }
    };

    return (
        <div className="flex items-center space-x-3.5 text-slate-800 dark:text-slate-200">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-md flex items-center justify-center border border-lime-500/25 dark:border-white/15 text-[#5f7d00] dark:text-[#a3d100] shadow-[0_2px_10px_rgba(141,182,0,0.12)] dark:shadow-[0_0_12px_rgba(141,182,0,0.12)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {renderIcon()}
                </svg>
            </div>
            <span className="font-bold text-xs sm:text-sm">{text}</span>
        </div>
    );
}