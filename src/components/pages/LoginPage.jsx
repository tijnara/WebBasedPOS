// src/components/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import api from '../../lib/api';
import {
    Button, Card, CardHeader, CardContent, Input, Label,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton,
    LoadingSpinner // Import the spinner
} from '../ui';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // We'll use the modal state instead of the simple text error
    // const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // NEW: State to manage the error modal
    const [modal, setModal] = useState({ isOpen: false, title: '', description: '' });

    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError(null); // No longer needed
        setIsLoading(true);

        // Basic client-side validation
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
            setIsLoading(false);
            // Use the modal to show this error
            setModal({
                isOpen: true,
                title: 'Login Error',
                description: 'Email and password are required.'
            });
            return;
        }

        console.log('LoginPage: Attempting custom login with:', { email }); // Don't log password

        try {
            // Call the modified custom table login function
            // **FIX:** Assign the returned object directly, DO NOT destructure { user }
            const user = await api.login({ email, password });

            // Log the user object for debugging
            console.log('Debug: User object returned from API:', user);

            // Check if user object is valid
            if (!user || typeof user !== 'object' || !user.id || !user.email) {
                throw new Error('Login failed. User data is invalid or incomplete.');
            }

            // Update the Zustand store
            setAuth(user);

            // Show a success toast
            addToast({ title: 'Login Successful', description: `Welcome back, ${user.name || user.email.split('@')[0]}!`, variant: 'success' });

            // Redirect
            router.replace('/');

        } catch (err) {
            console.error('Login page error:', err);
            const errorMessage = err.message || 'Failed to login. Please check your credentials.';

            // --- MODIFICATION: Show modal on error ---
            setModal({
                isOpen: true,
                title: 'Login Failed',
                description: errorMessage
            });
            // --- End modification ---

        } finally {
            setIsLoading(false);
        }
    };

    // Function to close the modal
    const closeModal = () => {
        setModal({ isOpen: false, title: '', description: '' });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <Card className="w-full max-w-sm shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                    <h2 className="text-2xl font-bold text-center text-white">SEASIDE POS</h2>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                                placeholder="your@email.com"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="mt-1"
                            />
                        </div>

                        {/* Error message removed from here, now handled by modal */}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full h-10 flex items-center justify-center text-base mt-2"
                            disabled={isLoading}
                        >
                            {/* --- Use LoadingSpinner component --- */}
                            {isLoading ? (
                                <>
                                    {/* The spinner's animation is defined in globals.css */}
                                    <LoadingSpinner className="mr-3 h-5 w-5 text-white" />
                                    Authenticating...
                                </>
                            ) : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* --- NEW: Error Modal --- */}
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