// src/pages/_app.js
import '../../styles/globals.css';
import '../../styles/navbar.css';
import 'react-day-picker/dist/style.css';
import '../components/pages/POSPage.css';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import TabBar from '../components/TabBar';
import OfflineScreen from '../components/OfflineScreen';
import GlobalVehicleAlert from '../components/tracking/GlobalVehicleAlert';
import ScheduledFloaterToast from '../components/ScheduledFloaterToast';
import { isWebGLAvailable } from '../components/SafeWebGL';
import { Button } from '../components/ui';
import { QueryClient, QueryClientProvider, HydrationBoundary, MutationCache } from '@tanstack/react-query';
import Head from 'next/head';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import CinematicTransition from '../components/transitions/CinematicTransition';

const titleMap = {
    '/': 'Seaside Purified Water Refilling Station | Labrador, Pangasinan',
    '/about': 'About Us | Seaside WRS',
    '/dashboard': 'Dashboard | Seaside WRS',
    '/pos': 'POS | Seaside WRS',
    '/inventory': 'Inventory | Seaside WRS',
    '/report': 'Reports | Seaside WRS',
    '/user-management': 'User Management | Seaside WRS',
    '/product-management': 'Product Management | Seaside WRS',
    '/customer-management': 'Customer Management | Seaside WRS',
    '/gallery-management': 'Gallery Management | Seaside WRS',
    '/article-management': 'Article Management | Seaside WRS',
    '/settings': 'Settings | Seaside WRS',
    '/history': 'History | Seaside WRS',
    '/scanned-logs': 'Scanned Logs | Seaside WRS',
    '/expenses': 'Expenses | Seaside WRS',
    '/salary-monitoring': 'Salary Monitoring | Seaside WRS',
    '/debt-management': 'Debt Management | Seaside WRS',
    '/incentives': 'Incentives | Seaside WRS',
    '/terms': 'Terms of Service | Seaside WRS',
    '/privacy': 'Privacy Policy | Seaside WRS',
    '/contact': 'Contact Us | Seaside WRS',
    '/maintenance': 'Maintenance Tracking | Seaside WRS',
    '/activity-logs': 'Activity Logs | Seaside WRS',
    '/refill-game': 'Refill Simulator Data | Seaside WRS',
};

const NON_TRANSACTION_QUERY_KEYS = new Set([
    'notes',
    'business-settings',
    'maintenance-alerts',
    'pending-approvals-count',
    'recent-contact-messages-count',
    'activity-logs',
    'refill-game',
    'refill-leaderboard'
]);

const RELOAD_GUARD_KEY = 'seaside_last_auto_reload_ts';
const LAST_ACTIVE_STORAGE_KEY = 'seaside_last_active_at';
const IDLE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes closed/idle threshold

class TransitionErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.warn('3D Transition skipped:', error?.message || error);
        this.props.onErrorComplete?.();
    }

    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, recoveredWebGL: false };
    }

    static getDerivedStateFromError(error) {
        const msg = String(error?.message || error || '');
        const isWebGLError =
            msg.includes('WebGL') ||
            msg.includes('THREE.') ||
            msg.includes('BindToCurrentSequence');

        if (isWebGLError && typeof window !== 'undefined' && !window.__SEASIDE_DISABLE_3D__) {
            window.__SEASIDE_DISABLE_3D__ = true;
            return { hasError: false, recoveredWebGL: true };
        }

        return { hasError: true, recoveredWebGL: isWebGLError };
    }

    componentDidCatch(error, info) {
        console.error('Client exception caught by AppErrorBoundary:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center p-5 bg-slate-100 dark:bg-slate-950 text-center">
                    <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-800/60 flex items-center justify-center mx-auto">
                            <img src="/seaside.png" alt="Seaside WRS" className="w-9 h-9 object-contain" />
                        </div>
                        <div className="space-y-1.5">
                            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                {this.state.recoveredWebGL ? '3D Graphics Disabled on Browser' : 'Display Interrupted'}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {this.state.recoveredWebGL
                                    ? 'WebGL is disabled in your browser settings. Tap below to continue in standard mode.'
                                    : 'An unexpected error occurred while rendering this view.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    window.__SEASIDE_DISABLE_3D__ = true;
                                }
                                this.setState({ hasError: false });
                            }}
                            className="w-full h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function readLastActiveTime() {
    if (typeof window === 'undefined') return 0;
    try {
        return Number(localStorage.getItem(LAST_ACTIVE_STORAGE_KEY) || '0');
    } catch {
        return 0;
    }
}

function writeLastActiveTime(ts = Date.now()) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, String(ts));
    } catch {
        // Ignore storage errors
    }
}

function safeHardNavigate(targetUrl) {
    if (typeof window === 'undefined') return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    try {
        const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
        if (Date.now() - lastReload < 15000) return;
        sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    } catch {
        // Ignore storage errors
    }

    if (targetUrl) {
        window.location.assign(targetUrl);
    } else {
        window.location.reload();
    }
}

function AuthGate({ children }) {
    const user = useStore(s => s.user);
    const logout = useStore(s => s.logout);
    const sessionLoaded = useStore(s => s.sessionLoaded);
    const router = useRouter();
    const [isExpiringSession, setIsExpiringSession] = useState(false);

    useEffect(() => {
        if (!sessionLoaded) return;

        const cleanPath = (router.pathname || '').toLowerCase();

        if (cleanPath === '/login') {
            router.replace('/');
            return;
        }

        if (user) {
            const lastActive = readLastActiveTime();
            if (lastActive > 0 && Date.now() - lastActive > IDLE_THRESHOLD_MS) {
                setIsExpiringSession(true);
                writeLastActiveTime(Date.now());

                Promise.resolve(logout ? logout() : useStore.setState({ user: null })).finally(() => {
                    setIsExpiringSession(false);
                    if (router.pathname !== '/') {
                        router.replace('/');
                    }
                });
                return;
            }

            writeLastActiveTime(Date.now());
        }

        const isLoggedIn = !!user;
        const isPublicPage =
            ['/', '/about', '/terms', '/privacy', '/contact', '/404'].includes(router.pathname) ||
            router.pathname.startsWith('/resources');

        if (!isLoggedIn && !isPublicPage) {
            router.replace('/');
        }
    }, [user, logout, sessionLoaded, router.pathname]);

    useEffect(() => {
        const isNewTabSession = typeof window !== 'undefined' && !sessionStorage.getItem('pos_tab_initialized');
        if (isNewTabSession) {
            sessionStorage.setItem('pos_tab_initialized', 'true');
        }
    }, []);

    if (!sessionLoaded || isExpiringSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
                {isExpiringSession ? 'Session expired after inactivity. Returning to login...' : 'Loading application...'}
            </div>
        );
    }

    if (
        ['/', '/about', '/terms', '/privacy', '/contact', '/404'].includes(router.pathname) ||
        router.pathname.startsWith('/resources') ||
        user
    ) {
        return children;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
            Returning to login...
        </div>
    );
}

export default function App({ Component, pageProps }) {
    const toasts = useStore(s => s.toasts);
    const dismissToast = useStore(s => s.dismissToast);
    const darkMode = useStore(s => s.darkMode);
    const user = useStore(s => s.user);
    const logout = useStore(s => s.logout);
    const router = useRouter();

    const [isTransitionActive, setIsTransitionActive] = useState(false);
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [isReconnected, setIsReconnected] = useState(false);
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);
    const [webglSupported, setWebglSupported] = useState(false);

    const initialCheckDoneRef = useRef(false);
    const lastWriteThrottleRef = useRef(0);
    const probeInFlightRef = useRef(false);
    const isOfflineRef = useRef(false);
    const reconnectTimerRef = useRef(null);
    const txSyncTimerRef = useRef(null);

    const scheduleTransactionSync = useCallback((client) => {
        if (!client) return;
        if (txSyncTimerRef.current) {
            clearTimeout(txSyncTimerRef.current);
        }
        txSyncTimerRef.current = setTimeout(() => {
            txSyncTimerRef.current = null;
            client.invalidateQueries({
                refetchType: 'active',
                predicate: (query) => {
                    const rootKey = Array.isArray(query.queryKey) ? String(query.queryKey[0]) : '';
                    return !NON_TRANSACTION_QUERY_KEYS.has(rootKey);
                }
            });
        }, 600);
    }, []);

    const [queryClient] = useState(() => {
        const client = new QueryClient({
            defaultOptions: {
                queries: {
                    gcTime: 1000 * 60 * 60 * 24,
                    staleTime: 1000 * 60 * 10, // Keep pages cached for 10 mins so switching routes is instant
                    refetchOnWindowFocus: false,
                    refetchOnReconnect: false,
                    refetchOnMount: false, // Do not re-fetch on mount unless invalidated by a new transaction
                    retry: false,
                },
            },
            mutationCache: new MutationCache({
                onMutate: async () => {
                    const { user: currentUser, addToast } = useStore.getState();

                    if (currentUser?.isDemo) {
                        setTimeout(() => {
                            addToast({
                                title: 'Demo Mode Active',
                                description: 'Adding, editing, and deleting is disabled in this environment.',
                                variant: 'warning'
                            });
                        }, 0);
                        return Promise.reject(new Error('Action blocked: Demo Mode is strictly read-only.'));
                    }
                },
                onSuccess: (_data, _variables, _context, mutation) => {
                    const mKey = Array.isArray(mutation?.options?.mutationKey)
                        ? String(mutation.options.mutationKey[0])
                        : '';
                    if (mKey.includes('activity') || mKey.includes('refill')) return;

                    // Mark transaction/inventory queries stale only when a transaction mutation succeeds
                    client.invalidateQueries({
                        refetchType: 'active',
                        predicate: (query) => {
                            const rootKey = Array.isArray(query.queryKey) ? String(query.queryKey[0]) : '';
                            return !NON_TRANSACTION_QUERY_KEYS.has(rootKey);
                        }
                    });
                }
            })
        });
        return client;
    });

    // Listen for new transactions in Supabase Realtime (sales, expenses, debts, products, shifts)
    // Only invalidates data when an actual transaction occurs; zero polling/reloading when idle
    useEffect(() => {
        if (!user?.id || user?.isDemo) return;

        const txChannel = supabase
            .channel(`rt:transactions-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
                scheduleTransactionSync(queryClient);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
                scheduleTransactionSync(queryClient);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => {
                scheduleTransactionSync(queryClient);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                scheduleTransactionSync(queryClient);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
                scheduleTransactionSync(queryClient);
            })
            .subscribe();

        return () => {
            if (txSyncTimerRef.current) {
                clearTimeout(txSyncTimerRef.current);
            }
            supabase.removeChannel(txChannel);
        };
    }, [user?.id, user?.isDemo, queryClient, scheduleTransactionSync]);

    const enterOfflineState = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        isOfflineRef.current = true;
        setIsReconnected(false);
        setIsOffline(true);
    }, []);

    const triggerOnlineCelebration = useCallback(() => {
        if (!isOfflineRef.current) {
            setIsOffline(false);
            setIsReconnected(false);
            return;
        }

        if (reconnectTimerRef.current) return;

        setIsReconnected(true);
        reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            isOfflineRef.current = false;
            setIsReconnected(false);
            setIsOffline(false);
        }, 1450);
    }, []);

    useEffect(() => {
        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
        };
    }, []);

    const verifyInternetConnection = useCallback(async () => {
        if (typeof window === 'undefined') return true;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            enterOfflineState();
            return false;
        }

        setIsCheckingConnection(true);
        try {
            const probeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`
                : 'https://www.gstatic.com/generate_204';

            await fetch(probeUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            });

            triggerOnlineCelebration();
            return true;
        } catch {
            enterOfflineState();
            return false;
        } finally {
            setIsCheckingConnection(false);
        }
    }, [enterOfflineState, triggerOnlineCelebration]);

    // Global Offline / Disconnected Network Listener
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (navigator.onLine === false) {
            enterOfflineState();
        }

        const handleOffline = () => enterOfflineState();
        const handleOnline = () => {
            verifyInternetConnection();
        };

        const originalFetch = window.fetch.bind(window);
        window.fetch = async (input, init) => {
            try {
                return await originalFetch(input, init);
            } catch (err) {
                const reqUrl = typeof input === 'string' ? input : input?.url || '';
                const isAborted = Boolean(init?.signal?.aborted || err?.name === 'AbortError');
                const isExternalApi =
                    reqUrl.includes('supabase.co') ||
                    (reqUrl.startsWith('http') && !reqUrl.startsWith(window.location.origin));

                if (!isAborted && isExternalApi) {
                    if (navigator.onLine === false) {
                        enterOfflineState();
                    } else if (!probeInFlightRef.current) {
                        probeInFlightRef.current = true;
                        const probeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`
                            : 'https://www.gstatic.com/generate_204';

                        originalFetch(probeUrl, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
                            .then(() => {
                                if (isOfflineRef.current) {
                                    triggerOnlineCelebration();
                                }
                            })
                            .catch(() => {
                                enterOfflineState();
                            })
                            .finally(() => {
                                probeInFlightRef.current = false;
                            });
                    }
                }
                throw err;
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.fetch = originalFetch;
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [enterOfflineState, triggerOnlineCelebration, verifyInternetConnection]);

    // Poll every 4s only while offline so reconnection triggers automatically
    useEffect(() => {
        if (!isOffline || isReconnected) return;
        const interval = setInterval(() => {
            verifyInternetConnection();
        }, 4000);
        return () => clearInterval(interval);
    }, [isOffline, isReconnected, verifyInternetConnection]);

    // Track active usage & redirect to login page (/) only if app was closed/inactive for > 30 mins
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const recordActivityThrottled = () => {
            if (!useStore.getState().user) return;
            const now = Date.now();
            if (now - lastWriteThrottleRef.current > 30000) {
                lastWriteThrottleRef.current = now;
                writeLastActiveTime(now);
            }
        };

        const handleChunkOrAssetError = (event) => {
            const msg = String(event?.message || event?.reason?.message || '');
            const targetSrc = event?.target?.src || event?.target?.href || '';

            const isStaleNextAsset =
                msg.includes('ChunkLoadError') ||
                msg.includes('Loading chunk') ||
                msg.includes('Failed to fetch dynamically imported module') ||
                targetSrc.includes('/_next/static/');

            if (isStaleNextAsset) {
                if (navigator.onLine === false) {
                    enterOfflineState();
                } else {
                    safeHardNavigate('/');
                }
            }
        };

        const handleWakeUp = async () => {
            const now = Date.now();
            const storedLastActive = readLastActiveTime();
            const idleDuration = storedLastActive > 0 ? now - storedLastActive : 0;

            if (navigator.onLine === false) {
                enterOfflineState();
                return;
            }

            if (router.pathname === '/404' || window.location.pathname.toLowerCase() === '/login') {
                safeHardNavigate('/');
                return;
            }

            if (useStore.getState().user && idleDuration > IDLE_THRESHOLD_MS) {
                writeLastActiveTime(now);
                await Promise.resolve(logout ? logout() : useStore.setState({ user: null }));
                safeHardNavigate('/');
                return;
            }

            if (useStore.getState().user) {
                writeLastActiveTime(now);
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (useStore.getState().user) {
                    writeLastActiveTime(Date.now());
                }
            } else if (document.visibilityState === 'visible') {
                handleWakeUp();
            }
        };

        const onPageHide = () => {
            if (useStore.getState().user) {
                writeLastActiveTime(Date.now());
            }
        };

        window.addEventListener('pointerdown', recordActivityThrottled, { passive: true });
        window.addEventListener('keydown', recordActivityThrottled, { passive: true });
        window.addEventListener('error', handleChunkOrAssetError, true);
        window.addEventListener('unhandledrejection', handleChunkOrAssetError);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', onPageHide);

        return () => {
            window.removeEventListener('pointerdown', recordActivityThrottled);
            window.removeEventListener('keydown', recordActivityThrottled);
            window.removeEventListener('error', handleChunkOrAssetError, true);
            window.removeEventListener('unhandledrejection', handleChunkOrAssetError);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('pagehide', onPageHide);
        };
    }, [router.pathname, logout, enterOfflineState]);

    useEffect(() => {
        const hasWebGL = isWebGLAvailable();
        setWebglSupported(hasWebGL);

        const checkShouldTransition = (path) => {
            if (!hasWebGL) return false;
            const cleanPath = (path || router.pathname).split('?')[0].split('#')[0].toLowerCase();
            return cleanPath === '/' || cleanPath === '/about';
        };

        if (!initialCheckDoneRef.current) {
            initialCheckDoneRef.current = true;
            if (checkShouldTransition(router.pathname)) {
                setIsTransitionActive(true);
            }
        }

        const handleRouteChangeStart = (url) => {
            if (navigator.onLine === false) {
                enterOfflineState();
                return;
            }
            const targetPath = url.split('?')[0].split('#')[0].toLowerCase();
            const currentPath = router.asPath.split('?')[0].split('#')[0].toLowerCase();
            if (hasWebGL && (targetPath === '/' || targetPath === '/about') && targetPath !== currentPath) {
                setIsRouteLoading(true);
                setIsTransitionActive(true);
            }
        };

        const handleRouteChangeDone = () => {
            setIsRouteLoading(false);
            if (useStore.getState().user) {
                writeLastActiveTime(Date.now());
            }
        };

        const handleRouteChangeError = (err, url) => {
            setIsRouteLoading(false);
            if (navigator.onLine === false) {
                enterOfflineState();
                return;
            }
            if (!err?.cancelled && url) {
                safeHardNavigate('/');
            }
        };

        router.events.on('routeChangeStart', handleRouteChangeStart);
        router.events.on('routeChangeComplete', handleRouteChangeDone);
        router.events.on('routeChangeError', handleRouteChangeError);

        return () => {
            router.events.off('routeChangeStart', handleRouteChangeStart);
            router.events.off('routeChangeComplete', handleRouteChangeDone);
            router.events.off('routeChangeError', handleRouteChangeError);
        };
    }, [router, enterOfflineState]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        const title = titleMap[router.pathname] || 'Seaside WRS';
        document.title = title;
    }, [router.pathname]);

    const isPublicPage =
        ['/', '/about', '/terms', '/privacy', '/contact', '/404'].includes(router.pathname) ||
        router.pathname.startsWith('/resources');
    const hideNav = isPublicPage;

    return (
        <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={pageProps.dehydratedState}>
                <Head>
                    <title>Seaside WRS</title>
                    <meta property="og:title" content="Seaside WRS" />
                    <meta property="og:description" content="Seaside Purified Water Refilling Station in Labrador, Pangasinan" />
                    <meta property="og:image" content="https://seasidepos.vercel.app/seasideHD_.png" />
                    <meta property="og:url" content="https://seasidepos.vercel.app/" />
                    <meta property="og:type" content="website" />
                    <meta property="fb:app_id" content="27475487768800861" />
                    <link rel="icon" href="/seaside.png" />
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                    <meta name="theme-color" content="#8DB600" />
                    <link rel="manifest" href="/manifest.json" />
                    <link rel="apple-touch-icon" href="/seasidelogo_.png" />
                </Head>

                {isOffline && (
                    <OfflineScreen
                        onRetry={verifyInternetConnection}
                        isChecking={isCheckingConnection}
                        isReconnected={isReconnected}
                    />
                )}

                {isTransitionActive && webglSupported && !isOffline && (
                    <TransitionErrorBoundary onErrorComplete={() => setIsTransitionActive(false)}>
                        <CinematicTransition
                            isRouteLoading={isRouteLoading}
                            onComplete={() => setIsTransitionActive(false)}
                        />
                    </TransitionErrorBoundary>
                )}

                <AppErrorBoundary>
                    <AuthGate>
                        <div className={`app responsive-page ${!hideNav ? 'md:pl-64' : ''}`}>
                            {user?.isDemo && !isPublicPage && (
                                <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 shadow-sm">
                                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        <span className="text-xs font-bold">Demo Mode — All data is read-only. Adding, editing, and deleting are disabled.</span>
                                    </div>
                                </div>
                            )}
                            {!hideNav && <Navbar />}
                            {!hideNav && <TabBar />}

                            {isPublicPage ? (
                                <Component {...pageProps} />
                            ) : (
                                <main className="main pb-24 md:pb-6">
                                    <div className="container">
                                        <Component {...pageProps} />
                                    </div>
                                </main>
                            )}

                            <div className="toasts fixed bottom-24 md:bottom-4 right-4 z-50 flex flex-col items-end gap-3" aria-live="polite">
                                {toasts.map(t => (
                                    <div key={t.id} className={`toast bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-xl w-80 max-w-[calc(100vw-2rem)] flex items-start gap-3 ${
                                        t.variant === 'destructive' ? 'border-l-4 border-red-500' :
                                            t.variant === 'success' ? 'border-l-4 border-[#8DB600]' :
                                                t.variant === 'warning' ? 'border-l-4 border-amber-500' : 'border-l-4 border-blue-500'
                                    }`}>
                                        <div className="flex-1">
                                            <div className="toast__title font-semibold text-gray-800 dark:text-gray-100">{t.title}</div>
                                            {t.description && <div className="toast__desc text-sm text-gray-600 dark:text-gray-300 mt-1">{t.description}</div>}
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" className="p-1 -mr-2 -mt-2 h-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" onClick={() => dismissToast(t.id)} aria-label="Dismiss toast">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                            </svg>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <GlobalVehicleAlert />
                        <ScheduledFloaterToast />
                    </AuthGate>
                </AppErrorBoundary>
                <div id="modal-root"></div>
                <SpeedInsights />
                <Analytics />
            </HydrationBoundary>
        </QueryClientProvider>
    );
}