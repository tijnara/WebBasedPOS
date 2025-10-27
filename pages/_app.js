import '../styles/globals.css';
import React, { useState, useEffect } from 'react';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'next/router';
import Sidebar from '../src/components/Sidebar';
import { Button } from '../src/components/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Changed import
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { supabase } from '../src/lib/supabaseClient'; // Import supabase client

// --- Create the QueryClient (removed mutation retry) ---
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Keep cached data for 7 days
            gcTime: 1000 * 60 * 60 * 24 * 7,
            staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
            refetchOnWindowFocus: true, // Refetch on window focus
        },
    },
});
// -----------------------------------


function AuthGate({ children }) {
    // Get user and session loading state from store
    const { user, sessionLoaded, checkSession } = useStore(s => ({
        user: s.user,
        sessionLoaded: s.sessionLoaded,
        checkSession: s.checkSession
    }));
    const router = useRouter();

    // Check session on initial load
    useEffect(() => {
        checkSession(); // Check Supabase session on mount

        // Listen for Supabase auth changes (e.g., token refresh, logout in another tab)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log("Auth state changed:", event, session);
                checkSession(); // Re-check session on auth state change
            }
        );

        // Cleanup listener on unmount
        return () => {
            authListener?.subscription?.unsubscribe();
        };

    }, [checkSession]);

    // Redirect logic based on session state
    useEffect(() => {
        // Only redirect once the session has been checked
        if (sessionLoaded) {
            const isLoggedIn = !!user;
            const isLoginPage = router.pathname === '/login';

            if (!isLoggedIn && !isLoginPage) {
                console.log("AuthGate: Not logged in, redirecting to login");
                router.push('/login');
            } else if (isLoggedIn && isLoginPage) {
                console.log("AuthGate: Logged in, redirecting from login to home");
                router.push('/');
            }
        }
    }, [user, sessionLoaded, router]);

    // Show loading indicator until session is checked
    if (!sessionLoaded) {
        // You can replace this with a more sophisticated loading spinner component
        return <div className="flex items-center justify-center min-h-screen">Loading Authentication...</div>;
    }

    // Allow rendering if session is loaded and conditions are met
    // Render login page OR if user is logged in
    if (router.pathname === '/login' || user) {
        return children;
    }

    // Fallback: If session is loaded, user is not logged in, and not on login page
    // (This case should be handled by the redirect effect, but acts as a safeguard)
    return null;
}


export default function App({ Component, pageProps }) {
    const { toasts, dismissToast } = useStore();
    const router = useRouter();
    const isLoginPage = router.pathname === '/login';

    return (
        <QueryClientProvider client={queryClient}>
            <AuthGate>
                <div className="app">
                    {!isLoginPage && <Sidebar />}
                    <main className="main">
                        <div className="container">
                            <Component {...pageProps} />
                        </div>
                    </main>
                    <div className="toasts" aria-live="polite">
                        {toasts.map(t => (
                            <div key={t.id} className="toast">
                                <div className="toast__title">{t.title}</div>
                                <div className="toast__desc">{t.description}</div>
                                {t.action && (
                                    <div className="toast__actions">
                                        <Button variant="ghost" size="sm" onClick={t.action.onClick}>
                                            {t.action.label}
                                        </Button>
                                    </div>
                                )}
                                <div className="toast__actions">
                                    <Button variant="ghost" size="sm" onClick={() => dismissToast(t.id)}>Dismiss</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AuthGate>
            {/* --- ADD DEVTOOLS --- */}
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </QueryClientProvider>
    );
}