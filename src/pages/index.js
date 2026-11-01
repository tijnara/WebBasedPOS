// src/pages/index.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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

    // Pre-cache the About page for fast routing
    useEffect(() => {
        router.prefetch('/about');
    }, [router]);

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
                        <Link
                            href="/about"
                            className="text-slate-700 dark:text-slate-200 hover:text-green-700 dark:hover:text-lime-400 transition-colors duration-200 cursor-pointer font-bold relative z-10"
                        >
                            About
                        </Link>

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