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
import { useCustomers } from '../../hooks/useCustomers';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { UserIcon, ChartIcon, PackageIcon } from '../Icons';
import currency from 'currency.js';

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

const LoginPage = () => {
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
            router.push('/dashboard');

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

    const handleDemoAdminLogin = (e) => {
        e.preventDefault();
        const demoAdmin = {
            id: 99999, name: 'Demo Admin', email: 'demo.admin@seaside.com', phone: '09123456789',
            dateadded: new Date().toISOString(), role: 'Admin', isDemo: true
        };
        setAuth(demoAdmin);
        addToast({ title: 'Demo Admin Activated', description: `Welcome, ${demoAdmin.name}!`, variant: 'success' });
        router.push('/dashboard');
    };

    const handleDemoStaffLogin = (e) => {
        e.preventDefault();
        const demoStaff = {
            id: 88888, name: 'Demo Staff', email: 'demo.staff@seaside.com', phone: '09987654321',
            dateadded: new Date().toISOString(), role: 'Staff', isDemo: true
        };
        setAuth(demoStaff);
        addToast({ title: 'Demo Staff Activated', description: `Welcome, ${demoStaff.name}!`, variant: 'success' });
        router.push('/dashboard');
    };

    // Data fetching for the public dashboard part
    const { data: custData } = useCustomers({ itemsPerPage: 1 });
    const { data: newCustData } = useNewCustomersByDateSummary();
    const newThisWeek = newCustData?.slice(0, 7).reduce((sum, day) => sum + Number(day.total_customers), 0) || 0;

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gray-100">
            <div className="md:bg-white md:rounded-3xl md:shadow-2xl overflow-hidden max-w-6xl w-full flex flex-col md:flex-row h-full md:h-auto">
                
                {/* Left Column: Brand & Dashboard (Visible to Visitors) */}
                <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center text-gray-900 order-2 md:order-1">
                    <div className="mb-8 flex items-center gap-3">
                        <Image src="/seaside.png" alt="Logo" width={60} height={60} className="bg-white rounded-full p-1" />
                        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Seaside Water Refilling Station</h1>
                    </div>

                    <h2 className="text-xl font-semibold mb-6 text-gray-800">Our Station at a Glance</h2>
                    
                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                            <div className="text-3xl font-extrabold text-blue-600">{custData?.totalCount || '...'}</div>
                            <div className="text-blue-800 text-xs font-medium uppercase">Total Families Served</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                            <div className="text-3xl font-extrabold text-green-600">+{newThisWeek}</div>
                            <div className="text-green-800 text-xs font-medium uppercase">New This Week</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden border border-gray-200">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.4274905503635!2d120.12964557417915!3d16.043291340133674!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1770950130024!5m2!1sen!2sph" 
                                width="100%" 
                                height="100%" 
                                style={{ border:0 }} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade">
                            </iframe>
                        </div>
                    </div>
                </div>

                {/* Right Column: Login Form */}
                <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12 bg-white order-1 md:order-2">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Staff Portal</h1>
                        <p className="text-gray-500 text-sm">Please log in to manage operations.</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-3 md:space-y-5" autoComplete="off">
                        <div>
                            <Label htmlFor="no_autofill_email" className="text-sm font-medium text-gray-700 mb-1">Email Address</Label>
                            <Input
                                id="no_autofill_email" name="no_autofill_email" type="email"
                                autoComplete="nope" spellCheck={false} readOnly onFocus={e => e.target.removeAttribute('readOnly')}
                                placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                                required disabled={isLoading}
                                className="bg-white border border-gray-300 focus:border-success focus:ring-2 focus:ring-success/20 rounded-xl px-4 py-3 text-base transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="no_autofill_password" className="text-sm font-medium text-gray-700 mb-1">Password</Label>
                            <div className="relative">
                                <Input
                                    id="no_autofill_password" name="no_autofill_password" type={showPassword ? 'text' : 'password'}
                                    autoComplete="nope" spellCheck={false} readOnly onFocus={e => e.target.removeAttribute('readOnly')}
                                    placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                                    required disabled={isLoading}
                                    className="bg-white border border-gray-300 focus:border-success focus:ring-2 focus:ring-success/20 rounded-xl px-4 py-3 text-base transition-all pr-12 shadow-sm"
                                />
                                <button
                                    type="button" onClick={() => setShowPassword(!showPassword)}
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
                                    id="remember-me" type="checkbox"
                                    className="h-4 w-4 text-success border-gray-300 rounded focus:ring-success"
                                    checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <Label htmlFor="remember-me" className="mb-0 text-sm text-gray-600 font-medium">Remember Me</Label>
                            </div>
                            <a href="#" className="text-sm font-semibold text-success hover:text-success-hover transition-colors">
                                Forgot Password?
                            </a>
                        </div>
                        <Button
                            type="submit" variant="success" size="lg"
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
                            <span className="bg-white px-4 text-sm font-medium text-gray-500">
                                Or
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            type="button" variant="outline"
                            className="w-full justify-center gap-2 py-3 rounded-xl shadow-sm hover:bg-gray-50"
                            onClick={handleDemoAdminLogin} disabled={isLoading}
                        >
                            <UserIcon />
                            Log in as Demo Admin
                        </Button>
                        <Button
                            type="button" variant="outline"
                            className="w-full justify-center gap-2 py-3 rounded-xl shadow-sm hover:bg-gray-50"
                            onClick={handleDemoStaffLogin} disabled={isLoading}
                        >
                            <UserIcon />
                            Log in as Demo Staff
                        </Button>
                    </div>
                </div>
            </div>

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
