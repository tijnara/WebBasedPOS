// pages/_app.js
import '../styles/globals.css';
import '../styles/navbar.css';
import 'react-day-picker/dist/style.css';
import '../src/components/pages/POSPage.css';

import React, { useState, useEffect } from 'react';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'next/router';
import Navbar from '../src/components/Navbar';
import TabBar from '../src/components/TabBar';
import FloatingNotes from '../src/components/FloatingNotes';
import FloatingMessages from '../src/components/FloatingMessages';
import { Button } from '../src/components/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Head from 'next/head';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24 * 7,
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: true,
        },
    },
});

function AuthGate({ children }) {
    const { user, sessionLoaded } = useStore(s => ({
        user: s.user,
        sessionLoaded: s.sessionLoaded
    }));
    const router = useRouter();

    // Standard Auth Routing
    useEffect(() => {
        if (sessionLoaded) {
            const isLoggedIn = !!user;
            const isPublicPage = ['/', '/login', '/terms', '/privacy', '/contact'].includes(router.pathname) || router.pathname.startsWith('/resources');

            if (!isLoggedIn && !isPublicPage) {
                console.log("AuthGate: Not logged in, redirecting to landing page");
                router.push('/');
            } else if (isLoggedIn && router.pathname === '/login') {
                console.log("AuthGate: Logged in, redirecting from login to dashboard");
                router.replace('/dashboard');
            }
        }
    }, [user, sessionLoaded, router]);

    // --- NEW: Navigation Reset & Idle Tracker (No Logout) ---
    useEffect(() => {
        if (!user) return;

        const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity

        const checkNavigationState = () => {
            const now = Date.now();
            const lastActive = localStorage.getItem('pos_last_active_time');

            // Check if this is a newly opened tab or a return to the site
            const isNewTabSession = !sessionStorage.getItem('pos_tab_initialized');

            let needsRedirect = false;

            if (isNewTabSession) {
                // User closed the tab and came back, or opened a new tab
                needsRedirect = true;
                sessionStorage.setItem('pos_tab_initialized', 'true');
            } else if (lastActive && now - parseInt(lastActive, 10) > IDLE_TIMEOUT) {
                // User left the tab open but was idle for > 15 mins
                needsRedirect = true;
            }

            if (needsRedirect) {
                localStorage.setItem('pos_last_active_time', now.toString()); // Reset to prevent loop
                if (router.pathname !== '/') {
                    console.log("User was away/idle. Redirecting to landing page.");
                    router.push('/');
                }
            }
        };

        const resetTimer = () => {
            localStorage.setItem('pos_last_active_time', Date.now().toString());
        };

        checkNavigationState();
        resetTimer();

        // Track interactions to prevent idle timeout
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(e => document.addEventListener(e, resetTimer, true));
        window.addEventListener('focus', checkNavigationState);

        // Background checker for idleness
        const intervalId = setInterval(() => {
            const lastActive = localStorage.getItem('pos_last_active_time');
            if (lastActive && Date.now() - parseInt(lastActive, 10) > IDLE_TIMEOUT) {
                localStorage.setItem('pos_last_active_time', Date.now().toString());
                if (router.pathname !== '/') {
                    router.push('/');
                }
            }
        }, 30000);

        return () => {
            events.forEach(e => document.removeEventListener(e, resetTimer, true));
            window.removeEventListener('focus', checkNavigationState);
            clearInterval(intervalId);
        };
    }, [user, router.pathname]);

    if (!sessionLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
                Loading application...
            </div>
        );
    }

    if (['/', '/login', '/terms', '/privacy', '/contact'].includes(router.pathname) || router.pathname.startsWith('/resources') || user) {
        return children;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
            Checking authentication...
        </div>
    );
}

export default function App({ Component, pageProps }) {
    const { toasts, dismissToast } = useStore();
    const router = useRouter();

    useEffect(() => {
        useStore.getState().hydrate();
    }, []);

    const isPublicPage = ['/', '/login', '/terms', '/privacy', '/contact'].includes(router.pathname) || router.pathname.startsWith('/resources');
    const hideNav = isPublicPage;

    return (
        <QueryClientProvider client={queryClient}>
            <Head>
                <link rel="icon" href="/seaside.png" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="google-site-verification" content="kd1wSsNQZCjJmyp4LaQKI9Mr7s6Z9_I5Z3ETpaW1EVc" />
            </Head>
            <AuthGate>
                <div className="app bg-gray-100 responsive-page">
                    {!hideNav && <Navbar />}
                    {!hideNav && <TabBar />}

                    {isPublicPage ? (
                        <Component {...pageProps} />
                    ) : (
                        <main className="main">
                            <div className="container">
                                <Component {...pageProps} />
                            </div>
                        </main>
                    )}

                    {!isPublicPage && <FloatingNotes />}
                    {!isPublicPage && <FloatingMessages />}

                    <div className="toasts fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3" aria-live="polite">
                        {toasts.map(t => (
                            <div key={t.id} className={`toast bg-white border border-gray-200 p-4 rounded-lg shadow-xl w-80 max-w-[calc(100vw-2rem)] flex items-start gap-3 ${t.variant === 'destructive' ? 'border-l-4 border-red-500' :
                                t.variant === 'success' ? 'border-l-4 border-green-500' :
                                    t.variant === 'warning' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-blue-500'
                            }`}>
                                <div className="flex-1">
                                    <div className="toast__title font-semibold text-gray-800">{t.title}</div>
                                    {t.description && <div className="toast__desc text-sm text-gray-600 mt-1">{t.description}</div>}
                                </div>
                                <Button variant="ghost" size="sm" className="p-1 -mr-2 -mt-2 h-auto text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full" onClick={() => dismissToast(t.id)} aria-label="Dismiss toast">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                    </svg>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </AuthGate>
            <div id="modal-root"></div>
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            <SpeedInsights />
            <Analytics />
        </QueryClientProvider>
    );
}