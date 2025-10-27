import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import api from '../../lib/api'; // Use default import for updated api.js
import { Button, Card, CardHeader, CardContent, Input, Label } from '../ui';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // Get setAuth and addToast from store
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
            setError('Email and password are required.');
            setIsLoading(false);
            return;
        }

        console.log('LoginPage: Attempting login with:', { email }); // Don't log password

        try {
            // Call the updated Supabase login function from api.js
            const { user, session } = await api.login({ email, password });

            // Fetch profile data after successful login
            const profile = await api.getUserProfile(user.id);

            // Update the Zustand store with user, session, and profile
            setAuth(user, session, profile);

            addToast({ title: 'Login Successful', description: `Welcome back!`, variant: 'success' });

            // Redirect is now handled by AuthGate in _app.js, but this can stay as a fallback/immediate push
            router.push('/');

        } catch (err) {
            console.error('Login page error:', err);
            setError(err.message || 'Failed to login. Please check your credentials.');
            addToast({ title: 'Login Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <h2 className="text-2xl font-bold text-center">SEASIDE POS</h2>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                        {/* Optional: Add Forgot Password link */}
                        {/* <div className="text-center mt-2">
                            <a href="#" className="text-sm text-primary hover:underline">Forgot Password?</a>
                        </div> */}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}