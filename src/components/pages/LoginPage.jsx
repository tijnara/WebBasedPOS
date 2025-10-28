// src/components/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton } from '../ui';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', description: '', variant: '' });
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Basic client-side validation
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
            setError('Email and password are required.');
            setIsLoading(false);
            return;
        }

        try {
            // Call the modified custom table login function from api.js
            const user = await api.login({ email, password }); // Assign directly

            // Log the user object for debugging
            console.log('Debug: User object returned from API:', user);

            // Adjust validation logic to match the actual structure of the user object
            // Check if user object is valid (has an id and email at minimum)
            if (!user || typeof user !== 'object' || !user.id || !user.email) {
                // Keep the existing error message for consistency
                throw new Error('Login failed. User data is invalid or incomplete.');
            }

            // Update the Zustand store with the user object from your 'users' table
            setAuth(user);

            // Use the name from the user object for the welcome message
            addToast({ title: 'Login Successful', description: `Welcome back, ${user.name || user.email.split('@')[0]}!`, variant: 'success' });

            // Redirect is handled by AuthGate, but immediate push can improve UX
            // Use replace to prevent user going back to login page via browser back button
            router.replace('/');

        } catch (err) {
            console.error('Login page error:', err);
            const errorMessage = err.message || 'Failed to login. Please check your credentials.';
            setError(errorMessage);

            // Display error modal for invalid credentials
            setModal({
                title: 'Login Failed',
                description: errorMessage,
                variant: 'destructive',
                isOpen: true,
            });
        } finally {
            setIsLoading(false);
        }
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

                        {error && (
                            <div className="text-sm text-red-700 bg-red-100 p-3 rounded border border-red-300">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full h-10 flex items-center justify-center text-base mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </>
                            ) : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {modal.isOpen && (
                <Dialog open={modal.isOpen} onOpenChange={() => setModal({ ...modal, isOpen: false })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{modal.title}</DialogTitle>
                            <DialogCloseButton onClick={() => setModal({ ...modal, isOpen: false })} />
                        </DialogHeader>
                        <p>{modal.description}</p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModal({ ...modal, isOpen: false })}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}