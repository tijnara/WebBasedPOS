import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useStore } from '../../store/useStore';
import api from '../../lib/api';
import {
    Button,
    Input,
    Label,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../ui';

// ... (LoadingSpinner, EyeIcon, EyeOffIcon, UserIcon components remain the same) ...
// Simple SVG Icon for loading
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Icons for Password Visibility (Unchanged)
const EyeIcon = () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const EyeOffIcon = () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
);

// Icon for Demo Button (Unchanged)
const UserIcon = () => (
    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);


const LoginPage = () => {
    // ... (state and handlers remain the same) ...
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();

    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        description: '',
    });

    const closeModal = () => {
        setModal({ isOpen: false, title: '', description: '' });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        try {
            const userData = await api.login({ email, password });
            setAuth(userData);
            addToast({ title: 'Login Successful', description: `Welcome back, ${userData.name}!`, variant: 'success' });
            router.push('/');

        } catch (err) {
            console.error('Login page error:', err);
            setModal({
                isOpen: true,
                title: 'Login Failed',
                description: err.message || 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = (e) => {
        e.preventDefault();
        // 1. Create a mock demo user object
        const demoUser = {
            id: 99999, // Use a number (bigint) instead of string to match the users table ID type
            name: 'Demo User',
            email: 'demo@seaside.com',
            phone: '09123456789',
            dateadded: new Date().toISOString(),
            isDemo: true // <-- This is the crucial flag
        };
        // 2. Use setAuth to store this user in state & sessionStorage
        setAuth(demoUser);
        // 3. Show a toast and redirect
        addToast({ title: 'Demo Mode Activated', description: `Welcome, ${demoUser.name}!`, variant: 'success' });
        router.push('/');
    };

    return (
        /* UPDATED: Assuming page background is bg-gray-100 from _app.js */
        <div className="flex h-screen w-full items-center justify-center p-2 md:p-4 overflow-hidden bg-gray-100">
            {/* UPDATED: Removed bg-white, rounded-3xl, shadow-2xl and prefixed them with md: */}
            <div className="md:bg-white md:rounded-3xl md:shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row h-full md:h-auto items-center md:items-stretch">

                {/* Image Column */}
                {/* UPDATED: Added padding back for mobile */ }
                <div className="w-full md:w-1/2 flex items-center justify-center h-full p-4 pb-0 md:p-12 order-1 md:order-1">
                    <Image
                        src="/seasideHD_.png"
                        alt="Seaside Purified Water Refilling Station"
                        priority
                        style={{ objectFit: 'contain' }}
                        /* UPDATED: Removed border and rounded for mobile */
                        className="md:rounded-2xl md:border md:border-slate-200 w-full h-full max-w-[150px] max-h-[150px] md:max-w-[600px] md:max-h-[600px]"
                        width={600}
                        height={600}
                    />
                </div>

                {/* Form Column */}
                {/* UPDATED: Added px-4 for mobile spacing */ }
                <div className="w-full md:w-1/2 flex flex-col justify-center h-full px-4 pt-0 md:p-12 order-2 md:order-2 overflow-y-auto md:overflow-hidden">
                    <div className="">
                        <div className="mb-4 md:mb-10">
                            <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-gray-900">Welcome Back</h1>
                            <p className="text-sm md:text-base text-gray-500">Please log in to your station.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-3 md:space-y-5" autoComplete="off">
                            {/* ... (form content remains the same) ... */}
                            <div>
                                <Label htmlFor="no_autofill_email" className="text-sm font-medium text-gray-700 mb-1">Email Address</Label>
                                <Input
                                    id="no_autofill_email"
                                    name="no_autofill_email"
                                    type="email"
                                    autoComplete="nope"
                                    spellCheck={false}
                                    readOnly
                                    onFocus={e => e.target.removeAttribute('readOnly')}
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-white border border-gray-300 focus:border-success focus:ring-2 focus:ring-success/20 rounded-xl px-4 py-3 text-base transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="no_autofill_password" className="text-sm font-medium text-gray-700 mb-1">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="no_autofill_password"
                                        name="no_autofill_password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="nope"
                                        spellCheck={false}
                                        readOnly
                                        onFocus={e => e.target.removeAttribute('readOnly')}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-white border border-gray-300 focus:border-success focus:ring-2 focus:ring-success/20 rounded-xl px-4 py-3 text-base transition-all pr-12 shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-success border-gray-300 rounded focus:ring-success"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <Label htmlFor="remember-me" className="mb-0 text-sm text-gray-600 font-medium">Remember Me</Label>
                                </div>
                                <a
                                    href="#"
                                    className="text-sm font-semibold text-success hover:text-success-hover transition-colors"
                                >
                                    Forgot Password?
                                </a>
                            </div>
                            <Button
                                type="submit"
                                variant="success"
                                size="lg"
                                className="w-full shadow-lg hover:shadow-xl hover:opacity-95 transition-all rounded-xl text-lg font-bold py-3 md:py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-success to-green-500"
                                disabled={isLoading}
                            >
                                {isLoading ? (<><LoadingSpinner /> Logging in...</>) : 'Log In'}
                            </Button>
                        </form>

                        <div className="relative my-4 md:my-8">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                {/* UPDATED: Changed bg-white to bg-gray-100 (page bg) on mobile */}
                                <span className="bg-gray-100 md:bg-white px-4 text-sm font-medium text-gray-500">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-center gap-2 py-3 rounded-xl shadow-sm hover:bg-gray-50"
                                onClick={handleDemoLogin}
                                disabled={isLoading}
                            >
                                <UserIcon />
                                Log in as Demo User
                            </Button>
                        </div>
                    </div>

                    <footer className="mt-4 pt-4 p-2 md:p-4 text-center text-xs text-gray-500 border-t border-gray-100 hidden md:block">
                        <p>Copyright &copy; 2025 Seaside POS. SEASIDE&trade; is a trademark of Seaside, LLC.</p>
                        <div className="mt-1 space-x-2">
                            <a href="#" className="hover:text-gray-700">Terms of Service</a>
                            <span>|</span>
                            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
                        </div>
                    </footer>
                </div>

            </div>

            {/* ... (Error Modal remains the same) ... */}
            <Dialog open={modal.isOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 animate-pulse">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <DialogTitle className="text-center mt-3 text-lg font-bold text-red-600">{modal.title}</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 text-center text-sm text-gray-600">
                        <p>{modal.description}</p>
                    </div>
                    <DialogFooter className="justify-center">
                        <Button variant="destructive" onClick={closeModal} className="w-full rounded-lg">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default LoginPage;