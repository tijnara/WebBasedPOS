import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';
import { useSettings } from '../hooks/useSettings';

export default function SeasideNewLanding() {
    const router = useRouter();

    // --- Settings and Global State ---
    const { data: settings } = useSettings() || {};
    const businessHours = settings?.business_hours || 'Monday - Saturday: 8:00 AM - 5:00 PM for Delivery\nMonday, Wednesday, Friday and Saturday: 8:00 AM - 5:00 PM';
    const physicalAddress = settings?.physical_address || 'Laois, Labrador, Pangasinan';
    const setAuth = useStore(state => state.setAuth);

    // --- UI State ---
    const [authError, setAuthError] = useState(null);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [activeCard, setActiveCard] = useState('login');

    // --- Login Form Logic (with react-hook-form) ---
    const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { isSubmitting: isLoginSubmitting } } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onLogin = async (data) => {
        setAuthError(null);

        if (data.email === 'demo@gmail.com' && data.password === 'demodemo') {
            handleDemoLogin();
            return;
        }

        try {
            const { data: userPayload, error: rpcError } = await supabase.rpc(
                'authenticate_user',
                {
                    p_email: data.email,
                    p_password: data.password,
                }
            );

            if (rpcError) throw rpcError;

            if (userPayload) {
                const finalPayload = { ...userPayload, isDemo: false };
                setAuth(finalPayload);
                router.push('/pos');
            } else {
                setAuthError('Invalid email or password.');
            }
        } catch (err) {
            console.error('Login exception:', err.message);
            setAuthError('An error occurred during login. Please try again.');
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
    const { register: registerContact, handleSubmit: handleContactSubmit, formState: { errors: contactErrors, isSubmitting: isContactSubmitting }, reset: resetContact } = useForm({
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#8DB600] to-white relative overflow-hidden font-sans text-slate-800 flex flex-col">
            <Head>
                <title>Seaside | Welcome</title>
                <meta name="description" content="Seaside Enterprise Management System" />
            </Head>

            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-lime-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

            {/* Navigation */}
            <nav className="relative z-20 flex justify-between items-center p-4 sm:p-6 lg:px-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 font-extrabold text-xl sm:text-2xl tracking-tight">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center">
                        <img src="/seasidelogo_.png" alt="Seaside Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-900 to-teal-800">Seaside</span>
                </div>
                <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-10 text-sm font-semibold tracking-wide relative z-50">
                    <a href="/about" onClick={(e) => { e.preventDefault(); window.location.href = '/about'; }} className="hover:text-green-700 transition-colors duration-300 cursor-pointer">About</a>
                    <button onClick={() => setActiveCard(activeCard === 'login' ? 'contact' : 'login')} className="hover:text-green-700 transition-colors duration-300 cursor-pointer outline-none font-semibold">
                        {activeCard === 'login' ? 'Contact' : 'Login'}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-6">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left Side */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center space-x-2 bg-black/5 backdrop-blur-md border border-black/10 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest text-green-800 uppercase shadow-xl">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span>Water Station Management</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                            Streamline your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-600">Water Business</span>
                        </h1>
                        <p className="text-lg text-slate-600/80 max-w-lg leading-relaxed">
                            The all-in-one platform built specifically for water refilling stations. Manage your sales, deliveries, inventory, and customers effortlessly.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <Feature text="Real-time Sales Tracking" /><Feature text="Customer Management" />
                            <Feature text="Inventory & Spoilage" /><Feature text="Delivery Routing" />
                        </div>
                    </div>

                    {/* Right Side Card */}
                    <div className="bg-white/70 backdrop-blur-xl text-slate-800 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-green-900/20 border border-white/40 relative overflow-hidden transition-all duration-500 min-h-[580px] flex flex-col justify-center">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-lime-400 to-green-500 rounded-full blur-2xl opacity-50 z-0"></div>
                        <div className="relative z-10 w-full">
                            {activeCard === 'login' ? (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <div className="mb-10"><h2 className="text-3xl font-extrabold mb-2 text-slate-900">Welcome Back</h2><p className="text-slate-500 font-medium">Log in to your Seaside dashboard.</p></div>
                                    {authError && <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 flex items-start"><svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{authError}</div>}
                                    <form className="space-y-6" onSubmit={handleLoginSubmit(onLogin)}>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Username or Email</label>
                                            <input type="email" {...registerLogin('email', { required: true })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-900 placeholder-slate-400" placeholder="name@seaside.com" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center ml-1"><label className="text-sm font-bold text-slate-700">Password</label><a href="#" className="text-xs font-bold text-green-600 hover:text-green-700">Forgot?</a></div>
                                            <input type="password" {...registerLogin('password', { required: true })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-900 placeholder-slate-400" placeholder="••••••••" />
                                        </div>
                                        <button type="submit" disabled={isLoginSubmitting || isDemoLoading} className="w-full bg-[#8DB600] hover:bg-lime-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-lime-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70">
                                            {isLoginSubmitting ? <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Authenticating...</> : <>Sign In<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></>}
                                        </button>
                                    </form>
                                    <div className="mt-6 relative flex items-center justify-center"><hr className="w-full border-slate-200" /><span className="absolute bg-white/70 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Or</span></div>
                                    <button onClick={handleDemoLogin} disabled={isLoginSubmitting || isDemoLoading} className="mt-6 w-full border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 py-3 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70">
                                        {isDemoLoading ? <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading Demo...</> : <><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>Try Demo Version</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
                                    <div className="mb-6"><h2 className="text-3xl font-extrabold mb-1 text-slate-900">Contact Us</h2><p className="text-slate-500 font-medium text-sm">We'd love to hear from you</p></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                        <div><div className="flex items-center text-sm font-bold text-slate-800 mb-1"><svg className="w-4 h-4 mr-1.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Business Hours:</div><p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{businessHours}</p></div>
                                        <div><div className="flex items-center text-sm font-bold text-slate-800 mb-1"><svg className="w-4 h-4 mr-1.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>Our Address:</div><p className="text-xs text-slate-500 leading-relaxed">{physicalAddress}</p></div>
                                    </div>
                                    <form className="space-y-4" onSubmit={handleContactSubmit(onContactSubmit)}>
                                        <div className="hidden"><label htmlFor="honeypot">Do not fill this out</label><input type="text" id="honeypot" {...registerContact('honeypot')} /></div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700 ml-1">Your Email Address</label>
                                            <input type="email" {...registerContact('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} className={`w-full px-5 py-4 bg-slate-50 border ${contactErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'} rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 placeholder-slate-400 text-sm`} placeholder="@ example@email.com" />
                                            {contactErrors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{contactErrors.email.message}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700 ml-1">Message</label>
                                            <textarea rows="4" {...registerContact('message', { required: 'Message is required', minLength: { value: 10, message: 'Message must be at least 10 characters' }, maxLength: { value: 500, message: 'Message must be less than 500 characters' } })} className={`w-full px-5 py-4 bg-slate-50 border ${contactErrors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'} rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-900 placeholder-slate-400 resize-none text-sm`} placeholder="Write your message here..."></textarea>
                                            {contactErrors.message && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{contactErrors.message.message}</p>}
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                                            <button type="submit" disabled={isContactSubmitting} className="w-full sm:w-auto bg-[#8DB600] hover:bg-lime-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-lime-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70">
                                                {isContactSubmitting ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Sending...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>Send Message</>}
                                            </button>
                                            <a href={settings?.facebook_link || "https://www.facebook.com/61587059323111/"} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700 font-bold transition-colors text-sm">
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                                Message us on Facebook
                                            </a>
                                        </div>
                                    </form>
                                    <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                                        <button onClick={() => setActiveCard('login')} className="text-xs font-bold text-slate-500 hover:text-green-600 transition-colors inline-flex items-center">
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