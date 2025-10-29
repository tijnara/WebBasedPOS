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

// Placeholder Logo SVG (Replace with your actual logo)
const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary">
        {/* Replace this path with your actual logo shape */}
        <path fillRule="evenodd" d="M3.75 4.5a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75V4.5zm.75 3.75v10.5h13.5V8.25H4.5zm5.955 2.156a.75.75 0 011.06 0l2.647 2.647a.75.75 0 01-1.06 1.06L11.25 12.81v3.44a.75.75 0 01-1.5 0v-3.44l-1.353 1.354a.75.75 0 01-1.06-1.06l2.647-2.647z" clipRule="evenodd" />
    </svg>
);

// Placeholder Demo Icon
const DemoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
        <path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3zM5.5 4a2 2 0 0 0-2 2v1H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1.5V6a2 2 0 0 0-2-2h-5zM4 7h8v4H4V7z"/>
    </svg>
);

// Placeholder Logo SVG (Replace with your actual logo)
const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary">
    const [rememberMe, setRememberMe] = useState(false); // Added state for checkbox
        <path fillRule="evenodd" d="M3.75 4.5a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75V4.5zm.75 3.75v10.5h13.5V8.25H4.5zm5.955 2.156a.75.75 0 011.06 0l2.647 2.647a.75.75 0 01-1.06 1.06L11.25 12.81v3.44a.75.75 0 01-1.5 0v-3.44l-1.353 1.354a.75.75 0 01-1.06-1.06l2.647-2.647z" clipRule="evenodd" />
    </svg>
);

// Placeholder Demo Icon
const DemoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
        <path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3zM5.5 4a2 2 0 0 0-2 2v1H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1.5V6a2 2 0 0 0-2-2h-5zM4 7h8v4H4V7z"/>
        // Basic client-side validation
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
            // Call the modified custom table login function
            // **FIX:** Assign the returned object directly, DO NOT destructure { user }
    const [rememberMe, setRememberMe] = useState(false); // Added state for checkbox

            // Log the user object for debugging
            console.log('Debug: User object returned from API:', user);

            // Check if user object is valid
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', description: '' });
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));

            // Update the Zustand store
    const router = useRouter();

            // Show a success toast


            // Redirect
    const handleSubmit = async (e) => {

        e.preventDefault();
        setIsLoading(true);
            const errorMessage = err.message || 'Failed to login. Please check your credentials.';

            // --- MODIFICATION: Show modal on error ---
            setModal({
                isOpen: true,
                title: 'Login Failed',
                description: errorMessage
            });
            // --- End modification ---

        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
            setIsLoading(false);
            setModal({ isOpen: true, title: 'Login Error', description: 'Email and password are required.' });
            return;
        }
    // Function to close the modal
        try {
            // Call the modified custom table login function
            // **FIX:** Assign the returned object directly, DO NOT destructure { user }
            const user = await api.login({ email, password });
    // Placeholder for demo login
    const handleDemoLogin = () => {
        // Replace with actual demo account credentials or logic
        setEmail('demo@example.com');
        setPassword('password');
        // Optionally trigger submit automatically
        // handleSubmit(new Event('submit'));
        addToast({ title: 'Demo Account', description: 'Enter credentials and click Sign In.', variant: 'info' });
    };


        // --- UPDATED LAYOUT ---
            // Log the user object for debugging
            console.log('Debug: User object returned from API:', user);

            // Check if user object is valid
                <LogoIcon />

            // Show a success toast
            addToast({ title: 'Login Successful', description: `Welcome back, ${user.name || user.email.split('@')[0]}!`, variant: 'success' });

            // Redirect
            <Card className="w-full max-w-sm shadow-md rounded-lg overflow-hidden border border-gray-200">
                {/* Removed CardHeader */}
                <CardContent className="p-6 md:p-8"> {/* Increased padding slightly */}
        } catch (err) {
            console.error('Login page error:', err);
            const errorMessage = err.message || 'Failed to login. Please check your credentials.';

            // --- MODIFICATION: Show modal on error ---
            setModal({
                isOpen: true,
                title: 'Login Failed',
                description: errorMessage
            });
                            {/* TODO: Add icon inside input if needed */}
            // --- End modification ---

        } finally {
                                className="mt-1"
        }
    };

    // Function to close the modal
                            {/* TODO: Add visibility toggle icon if needed */}
    const closeModal = () => {
        setModal({ isOpen: false, title: '', description: '' });
    };
                                className="mt-1"
    // Placeholder for demo login
    const handleDemoLogin = () => {
        // Replace with actual demo account credentials or logic
        setEmail('demo@example.com');
        setPassword('password');
        // Optionally trigger submit automatically
        // handleSubmit(new Event('submit'));
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" // Use primary color
    return (
                                <Label htmlFor="remember-me" className="text-gray-600 mb-0"> {/* Remove margin bottom */}
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">

            {/* Header: Logo and Title */}
            <div className="text-center mb-8">
                <LogoIcon />
                <h1 className="text-2xl font-bold text-gray-800 mt-2">SEASIDE POS</h1>
                <p className="text-sm text-gray-500">Point of Sale System</p>
            </div>

            {/* Login Card */}
                            type="submit" variant="primary" className="w-full h-10 flex items-center justify-center text-base mt-2"
                {/* Removed CardHeader */}
                <CardContent className="p-6 md:p-8"> {/* Increased padding slightly */}
                    {/* Welcome Text */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
                        <p className="text-sm text-gray-500 mt-1">Enter your credentials to access your account</p>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {/* Demo Account Button */}
                    <div>
                        <Button
                            type="button" variant="outline" className="w-full h-10 flex items-center justify-center gap-2"
                            onClick={handleDemoLogin} disabled={isLoading}
                        >
                            <DemoIcon /> Demo Account
                        </Button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            {/* TODO: Add icon inside input if needed */}
                            <Input
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                required disabled={isLoading} autoComplete="email" placeholder="you@example.com"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            {/* TODO: Add visibility toggle icon if needed */}
                            <Input
                                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                required disabled={isLoading} autoComplete="current-password" placeholder="••••••••"
                                className="mt-1"
                            />
                        </div>

                        {/* Remember Me / Forgot Password Row */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <input
                <DialogContent className="sm:max-w-xs"> {/* Smaller modal for alerts */}
                    <DialogHeader>
                        {/* Red X Icon */}
                                    type="checkbox"
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                                    onChange={(e) => setRememberMe(e.target.checked)}
                        <DialogTitle className="text-center mt-3">{modal.title}</DialogTitle>
                                />
                                <Label htmlFor="remember-me" className="text-gray-600 mb-0"> {/* Remove margin bottom */}
                                    Remember me
                                </Label>
                    <DialogFooter className="justify-center"> {/* Center the button */}
                        <Button variant="primary" onClick={closeModal} className="w-full">
                                Forgot password?
                            </a>
                        </div>

                        {/* Sign In Button */}
            {/* --- End New Modal --- */}
                        <Button
                            type="submit" variant="primary" className="w-full h-10 flex items-center justify-center text-base mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><LoadingSpinner className="mr-3 h-5 w-5 text-white" /> Authenticating...</>
                            ) : 'Sign In'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {/* Demo Account Button */}
                    <div>
                        <Button
                            type="button" variant="outline" className="w-full h-10 flex items-center justify-center gap-2"
                            onClick={handleDemoLogin} disabled={isLoading}
                        >
                            <DemoIcon /> Demo Account
                        </Button>
                    </div>

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
                <DialogContent className="sm:max-w-xs"> {/* Smaller modal for alerts */}
                    <DialogHeader>
                        {/* Red X Icon */}
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
                    <DialogFooter className="justify-center"> {/* Center the button */}
                        <Button variant="primary" onClick={closeModal} className="w-full">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* --- End New Modal --- */}
        </div>
    );
}