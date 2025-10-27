// pages/_app.js
import '../styles/globals.css';
import React, { useState, useEffect } from 'react';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'next/router';
import Sidebar from '../src/components/Sidebar';
import { Button } from '../src/components/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// Removed: supabase import, no longer needed here for auth listener

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days garbage collection time
            staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
            refetchOnWindowFocus: true, // Refetch data when window gains focus
        },
    },
});

function AuthGate({ children }) {
    // Get user state and sessionLoaded (now just indicates store hydration/initial load)
    const { user, sessionLoaded } = useStore(s => ({
        user: s.user,
        sessionLoaded: s.sessionLoaded // Use this to wait for initial state load
    }));
    const router = useRouter();
    const [isClient, setIsClient] = useState(false); // Track if running on client

    // Ensure this runs only on the client after mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Redirect logic based purely on Zustand state
    useEffect(() => {
        // Only run redirects on the client and after initial state might be loaded
        if (isClient && sessionLoaded) {
            const isLoggedIn = !!user;
            const isLoginPage = router.pathname === '/login';

            if (!isLoggedIn && !isLoginPage) {
                console.log("AuthGate: Not logged in (custom auth), redirecting to login");
                router.push('/login');
            } else if (isLoggedIn && isLoginPage) {
                console.log("AuthGate: Logged in (custom auth), redirecting from login to home");
                router.push('/');
            }
        }
    }, [user, sessionLoaded, router, isClient]); // Depend on client-side flag too

    // Show loading indicator until mounted on client (prevents hydration mismatch/flashing)
    if (!isClient || !sessionLoaded) {
        // You could replace this with a more sophisticated loading spinner
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // Allow rendering if conditions met (on login page OR user exists)
    if (router.pathname === '/login' || user) {
        return children;
    }

    // Fallback while redirecting or if state is unexpected
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
                    {/* Toast Container */}
                    <div className="toasts fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
                        {toasts.map(t => (
                            <div key={t.id} className={`toast bg-white border border-gray-200 p-3 rounded-md shadow-lg w-80 max-w-[calc(100vw-2rem)] ${
                                t.variant === 'destructive' ? 'border-l-4 border-red-500' :
                                    t.variant === 'success' ? 'border-l-4 border-green-500' :
                                        t.variant === 'warning' ? 'border-l-4 border-yellow-500' : ''
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="toast__title font-semibold">{t.title}</div>
                                        {t.description && <div className="toast__desc text-sm text-gray-600 mt-1">{t.description}</div>}
                                    </div>
                                    <Button variant="ghost" size="sm" className="p-1 -mr-1 -mt-1 h-auto" onClick={() => dismissToast(t.id)}>
                                        {/* Simple X icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                        </svg>
                                    </Button>
                                </div>
                                {t.action && (
                                    <div className="toast__actions mt-2 text-right">
                                        <Button variant="ghost" size="sm" onClick={t.action.onClick}>
                                            {t.action.label}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div> {/* End Toast Container */}
                </div>
            </AuthGate>
            {/* React Query DevTools */}
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </QueryClientProvider>
    );
}