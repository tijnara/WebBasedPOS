// src/components/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import api from '../../lib/api';
import {
    Button, Card, CardContent, Input, Label,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    LoadingSpinner
} from '../ui';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', description: '' });
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
            setIsLoading(false);
            setModal({ isOpen: true, title: 'Login Error', description: 'Email and password are required.' });
            return;
        }
        try {
            const user = await api.login({ email, password });
            if (!user || typeof user !== 'object' || !user.id || !user.email) {
                throw new Error('Login failed. User data is invalid or incomplete.');
            }
            setAuth(user);
            addToast({ title: 'Login Successful', description: `Welcome back, ${user.name || user.email.split('@')[0]}!`, variant: 'success' });
            router.replace('/');
        } catch (err) {
            console.error('Login page error:', err);
            setModal({ isOpen: true, title: 'Login Failed', description: err.message || 'Failed to login. Please check your credentials.' });
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: '', description: '' });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">

            {/* Header: Logo and Title */}
            <div className="text-center mb-8">
                <img
                    src="/seaside.png" // Path to your logo in the public folder
                    alt="Seaside POS Logo"
                    // --- MODIFIED: Further reduced size ---
                    className="w-8 h-8 mx-auto" // Even smaller size
                />
                <h1 className="text-2xl font-bold text-gray-800 mt-2">SEASIDE POS</h1>
                <p className="text-sm text-gray-500">Point of Sale System</p>
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-sm shadow-md rounded-lg overflow-hidden border border-gray-200 bg-white">
                <CardContent className="p-6 md:p-8">
                    {/* Welcome Text */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
                        <p className="text-sm text-gray-500 mt-1">Enter your credentials to access your account</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                required disabled={isLoading} autoComplete="email" placeholder="you@example.com"
                                className="mt-1 input"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            <Input
                                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                required disabled={isLoading} autoComplete="current-password" placeholder="••••••••"
                                className="mt-1 input"
                            />
                        </div>

                        {/* Remember Me / Forgot Password Row */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember-me" name="remember-me" type="checkbox"
                                    checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="remember-me" className="text-gray-600 mb-0">
                                    Remember me
                                </Label>
                            </div>
                            <a href="#" className="font-medium text-primary hover:text-primary-hover">
                                Forgot password?
                            </a>
                        </div>

                        {/* Sign In Button */}
                        <Button
                            type="submit" variant="primary" className="w-full h-10 flex items-center justify-center text-base mt-4 btn btn--primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><LoadingSpinner className="mr-3 h-5 w-5 text-white" /> Authenticating...</>
                            ) : 'Sign In'}
                        </Button>
                    </form>

                    {/* Sign Up Link */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <a href="#" className="font-medium text-primary hover:text-primary-hover">
                            Contact sales
                        </a>
                    </p>

                </CardContent>
            </Card>

            {/* Footer */}
            <footer className="mt-8 text-center text-xs text-gray-500">
                <p>&copy; 2025 SEASIDE POS. All rights reserved.</p>
                <div className="mt-2 space-x-4">
                    <a href="#" className="hover:text-gray-700">Privacy</a>
                    <span>&bull;</span>
                    <a href="#" className="hover:text-gray-700">Terms</a>
                    <span>&bull;</span>
                    <a href="#" className="hover:text-gray-700">Support</a>
                </div>
            </footer>

            {/* Error Modal (remains the same) */}
            <Dialog open={modal.isOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-xs dialog-content">
                    <DialogHeader className="dialog-header">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <DialogTitle className="text-center mt-3 dialog-title">{modal.title}</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 text-center text-sm text-gray-600">
                        <p>{modal.description}</p>
                    </div>
                    <DialogFooter className="justify-center dialog-footer">
                        <Button variant="primary" onClick={closeModal} className="w-full btn btn--primary">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}