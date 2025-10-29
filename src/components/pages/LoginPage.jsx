// src/components/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import { Button } from '../ui';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const { setAuth, addToast } = useStore(s => ({ setAuth: s.setAuth, addToast: s.addToast }));
    const router = useRouter();

    const handleLogin = async () => {
        try {
            // Simulate login logic
            if (email === 'demo@example.com' && password === 'password') {
                setAuth({ email });
                addToast({ title: 'Login Successful', description: 'Welcome back!', variant: 'success' });
                router.push('/');
            } else {
                addToast({ title: 'Login Failed', description: 'Invalid credentials.', variant: 'destructive' });
            }
        } catch (err) {
            console.error('Login page error:', err);
        }
    };

    return (
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