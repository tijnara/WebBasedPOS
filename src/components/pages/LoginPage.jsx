import React, { useState, useEffect } from 'react';
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
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { UserIcon } from '../Icons';

// --- HELPER COMPONENTS ---

const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

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

// --- CUSTOMER-FACING WELCOME CENTER ---

const CustomerWelcome = () => {
    const { data: custData } = useCustomers({ itemsPerPage: 1 });
    const { data: newCustData } = useNewCustomersByDateSummary();
    const newThisWeek = newCustData?.slice(0, 7).reduce((sum, day) => sum + Number(day.total_customers), 0) || 0;

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkOpenStatus = () => {
            const now = new Date();
            const day = now.getDay(); // Sunday = 0, Monday = 1, etc.
            const hours = now.getHours();
            // Mon-Sat: 8 AM to 6 PM (18:00)
            const isWeekdayOpen = day >= 1 && day <= 6 && hours >= 8 && hours < 18;
            setIsOpen(isWeekdayOpen);
        };
        checkOpenStatus();
        const timer = setInterval(checkOpenStatus, 60000); // Check every minute
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full md:w-3/5 p-8 md:p-16 bg-gradient-to-br from-white to-purple-50 order-2 md:order-1 overflow-y-auto max-h-full">
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-primary leading-tight tracking-tighter">
                    Pure Water. <br/>Pure Trust.
                </h1>
                <p className="text-gray-500 mt-4 text-lg max-w-md">
                    Delivering fresh, purified water to the families of Labrador.
                </p>
            </div>

            {/* Live Dashboard / Community Proof */}
            <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                    <div className="text-4xl font-black text-primary">{custData?.totalCount || 0}</div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Families Served</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                    <div className="text-4xl font-black text-green-500">+{newThisWeek}</div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">New This Week</div>
                </div>
            </div>

            {/* Quick Info Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl border border-gray-50">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">💧</span>
                        <div className="font-bold text-primary">Water Type</div>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white text-xs font-bold rounded-full border border-primary/20 text-primary">Purified</span>
                    </div>
                </div>
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
            <a href="https://www.facebook.com/61587059323111/" target="_blank" rel="noopener noreferrer" className="mt-10 flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-6 text-lg font-bold text-white shadow-xl transition-transform hover:scale-[1.02]">
                Message us on Facebook
            </a>
        </div>
    );
};

// --- STAFF LOGIN FORM ---

const StaffLogin = ({ onLogin, onDemoAdmin, onDemoStaff, isLoading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="w-full md:w-2/5 p-8 md:p-12 bg-gray-50 flex flex-col justify-center order-1 md:order-2 border-l border-gray-100">
            <div className="mb-8 text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-4">
                     <Image src="/seaside.png" alt="Logo" width={50} height={50} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Portal</h2>
                <p className="text-gray-500 text-sm">Authorized personnel only</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="email_staff" className="text-sm font-medium text-gray-700 mb-1">Email Address</Label>
                    <Input
                        id="email_staff" type="email" autoComplete="nope"
                        placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        required disabled={isLoading}
                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                    />
                </div>
                <div>
                    <Label htmlFor="password_staff" className="text-sm font-medium text-gray-700 mb-1">Password</Label>
                    <div className="relative">
                        <Input
                            id="password_staff" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                            placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                            required disabled={isLoading}
                            className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl pr-12"
                        />
                        <button
                            type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full rounded-xl" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner /> : 'Log In'}
                </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-center gap-2 rounded-xl" onClick={onDemoAdmin} disabled={isLoading}>
                        <UserIcon /> Log in as Demo Admin
                    </Button>
                    <Button variant="outline" className="w-full justify-center gap-2 rounded-xl" onClick={onDemoStaff} disabled={isLoading}>
                        <UserIcon /> Log in as Demo Staff
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();
    const [modal, setModal] = useState({ isOpen: false, title: '', description: '' });

    const handleLogin = async (email, password) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const userData = await api.login({ email, password });
            setAuth(userData);
            addToast({ title: 'Login Successful', description: `Welcome back, ${userData.name}!`, variant: 'success' });
            router.push('/dashboard');
        } catch (err) {
            setModal({
                isOpen: true,
                title: 'Login Failed',
                description: err.message || 'An unexpected error occurred.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = (role) => {
        const user = role === 'Admin' ? {
            id: 99999, name: 'Demo Admin', email: 'demo.admin@seaside.com', role: 'Admin', isDemo: true
        } : {
            id: 88888, name: 'Demo Staff', email: 'demo.staff@seaside.com', role: 'Staff', isDemo: true
        };
        setAuth(user);
        addToast({ title: `Demo ${user.role} Activated`, description: `Welcome, ${user.name}!`, variant: 'success' });
        router.push('/dashboard');
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gray-100 font-inter">
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-6xl w-full flex flex-col md:flex-row border border-gray-100">
                <CustomerWelcome />
                <StaffLogin 
                    onLogin={handleLogin}
                    onDemoAdmin={() => handleDemoLogin('Admin')}
                    onDemoStaff={() => handleDemoLogin('Staff')}
                    isLoading={isLoading}
                />
            </div>

            <Dialog open={modal.isOpen} onOpenChange={(open) => !open && setModal({ isOpen: false, title: '', description: '' })}>
                <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <DialogTitle className="text-center mt-3 text-lg font-bold text-red-600">{modal.title}</DialogTitle>
                    </DialogHeader>
                    <p className="p-4 text-center text-sm text-gray-600">{modal.description}</p>
                    <DialogFooter className="justify-center">
                        <Button variant="destructive" onClick={() => setModal({ isOpen: false, title: '', description: '' })} className="w-full rounded-lg">OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default LoginPage;
