// pages/_app.js
import '../styles/globals.css';
import 'react-day-picker/dist/style.css'; // Moved global CSS import for react-day-picker here
import '../src/components/pages/POSPage.css'; // Corrected path for POSPage.css import
import '../src/components/CartDrawer.css'; // Import CartDrawer.css globally
import React, { useState, useEffect } from 'react';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'next/router';
import Navbar from '../src/components/Navbar';
import TabBar from '../src/components/TabBar'; // --- IMPORT TAB BAR AGAIN ---
import { Button } from '../src/components/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
        // Call hydrate from store to ensure sessionLoaded is true client-side
        useStore.getState().hydrate();
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
                // Use replace instead of push to avoid adding login to history
                router.replace('/');
            }
        }
    }, [user, sessionLoaded, router, isClient]); // Depend on client-side flag too

    // Show loading indicator until mounted on client (prevents hydration mismatch/flashing)
    if (!isClient || !sessionLoaded) {
        // You could replace this with a more sophisticated loading spinner component
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
                Loading application...
            </div>
        );
    }

    // Allow rendering if conditions met (on login page OR user exists)
    if (router.pathname === '/login' || user) {
        return children;
    }

    // Fallback while redirecting or if state is unexpected
    // This state shouldn't normally be reached if redirection works correctly
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
            Checking authentication...
        </div>
    );
}


export default function App({ Component, pageProps }) {
    const { toasts, dismissToast } = useStore();
    const router = useRouter();
    const isLoginPage = router.pathname === '/login';

    return (
        <QueryClientProvider client={queryClient}>
            <AuthGate>
                <div className="app bg-gray-100">
                    {/* Render Navbar. It handles its own visibility. */}
                    {!isLoginPage && <Navbar />}

                    {/* --- RENDER TAB BAR (it hides itself on desktop via CSS) --- */}
                    {!isLoginPage && <TabBar />}

                    {/* Main content area */}
                    <main className="main">
                        {/* Container adds max-width and centers content */}
                        <div className="container">
                            <Component {...pageProps} />
                        </div>
                    </main>

                    {/* Toast Container */}
                    <div className="toasts fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3" aria-live="polite">
                        {toasts.map(t => (
                            <div key={t.id} className={`toast bg-white border border-gray-200 p-4 rounded-lg shadow-xl w-80 max-w-[calc(100vw-2rem)] flex items-start gap-3 ${
                                t.variant === 'destructive' ? 'border-l-4 border-red-500' :
                                    t.variant === 'success' ? 'border-l-4 border-green-500' :
                                        t.variant === 'warning' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-blue-500' // Default style if needed
                            }`}>
                                <div className="flex-1">
                                    <div className="toast__title font-semibold text-gray-800">{t.title}</div>
                                    {t.description && <div className="toast__desc text-sm text-gray-600 mt-1">{t.description}</div>}
                                    {t.action && (
                                        <div className="toast__actions mt-2">
                                            <Button variant="ghost" size="sm" onClick={t.action.onClick} className="text-blue-600 hover:bg-blue-50 px-2 py-1">
                                                {t.action.label}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" className="p-1 -mr-2 -mt-2 h-auto text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full" onClick={() => dismissToast(t.id)} aria-label="Dismiss toast">
                                    {/* Simple X icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                    </svg>
                                </Button>
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