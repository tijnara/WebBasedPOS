import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useStore } from '../../store/useStore';
import api from '../../lib/api'; // Import your custom API
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

// Simple SVG Icon for loading
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Your new WaterDropIcon
const WaterDropIcon = () => (
    <span className="inline-flex items-center justify-center w-10 h-10 bg-success rounded-lg mr-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 6 9.5 6 13.5C6 17.09 8.91 20 12.5 20C16.09 20 19 17.09 19 13.5C19 9.5 12 2 12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="15" r="2" fill="white"/>
        </svg>
    </span>
);

const LoginPage = () => {
    const [email, setEmail] =useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();

    // State for the error modal
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        description: '',
    });

    const closeModal = () => {
        setModal({ isOpen: false, title: '', description: '' });
    };

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent form submission from reloading the page
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Use the login function from api.js
            const userData = await api.login({ email, password });

            // On success, set auth state in Zustand
            setAuth(userData);
            addToast({ title: 'Login Successful', description: `Welcome back, ${userData.name}!`, variant: 'success' });
            router.push('/'); // Redirect to the main POS page

        } catch (err) {
            console.error('Login page error:', err);
            // Show error in modal
            setModal({
                isOpen: true,
                title: 'Login Failed',
                description: err.message || 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white flex-row gap-16 items-center justify-center">
            {/* Left Column (Form) */}
            <div className="flex w-1/2 justify-center items-center min-h-screen bg-white">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col px-8 py-12 transition-all duration-300">
                    <div className="mb-10">
                        {/* Logo and Title - Elegant */}
                        <div className="flex items-center gap-4 mb-8">
                            <WaterDropIcon />
                            <span className="text-3xl font-extrabold text-black tracking-tight"></span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 text-gray-900">Login</h1>

                    </div>
                    <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                        <div>
                            <Label htmlFor="no_autofill_email" className="font-semibold text-gray-700 mb-1">Email Address</Label>
                            <Input
                                id="no_autofill_email"
                                name="no_autofill_email"
                                type="email"
                                autoComplete="nope"
                                inputMode="none"
                                spellCheck={false}
                                readOnly
                                onFocus={e => e.target.removeAttribute('readOnly')}
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-gray-50 border border-gray-200 focus:bg-white focus:border-success focus:ring-2 focus:ring-success/30 rounded-xl px-4 py-3 text-base transition-all"
                            />
                        </div>
                        <div>
                            <Label htmlFor="no_autofill_password" className="font-semibold text-gray-700 mb-1">Password</Label>
                            <div className="relative">
                                <Input
                                    id="no_autofill_password"
                                    name="no_autofill_password"
                                    type="password"
                                    autoComplete="nope"
                                    inputMode="none"
                                    spellCheck={false}
                                    readOnly
                                    onFocus={e => e.target.removeAttribute('readOnly')}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-gray-50 border border-gray-200 focus:bg-white focus:border-success focus:ring-2 focus:ring-success/30 rounded-xl px-4 py-3 text-base transition-all pr-10"
                                />
                                {/* Eye icon for password visibility (static for now) */}
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input id="remember-me" type="checkbox" className="h-4 w-4 text-success border-gray-200 rounded focus:ring-success" />
                            <Label htmlFor="remember-me" className="mb-0 text-muted">Remember Me</Label>
                        </div>
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            className="w-full shadow-lg hover:shadow-xl hover:opacity-95 transition-all rounded-2xl text-lg font-semibold py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-success to-green-500"
                            disabled={isLoading}
                        >
                            {isLoading ? (<><LoadingSpinner /> Logging in...</>) : 'Log In'}
                        </Button>
                    </form>
                    <div className="text-center mt-8">
                        <a href="#" className="text-sm font-semibold text-success hover:underline transition-colors">demo</a>
                    </div>
                    <footer className="mt-12 p-4 text-center text-xs text-gray-400 bg-white border-t border-gray-100 rounded-b-3xl">
                        <p>Copyright &copy; 2025 Seaside POS. SEASIDE&trade; is a trademark of Seaside, LLC.</p>
                        <div className="mt-1 space-x-2">
                            <a href="#" className="hover:text-gray-700">Terms of Service</a>
                            <span>|</span>
                            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
                        </div>
                    </footer>
                </div>
            </div>
            {/* Divider for elegance */}
            <div className="hidden md:block h-[70%] w-px bg-gray-100 mx-2 rounded-full"></div>
            {/* Right Column (Image) */}
            <div className="flex w-1/2 justify-center items-center min-h-screen bg-white">
                <div className="flex flex-col items-center justify-center">
                    <Image
                        src="/seasideHD_.png"
                        alt="Seaside Purified Water Refilling Station"
                        width={600}
                        height={600}
                        style={{ objectFit: 'contain' }}
                        priority
                        className="rounded-2xl shadow-xl"
                    />
                </div>
            </div>
            {/* Error Modal */}
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
                        <Button variant="primary" onClick={closeModal} className="w-full rounded-lg">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default LoginPage;
