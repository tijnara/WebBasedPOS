import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, Input, Label } from '../ui';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const setAuth = useStore(s => s.setAuth);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Validate email and password
        if (typeof email !== 'string' || typeof password !== 'string') {
            setError('Email and password must be valid strings.');
            setIsLoading(false);
            return;
        }

        console.log('Attempting login with:', { email, password }); // Debug log

        try {
            const { token, user } = await api.login({ email, password });
            setAuth(token, user);
            router.push('/');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login. Please check your credentials.');
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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
