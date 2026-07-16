import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export default function SeasideNewLanding() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const setAuth = useStore(state => state.setAuth);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (email === 'demo@gmail.com' && password === 'demodemo') {
            handleDemoLogin();
            setIsLoading(false);
            return;
        }

        try {
            const { data: userPayload, error: authError } = await supabase.rpc(
                'authenticate_user',
                {
                    p_email: email,
                    p_password: password,
                }
            );

            if (authError) throw authError;

            if (userPayload) {
                const finalPayload = { ...userPayload, isDemo: false };
                setAuth(finalPayload);
                router.push('/pos');
            } else {
                setError('Invalid email or password.');
            }
        } catch (err) {
            console.error('Login exception:', err.message);
            setError('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-apple-green to-white relative overflow-hidden font-sans text-slate-800 flex flex-col">
            <Head>
                <title>Seaside | Welcome</title>
                <meta name="description" content="Seaside Enterprise Management System" />
            </Head>

            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-lime-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            {/* Top Navigation - Updated for Mobile Visibility */}
            <nav className="relative z-20 flex justify-between items-center p-4 sm:p-6 lg:px-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 font-extrabold text-xl sm:text-2xl tracking-tight">
                    {/* Logo scaled down slightly on mobile to prevent overlapping */}
                    <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center">
                        <img src="/seasidelogo_.png" alt="Seaside Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-green-800">Seaside</span>
                </div>

                {/* Removed 'hidden md:flex' so links show on mobile, adjusted spacing dynamically */}
                <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-10 text-sm font-semibold tracking-wide relative z-50">
                    <a
                        href="/about"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/about';
                        }}
                        className="hover:text-green-700 transition-colors duration-300 cursor-pointer"
                    >
                        About
                    </a>
                    <a href="#contact" className="hover:text-green-700 transition-colors duration-300">Contact</a>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-6">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Side: Hero Text & Features */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center space-x-2 bg-black/5 backdrop-blur-md border border-black/10 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest text-green-800 uppercase shadow-xl">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span>Water Station Management</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                            Streamline your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-600">
                                Water Business
                            </span>
                        </h1>

                        <p className="text-lg text-slate-600/80 max-w-lg leading-relaxed">
                            The all-in-one platform built specifically for water refilling stations. Manage your sales, deliveries, inventory, and customers effortlessly.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <Feature text="Real-time Sales Tracking" />
                            <Feature text="Customer Management" />
                            <Feature text="Inventory & Spoilage" />
                            <Feature text="Delivery Routing" />
                        </div>
                    </div>

                    {/* Right Side: Login Card */}
                    <div className="bg-white/70 backdrop-blur-xl text-slate-800 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-green-900/20 border border-white/30 relative">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-lime-400 to-green-500 rounded-full blur-2xl opacity-50 z-0"></div>

                        <div className="relative z-10">
                            <div className="mb-10">
                                <h2 className="text-3xl font-extrabold mb-2 text-slate-900">Welcome Back</h2>
                                <p className="text-slate-500 font-medium">Log in to your Seaside dashboard.</p>
                            </div>

                            {error && (
                                <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 flex items-start">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    {error}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleLogin}>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Username or Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                                        placeholder="name@seaside.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-sm font-bold text-slate-700">Password</label>
                                        <a href="#" className="text-xs font-bold text-green-600 hover:text-green-700">Forgot?</a>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || isDemoLoading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            Sign In
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 relative flex items-center justify-center">
                                <hr className="w-full border-slate-200" />
                                <span className="absolute bg-white/70 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Or</span>
                            </div>

                            <button
                                onClick={handleDemoLogin}
                                disabled={isLoading || isDemoLoading}
                                className="mt-6 w-full border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 py-3 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isDemoLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Loading Demo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        Try Demo Version
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

// Helper component for the feature list items
function Feature({ text }) {
    return (
        <div className="flex items-center space-x-3 text-slate-600">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-400/30">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <span className="font-medium text-sm">{text}</span>
        </div>
    );
}