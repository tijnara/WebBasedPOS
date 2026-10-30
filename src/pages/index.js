// src/pages/index.js
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';
import { useSettings } from '../hooks/useSettings';
import { login, register as registerAccount } from '../lib/api';

export default function SeasideNewLanding() {
    const router = useRouter();

    // --- Settings and Global State ---
    const { data: settings } = useSettings() || {};
    const businessHours = settings?.business_hours || 'Monday - Saturday: 8:00 AM - 5:00 PM for Delivery\nMonday, Wednesday, Friday and Saturday: 8:00 AM - 5:00 PM';
    const physicalAddress = settings?.physical_address || 'Laois, Labrador, Pangasinan';
    const setAuth = useStore(state => state.setAuth);

    // --- UI State: 'login' | 'signup' | 'contact' ---
    const [authError, setAuthError] = useState(null);
    const [regError, setRegError] = useState(null);
    const [regSuccess, setRegSuccess] = useState(null);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [activeCard, setActiveCard] = useState('login');

    // --- Refilling Transition State ---
    const [isCinematicActive, setIsCinematicActive] = useState(false);

    // Pre-cache the About page for instantaneous routing
    useEffect(() => {
        router.prefetch('/about');
    }, [router]);

    const handleAboutClick = (e) => {
        e.preventDefault();
        setIsCinematicActive(true);
    };

    const handleCinematicComplete = () => {
        router.push('/about');
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
        setRegSuccess(null);

        if (data.email === 'demo@gmail.com' && data.password === 'demodemo') {
            handleDemoLogin();
            return;
        }

        try {
            const user = await login({
                email: data.email,
                password: data.password,
            });

            if (user?.status === 'PENDING_APPROVAL') {
                setAuthError(user.message || 'Your account is pending administrator approval before you can access the system.');
                return;
            }

            if (user && user.id) {
                if (user.is_approved === false && !user.isadmin && user.role !== 'Admin') {
                    setAuthError('Your account is pending administrator approval before you can access the system.');
                    return;
                }

                const finalPayload = { ...user, isDemo: false };
                setAuth(finalPayload);
                router.push('/pos');
            } else {
                setAuthError('Invalid email or password.');
            }
        } catch (err) {
            console.error('Login exception:', err.message);
            setAuthError(err.message || 'An error occurred during login. Please try again.');
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
        setRegSuccess(null);

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
            setRegSuccess('Registration submitted! Your account is currently pending administrator approval. Please wait for an admin to approve your access before signing in.');
        } catch (err) {
            console.error('Registration exception:', err);
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
            isDemo: true,
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
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Message sent successfully!');
                resetContact();
                setActiveCard('login');
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            console.error(error);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#8DB600] via-lime-100 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-x-hidden font-sans text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">
            <Head>
                <title>Seaside | Welcome</title>
                <meta name="description" content="Seaside Enterprise Management System" />
            </Head>

            {/* Background Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white dark:bg-lime-900/20 rounded-full mix-blend-overlay dark:mix-blend-screen filter blur-3xl opacity-60 dark:opacity-30 pointer-events-none animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-lime-200 dark:bg-emerald-950/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 dark:opacity-20 pointer-events-none animate-blob animation-delay-2000"></div>

            {/* Navigation */}
            <nav className="relative z-20 flex justify-between items-center p-4 sm:p-6 lg:px-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 font-extrabold text-xl sm:text-2xl tracking-tight">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/80 p-1.5 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                        <img src="/seaside.png" alt="Seaside Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-green-800 dark:text-lime-400 font-black">Seaside</span>
                </div>

                <div className="flex items-center space-x-6 sm:space-x-8 md:space-x-12 text-sm font-semibold tracking-wide relative z-50">
                    <div className="relative flex justify-center">
                        <a
                            href="/about"
                            onClick={handleAboutClick}
                            className="text-slate-700 dark:text-slate-200 hover:text-green-700 dark:hover:text-lime-400 transition-colors duration-200 cursor-pointer font-bold relative z-10"
                        >
                            About
                        </a>

                        <div className="absolute top-[120%] left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none w-[160px] sm:w-[200px] z-[100]">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce mb-1 drop-shadow-md text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <defs>
                                    <linearGradient id="violet-arrow" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m0-16l-6 6m6-6l6 6" stroke="url(#violet-arrow)" />
                            </svg>
                            <span className="text-[10px] sm:text-[11px] font-black text-center leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 drop-shadow-xs px-1">
                                For Our Guest: To know more about SEASIDE water refilling station
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleContactClick}
                        className="text-slate-700 dark:text-slate-200 hover:text-green-700 dark:hover:text-lime-400 transition-colors duration-200 cursor-pointer outline-none font-bold"
                    >
                        {activeCard === 'contact' ? 'Login' : 'Contact'}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 mt-4 sm:mt-0">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Side Hero Information */}
                    <div className="space-y-6">
                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-green-800 dark:text-lime-400">
                            Seaside <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
                                Sales
                            </span> <br />
                            System
                        </h1>

                        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium max-w-lg leading-relaxed">
                            Complete business management platform for modern water refilling stations. Streamline your operations from sales to delivery.
                        </p>

                        <div className="flex flex-col space-y-3.5 pt-2">
                            <Feature icon="analytics" text="Real-time Sales Analytics" />
                            <Feature icon="inventory" text="Multi-warehouse Inventory" />
                            <Feature icon="finance" text="Financial Reporting" />
                            <Feature icon="customer" text="Customer Management" />
                            <Feature icon="delivery" text="Delivery Tracking" />
                            <Feature icon="social" text="Social Media Integration" />
                        </div>
                    </div>

                    {/* Right Side Frosted Authentication Card */}
                    <div className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl text-slate-800 dark:text-slate-100 rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl shadow-green-900/15 dark:shadow-black/60 border border-white/70 dark:border-slate-800 relative overflow-hidden transition-all duration-300 min-h-[560px] flex flex-col justify-center">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-gradient-to-br from-lime-400 to-green-500 dark:from-lime-600/30 dark:to-emerald-600/30 rounded-full blur-2xl opacity-40 z-0 pointer-events-none"></div>

                        <div className="relative z-10 w-full">
                            {/* Segmented Tab Switch */}
                            {activeCard !== 'contact' && (
                                <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl mb-6 border border-slate-200/80 dark:border-slate-700/80 select-none">
                                    <button
                                        type="button"
                                        onClick={() => { setActiveCard('login'); setAuthError(null); setRegError(null); }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                            activeCard === 'login'
                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-lime-400 shadow-xs'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveCard('signup'); setAuthError(null); setRegError(null); }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                            activeCard === 'signup'
                                                ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-lime-400 shadow-xs'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Staff Sign Up
                                    </button>
                                </div>
                            )}

                            {/* --- CARD VIEW 1: LOGIN --- */}
                            {activeCard === 'login' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <div className="mb-6">
                                        <h2 className="text-2xl sm:text-3xl font-black mb-1 text-slate-900 dark:text-slate-100 tracking-tight">Welcome Back</h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Log in to your Seaside dashboard.</p>
                                    </div>

                                    {regSuccess && (
                                        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                                            <span className="text-base leading-none">⏳</span>
                                            <span>{regSuccess}</span>
                                        </div>
                                    )}

                                    {authError && (
                                        <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-start">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{authError}</span>
                                        </div>
                                    )}

                                    <form className="space-y-4" onSubmit={handleLoginSubmit(onLogin)}>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                                                Username or Email
                                            </label>
                                            <input
                                                type="text"
                                                {...registerLogin('email', { required: true })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-lime-500/20 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all font-medium text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs"
                                                placeholder="name@seaside.com"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                    Password
                                                </label>
                                                <a href="#" className="text-xs font-bold text-green-700 dark:text-lime-400 hover:underline">
                                                    Forgot?
                                                </a>
                                            </div>
                                            <input
                                                type="password"
                                                {...registerLogin('password', { required: true })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-lime-500/20 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all font-medium text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoginSubmitting || isDemoLoading}
                                            className="w-full bg-[#8DB600] hover:bg-[#7ca000] text-white py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-md shadow-lime-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                                        >
                                            {isLoginSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Authenticating...
                                                </>
                                            ) : (
                                                <>
                                                    Sign In
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => { setActiveCard('signup'); setAuthError(null); setRegError(null); }}
                                            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-green-700 dark:hover:text-lime-400 transition-colors cursor-pointer"
                                        >
                                            New Seaside staff? <span className="underline font-bold text-green-700 dark:text-lime-400">Register an account</span>
                                        </button>
                                    </div>

                                    <div className="mt-5 relative flex items-center justify-center">
                                        <hr className="w-full border-slate-200 dark:border-slate-800" />
                                        <span className="absolute bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Or</span>
                                    </div>

                                    {/* High Contrast Try Demo Version Button */}
                                    <button
                                        type="button"
                                        onClick={handleDemoLogin}
                                        disabled={isLoginSubmitting || isDemoLoading}
                                        className="mt-5 w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 py-3 rounded-2xl font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 text-xs sm:text-sm shadow-2xs cursor-pointer"
                                    >
                                        {isDemoLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-600 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Loading Demo...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                                Try Demo Version
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* --- CARD VIEW 2: STAFF SIGN UP --- */}
                            {activeCard === 'signup' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <div className="mb-4">
                                        <h2 className="text-2xl sm:text-3xl font-black mb-1 text-slate-900 dark:text-slate-100 tracking-tight">Staff Sign Up</h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                                            Register for an account. An administrator will review and approve your access before login.
                                        </p>
                                    </div>

                                    {regError && (
                                        <div className="mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-start gap-2">
                                            <span>⚠️</span>
                                            <span>{regError}</span>
                                        </div>
                                    )}

                                    <form className="space-y-2.5" onSubmit={handleSignUpSubmit(onSignUp)}>
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                                                Full Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                {...registerSignUp('name', { required: 'Full name is required' })}
                                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-lime-500/20 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                                placeholder="Juan Dela Cruz"
                                            />
                                            {signUpErrors.name && <p className="text-rose-500 text-[10px] ml-1 font-semibold">{signUpErrors.name.message}</p>}
                                        </div>

                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                                                Email Address <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                {...registerSignUp('email', {
                                                    required: 'Email is required',
                                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                                                })}
                                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-lime-500/20 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                                placeholder="staff@seaside.com"
                                            />
                                            {signUpErrors.email && <p className="text-rose-500 text-[10px] ml-1 font-semibold">{signUpErrors.email.message}</p>}
                                        </div>

                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                                                Phone Number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                {...registerSignUp('phone', {
                                                    required: 'Phone number is required',
                                                    pattern: { value: /^[0-9+() -]{7,15}$/, message: 'Please enter a valid phone number' }
                                                })}
                                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-lime-500/20 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                                placeholder="0912 345 6789"
                                            />
                                            {signUpErrors.phone && <p className="text-rose-500 text-[10px] ml-1 font-semibold">{signUpErrors.phone.message}</p>}
                                        </div>

                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                                                Password <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                {...registerSignUp('password', {
                                                    required: 'Password is required',
                                                    minLength: { value: 6, message: 'Must be at least 6 characters' }
                                                })}
                                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-lime-500/20 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                                placeholder="••••••••"
                                            />
                                            {signUpErrors.password && <p className="text-rose-500 text-[10px] ml-1 font-semibold">{signUpErrors.password.message}</p>}
                                        </div>

                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                                                Confirm Password <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                {...registerSignUp('confirmPassword', {
                                                    required: 'Confirm your password',
                                                    validate: val => val === watchSignUp('password') || 'Passwords do not match'
                                                })}
                                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-lime-500/20 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                                placeholder="••••••••"
                                            />
                                            {signUpErrors.confirmPassword && <p className="text-rose-500 text-[10px] ml-1 font-semibold">{signUpErrors.confirmPassword.message}</p>}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSignUpSubmitting}
                                            className="w-full bg-[#8DB600] hover:bg-[#7ca000] text-white py-3 rounded-2xl font-black text-sm shadow-md shadow-lime-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-3"
                                        >
                                            {isSignUpSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Submitting Registration...
                                                </>
                                            ) : (
                                                <>
                                                    Submit for Admin Approval
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-center">
                                        <button
                                            type="button"
                                            onClick={() => { setActiveCard('login'); setRegError(null); }}
                                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-green-700 dark:hover:text-lime-400 transition-colors cursor-pointer"
                                        >
                                            Already registered? <span className="underline font-bold text-green-700 dark:text-lime-400">Sign in here</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* --- CARD VIEW 3: CONTACT --- */}
                            {activeCard === 'contact' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full">
                                    <div className="mb-5">
                                        <h2 className="text-2xl sm:text-3xl font-black mb-1 text-slate-900 dark:text-slate-100 tracking-tight">Contact Us</h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">We'd love to hear from you</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                                            <div className="flex items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                                                <svg className="w-4 h-4 mr-1.5 text-green-600 dark:text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                Business Hours:
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{businessHours}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                                            <div className="flex items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                                                <svg className="w-4 h-4 mr-1.5 text-green-600 dark:text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                Our Address:
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{physicalAddress}</p>
                                        </div>
                                    </div>
                                    <form className="space-y-3.5" onSubmit={handleContactSubmit(onContactSubmit)}>
                                        <div className="hidden"><label htmlFor="honeypot">Do not fill this out</label><input type="text" id="honeypot" {...registerContact('honeypot')} /></div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">Your Email Address</label>
                                            <input
                                                type="email"
                                                {...registerContact('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border ${contactErrors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-[#8DB600] dark:focus:border-lime-500 focus:ring-[#8DB600]/20'} rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm`}
                                                placeholder="example@email.com"
                                            />
                                            {contactErrors.email && <p className="text-rose-500 text-[10px] mt-0.5 ml-1 font-medium">{contactErrors.email.message}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">Message</label>
                                            <textarea
                                                rows="3"
                                                {...registerContact('message', { required: 'Message is required', minLength: { value: 10, message: 'Message must be at least 10 characters' }, maxLength: { value: 500, message: 'Message must be less than 500 characters' } })}
                                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border ${contactErrors.message ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-[#8DB600] dark:focus:border-lime-500 focus:ring-[#8DB600]/20'} rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none text-xs sm:text-sm`}
                                                placeholder="Write your message here..."
                                            ></textarea>
                                            {contactErrors.message && <p className="text-rose-500 text-[10px] mt-0.5 ml-1 font-medium">{contactErrors.message.message}</p>}
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                                            <button
                                                type="submit"
                                                disabled={isContactSubmitting}
                                                className="w-full sm:w-auto bg-[#8DB600] hover:bg-[#7ca000] text-white px-6 py-3 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                            >
                                                {isContactSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                                        Send Message
                                                    </>
                                                )}
                                            </button>
                                            <a
                                                href={settings?.facebook_link || "https://www.facebook.com/61587059323111/"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline font-bold transition-colors text-xs"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                                Message us on Facebook
                                            </a>
                                        </div>
                                    </form>
                                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setActiveCard('login')}
                                            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-green-700 dark:hover:text-lime-400 transition-colors inline-flex items-center cursor-pointer"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                            Back to Login
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-20 py-4 px-6 text-center text-xs font-medium text-slate-700/80 dark:text-slate-400 border-t border-white/40 dark:border-slate-800/80 bg-white/30 dark:bg-slate-950/60 backdrop-blur-md transition-colors">
                <p>
                    &copy; {new Date().getFullYear()} Seaside Purified Water Refilling Station. All rights reserved. • By <span className="font-bold text-green-800 dark:text-lime-400">tijnara</span>
                </p>
            </footer>

            {/* 20L Philippine Container Refilling Transition Overlay */}
            {isCinematicActive && (
                <CinematicAboutTransition onComplete={handleCinematicComplete} />
            )}
        </div>
    );
}

function Feature({ icon, text }) {
    const renderIcon = () => {
        switch (icon) {
            case 'analytics':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
            case 'inventory':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />;
            case 'finance':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
            case 'customer':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
            case 'delivery':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
            case 'social':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />;
            default:
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />;
        }
    };

    return (
        <div className="flex items-center space-x-3.5 text-slate-700 dark:text-slate-200">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-green-500/10 dark:bg-lime-950/60 flex items-center justify-center border border-green-400/30 dark:border-lime-500/30 text-green-600 dark:text-lime-400 shadow-2xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {renderIcon()}
                </svg>
            </div>
            <span className="font-bold text-xs sm:text-sm">{text}</span>
        </div>
    );
}

// =========================================================================
// 20-LITER WATER CONTAINER REFILLING TRANSITION ENGINE
// Uses the web app's Apple Green gradient (from-[#8DB600] via-lime-100 to-white)
// =========================================================================
function CinematicAboutTransition({ onComplete }) {
    const router = useRouter();
    const canvasRef = useRef(null);
    const [liters, setLiters] = useState('0.0');
    const [statusText, setStatusText] = useState('ALIGNING SANITARY NOZZLE...');
    const [progressPercent, setProgressPercent] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        const startTime = performance.now();
        const duration = 4400; // 4.4s filling sequence

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Aeration bubbles generated by high-pressure purified water jet
        const bubblePool = Array.from({ length: 65 }, () => ({
            x: 0,
            y: 0,
            radius: Math.random() * 3.5 + 1.2,
            speedY: Math.random() * 3.2 + 1.6,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.1 + 0.05,
            alpha: Math.random() * 0.7 + 0.3
        }));

        // Fine water mist particles at the fill surface
        const mistPool = Array.from({ length: 35 }, () => ({
            x: 0,
            y: 0,
            vx: (Math.random() - 0.5) * 4,
            vy: -(Math.random() * 3.2 + 1.2),
            radius: Math.random() * 2.2 + 0.8,
            life: Math.random()
        }));

        const render = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            setProgressPercent(progress * 100);

            // Liters counter: 0.0L to 20.0L
            const currentLiters = Math.min(20, progress * 21.2).toFixed(1);
            setLiters(currentLiters);

            if (progress < 0.14) {
                setStatusText('HIGH-PRESSURE SANITARY FLUSH...');
            } else if (progress < 0.88) {
                setStatusText('DISPENSING 21-STAGE PURIFIED WATER...');
            } else {
                setStatusText('20.0L SEAL COMPLETE • SYSTEM PURE');
            }

            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // 1. APPLE GREEN GRADIENT BACKGROUND (Identical to Web App Landing Page)
            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, '#7ca000'); // top-left deep apple green
            bgGrad.addColorStop(0.25, '#8DB600'); // Seaside brand apple green
            bgGrad.addColorStop(0.65, '#ecfccb'); // lime-100
            bgGrad.addColorStop(1, '#ffffff'); // crisp white
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Soft radiant white backlight behind container
            const backlight = ctx.createRadialGradient(cx, cy, 30, cx, cy, 380);
            backlight.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
            backlight.addColorStop(0.55, 'rgba(255, 255, 255, 0.25)');
            backlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = backlight;
            ctx.fillRect(0, 0, w, h);

            // Stainless Steel Bay Drip Tray Base Grate (Beveled Chrome)
            ctx.save();
            ctx.shadowColor = 'rgba(20, 50, 10, 0.15)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 8;
            ctx.fillStyle = '#475569';
            ctx.fillRect(cx - 165, cy + 185, 330, 24);

            ctx.fillStyle = '#64748b';
            ctx.fillRect(cx - 165, cy + 185, 330, 4);

            ctx.fillStyle = '#1e293b';
            for (let rx = cx - 145; rx <= cx + 145; rx += 18) {
                ctx.fillRect(rx, cy + 189, 8, 18);
            }
            ctx.restore();

            // =================================================================
            // 2. PHILIPPINE 20-LITER ROUND WATER CARBOY (BLUE POLYCARBONATE)
            // =================================================================
            const jugW = 190;
            const jugH = 270;
            const jugX = cx - jugW / 2;
            const jugY = cy - 90;

            const fillRatio = Math.max(0, Math.min(1, (progress - 0.1) / 0.78));
            const waterHeight = jugH * fillRatio * 0.88;
            const waterSurfaceY = (jugY + jugH) - waterHeight - 6;

            // A. Molded Ergonomic Carry Handle (Right Side)
            ctx.save();
            ctx.strokeStyle = '#0284c7';
            ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(jugX + jugW + 12, jugY + jugH * 0.42, 18, 44, 0, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
            ctx.fill();

            // Handle interior grip hole
            ctx.fillStyle = 'rgba(236, 252, 203, 0.85)';
            ctx.beginPath();
            ctx.ellipse(jugX + jugW + 10, jugY + jugH * 0.42, 9, 30, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // B. Container Body Shell (Polycarbonate Blue Tint)
            ctx.save();
            ctx.shadowColor = 'rgba(14, 165, 233, 0.25)';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 4;
            ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';

            ctx.beginPath();
            ctx.moveTo(cx - 24, jugY - 26);
            ctx.lineTo(cx - 24, jugY);
            ctx.quadraticCurveTo(cx - 24, jugY + 22, jugX + 16, jugY + 36);
            ctx.lineTo(jugX, jugY + 50);
            ctx.lineTo(jugX, jugY + jugH - 16);
            ctx.quadraticCurveTo(jugX, jugY + jugH, jugX + 24, jugY + jugH);
            ctx.lineTo(jugX + jugW - 24, jugY + jugH);
            ctx.quadraticCurveTo(jugX + jugW, jugY + jugH, jugX + jugW, jugY + jugH - 16);
            ctx.lineTo(jugX + jugW, jugY + 50);
            ctx.quadraticCurveTo(cx + 24, jugY + 22, cx + 24, jugY);
            ctx.lineTo(cx + 24, jugY - 26);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // C. 3 Molded Reinforcement Ribbed Rings
            ctx.strokeStyle = 'rgba(2, 132, 199, 0.55)';
            ctx.lineWidth = 2.6;
            const ribOffsets = [0.32, 0.52, 0.72];
            ribOffsets.forEach(ratio => {
                const ry = jugY + jugH * ratio;
                ctx.beginPath();
                ctx.ellipse(cx, ry, (jugW / 2) - 4, 10, 0, 0, Math.PI);
                ctx.stroke();
            });

            // Container Neck Collar Ring
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(cx - 28, jugY - 14, 56, 12);

            // D. Rising Purified Water Body & Surface
            if (fillRatio > 0.02) {
                ctx.save();

                ctx.beginPath();
                ctx.moveTo(cx - 22, jugY);
                ctx.quadraticCurveTo(cx - 22, jugY + 22, jugX + 18, jugY + 36);
                ctx.lineTo(jugX + 4, jugY + 50);
                ctx.lineTo(jugX + 4, jugY + jugH - 16);
                ctx.quadraticCurveTo(jugX + 4, jugY + jugH - 4, jugX + 24, jugY + jugH - 4);
                ctx.lineTo(jugX + jugW - 24, jugY + jugH - 4);
                ctx.quadraticCurveTo(jugX + jugW - 4, jugY + jugH - 4, jugX + jugW - 4, jugY + jugH - 16);
                ctx.lineTo(jugX + jugW - 4, jugY + 50);
                ctx.quadraticCurveTo(cx + 22, jugY + 22, cx + 22, jugY);
                ctx.closePath();
                ctx.clip();

                // Crystal Clear Sparkling Water Gradient
                const waterGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, jugY + jugH);
                waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
                waterGrad.addColorStop(0.35, 'rgba(14, 165, 233, 0.85)');
                waterGrad.addColorStop(1, 'rgba(2, 132, 199, 0.95)');
                ctx.fillStyle = waterGrad;

                // Sloshing water surface
                ctx.beginPath();
                ctx.moveTo(jugX - 10, jugY + jugH + 20);
                ctx.lineTo(jugX - 10, waterSurfaceY);
                for (let wx = jugX - 10; wx <= jugX + jugW + 10; wx += 8) {
                    const waveY = waterSurfaceY + Math.sin(wx * 0.08 + now * 0.012) * 3.5;
                    ctx.lineTo(wx, waveY);
                }
                ctx.lineTo(jugX + jugW + 20, jugY + jugH + 20);
                ctx.closePath();
                ctx.fill();

                // Crisp White Surface Water Meniscus
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(cx, waterSurfaceY, (jugW / 2) - 12, 6, 0, 0, Math.PI);
                ctx.stroke();

                // Rising Aeration Bubbles
                bubblePool.forEach(b => {
                    b.wobble += b.wobbleSpeed;
                    const bx = cx + Math.sin(b.wobble) * ((jugW / 2) - 24);

                    if (b.y < waterSurfaceY || b.y > (jugY + jugH)) {
                        b.y = jugY + jugH - 10 - Math.random() * waterHeight;
                    }

                    ctx.beginPath();
                    ctx.arc(bx, b.y, b.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
                    ctx.fill();
                    b.y -= b.speedY;
                });

                ctx.restore();
            }

            // E. Curved Polycarbonate Gloss Highlights
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.moveTo(jugX + 22, jugY + 38);
            ctx.lineTo(jugX + 34, jugY + 38);
            ctx.lineTo(jugX + 26, jugY + jugH - 24);
            ctx.lineTo(jugX + 16, jugY + jugH - 24);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(jugX + jugW - 28, jugY + 45, 8, jugH - 75);
            ctx.restore();

            // =================================================================
            // 3. STAINLESS STEEL NOZZLE & DISPENSING PURIFIED JET STREAM
            // =================================================================
            const nozzleY = jugY - 55;

            ctx.fillStyle = '#475569';
            ctx.fillRect(cx - 16, nozzleY - 70, 32, 70);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(cx - 6, nozzleY - 70, 10, 70);

            ctx.fillStyle = '#64748b';
            ctx.fillRect(cx - 22, nozzleY, 44, 14);

            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(cx - 8, nozzleY + 14, 16, 26);

            // Active laminar water stream
            if (progress >= 0.1 && progress <= 0.88) {
                const jetEndY = Math.min(jugY + jugH - 12, waterSurfaceY + 12);

                const jetGrad = ctx.createLinearGradient(cx - 7, 0, cx + 7, 0);
                jetGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
                jetGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.85)');
                jetGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
                ctx.fillStyle = jetGrad;
                ctx.fillRect(cx - 6, nozzleY + 38, 12, jetEndY - (nozzleY + 38));

                mistPool.forEach(m => {
                    ctx.beginPath();
                    ctx.arc(cx + m.x, waterSurfaceY + m.y, m.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${m.life * 0.9})`;
                    ctx.fill();

                    m.x += m.vx;
                    m.y += m.vy;
                    m.life -= 0.04;
                    if (m.life <= 0) {
                        m.life = 1;
                        m.x = (Math.random() - 0.5) * 16;
                        m.y = 0;
                        m.vy = -(Math.random() * 3 + 1);
                    }
                });

                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(cx, nozzleY + 40, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Sealed Non-Spill Cap (when 90% full)
            if (progress > 0.88) {
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(cx - 26, jugY - 26, 52, 18);
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(cx - 24, jugY - 24, 48, 5);

                // Red sanitary seal strip
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(cx - 6, jugY - 26, 12, 28);
            }

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(render);
            } else {
                if (onComplete) onComplete();
                else router.push('/about');
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [router, onComplete]);

    const handleSkip = () => {
        if (onComplete) onComplete();
        else router.push('/about');
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-[#8DB600] via-lime-100 to-white select-none overflow-hidden animate-in fade-in duration-300">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Top Bay Monitor (Frosted Glass Panel matching Landing Page style) */}
            <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-white/60 dark:border-slate-800/80 flex items-center justify-between px-5 sm:px-10 z-20 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#8DB600] animate-ping"></div>
                    <div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-green-800 dark:text-lime-400 uppercase block">
                            SEASIDE WATER REFILLING STATION • BAY 01
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wide">
                            20-LITER ROUND PURIFIED CONTAINER
                        </span>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-6 font-mono text-xs">
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Water Quality</span>
                        <span className="font-bold text-[#8DB600] dark:text-lime-400">TDS: 002 PPM • 21-STAGE RO</span>
                    </div>
                    <div className="text-right border-l border-slate-300 dark:border-slate-700 pl-6">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Location</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Laois, Labrador, Pangasinan</span>
                    </div>
                </div>
            </div>

            {/* Bottom Digital Liters Meter HUD (Frosted Glass with Apple Green & Slate-900 accents) */}
            <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex flex-col items-center justify-center z-20 pointer-events-none px-4">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl px-7 py-4 shadow-2xl shadow-green-950/15 flex items-center gap-6 sm:gap-10">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-mono font-black text-green-800 dark:text-lime-400 tabular-nums">
                            {liters}
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-500">/ 20.0 L</span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

                    <div className="w-36 sm:w-56">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                            <span className="text-green-700 dark:text-lime-400 font-bold uppercase">{statusText}</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                            <div
                                className="h-full bg-gradient-to-r from-[#8DB600] via-lime-400 to-green-600 transition-all duration-75 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Skip Button */}
            <button
                type="button"
                onClick={handleSkip}
                className="absolute top-22 sm:top-24 right-5 sm:right-10 z-50 px-4 py-2 rounded-full bg-white/90 hover:bg-[#8DB600] hover:text-white text-slate-800 border border-white/80 hover:border-[#8DB600] text-xs font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-lg shadow-green-950/10 flex items-center gap-1.5"
            >
                <span>SKIP TO ABOUT</span>
                <span>&rarr;</span>
            </button>
        </div>
    );
}