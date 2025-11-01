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
        // [FIXED] You've set the background to white
        <div className="flex min-h-screen w-full bg-white">

            {/* Left Column (Form) */}
            {/* [FIXED] This column is also white */}
            <div className="flex w-1/2 justify-center items-center min-h-screen bg-white">
                <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col">
                    <div className="p-8 sm:p-10">
                        {/* Logo and Title - Using your new WaterDropIcon */}
                        <div className="flex items-center gap-3 mb-6">
                            <WaterDropIcon />
                            <span className="text-2xl font-bold text-black">SEASIDE POS</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Login</h1>
                        <p className="text-sm text-muted mb-6">
                            Don't have an account?{' '}
                            <a href="#" className="font-medium text-success hover:text-success-hover">Get Started Now</a>
                        </p>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="font-medium text-muted">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-gray-50 border-gray-200 focus:bg-white rounded-lg"
                                />
                            </div>
                            <div>
                                <Label htmlFor="password" className="font-medium text-muted">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-gray-50 border-gray-200 focus:bg-white rounded-lg"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="remember-me" type="checkbox" className="h-4 w-4 text-success border-gray-200 rounded focus:ring-success" />
                                <Label htmlFor="remember-me" className="mb-0 text-muted">Remember Me</Label>
                            </div>
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="success"
                                    size="lg"
                                    className="w-full shadow-md hover:shadow-lg hover:opacity-90 transition-all rounded-lg text-base font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (<><LoadingSpinner /> Logging in...</>) : 'Log In'}
                                </Button>
                            </div>
                        </form>
                        <div className="text-center mt-6">
                            <a href="#" className="text-sm font-medium text-success hover:text-success-hover">Forgot Your Password?</a>
                        </div>
                    </div>
                    {/* [FIXED] Footer is also white */}
                    <footer className="mt-auto p-6 text-center text-xs text-gray-500 bg-white border-t border-gray-100 rounded-b-xl">
                        <p>Copyright &copy; 2025 Seaside POS. SEASIDE&trade; is a trademark of Seaside, LLC.</p>
                        <div className="mt-1 space-x-2">
                            <a href="#" className="hover:text-gray-700">Terms of Service</a>
                            <span>|</span>
                            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Right Column (Image) */}
            {/* [FIXED] This column is also white */}
            <div className="flex w-1/2 justify-center items-center min-h-screen bg-white">
                <Image
                    src="/seasideHD_.png"
                    alt="Seaside Purified Water Refilling Station"
                    width={600}
                    height={600}
                    style={{ objectFit: 'contain' }}
                    priority
                    className=""
                />
            </div>

            {/* Error Modal */}
            <Dialog open={modal.isOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <DialogTitle className="text-center mt-3">{modal.title}</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 text-center text-sm text-gray-600">
                        <p>{modal.description}</p>
                    </div>
                    <DialogFooter className="justify-center">
                        <Button variant="primary" onClick={closeModal} className="w-full">OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default LoginPage;