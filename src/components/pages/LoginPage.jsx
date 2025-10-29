// src/components/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useStore } from '../../store/useStore';
import api from '../../lib/api'; // Import your custom API
import {
    Button,
    Card,
    CardHeader,
    CardContent,
    CardFooter,
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

const LoginPage = () => {
    const [email, setEmail] = useState('');
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
            // Or optionally use a toast for a less intrusive error
            // addToast({ title: 'Login Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            {/* Logo */}
            <div className="mb-6">
                <Image
                    src="/seaside.png" // Assumes the logo is in the public folder
                    alt="Seaside POS Logo"
                    width={80}
                    height={80}
                    priority // Prioritize loading the logo
                />
            </div>

            <Card className="w-full max-w-sm shadow-md">
                <CardHeader>
                    <h1 className="text-2xl font-bold text-center text-primary">Seaside POS Login</h1>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <LoadingSpinner />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                            Need an account?{' '}
                            <a href="#" className="font-medium text-primary hover:text-primary-hover">
                                Contact admin
                            </a>
                        </p>
                    </CardFooter>
                </form>
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

            {/* Error Modal */}
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
        </div>
    );
}

export default LoginPage;