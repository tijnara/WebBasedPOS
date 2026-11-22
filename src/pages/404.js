// src/pages/404.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useStore } from '../store/useStore';
import OfflineScreen from '../components/OfflineScreen';
import { RefreshCw, ArrowRight } from 'lucide-react';

const CASE_NORMALIZED_ROUTES = {
    '/messages': '/Messages',
    '/pos': '/pos',
    '/dashboard': '/dashboard',
    '/expenses': '/expenses',
    '/report': '/report',
    '/history': '/history',
    '/inventory': '/inventory',
    '/maintenance': '/maintenance',
    '/settings': '/settings',
    '/activity-logs': '/activity-logs',
    '/salary-monitoring': '/salary-monitoring',
    '/debt-management': '/debt-management',
    '/customer-management': '/customer-management',
    '/product-management': '/product-management',
    '/user-management': '/user-management',
    '/article-management': '/article-management',
    '/gallery-management': '/gallery-management',
    '/scanned-logs': '/scanned-logs',
    '/3d-icons': '/3d-icons',
    '/refill-game': '/refill-game',
};

export default function Custom404Page() {
    const logout = useStore((s) => s.logout);
    const sessionLoaded = useStore((s) => s.sessionLoaded);
    const [isRecovering, setIsRecovering] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setIsOffline(navigator.onLine === false);
        const onOffline = () => setIsOffline(true);
        const onOnline = () => setIsOffline(false);
        window.addEventListener('offline', onOffline);
        window.addEventListener('online', onOnline);
        return () => {
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('online', onOnline);
        };
    }, []);

    useEffect(() => {
        if (!sessionLoaded || typeof window === 'undefined' || isOffline) return;

        const recover = async () => {
            const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
            const lowerPath = rawPath.toLowerCase();

            const matchedRoute = CASE_NORMALIZED_ROUTES[lowerPath];
            if (matchedRoute && matchedRoute !== rawPath) {
                window.location.replace(matchedRoute + window.location.search);
                return;
            }

            try {
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }
            } catch {
                // Ignore cache errors
            }

            await Promise.resolve(logout ? logout() : useStore.setState({ user: null }));

            const timer = setTimeout(() => {
                setIsRecovering(false);
                window.location.replace('/');
            }, 600);

            return () => clearTimeout(timer);
        };

        recover();
    }, [sessionLoaded, logout, isOffline]);

    if (isOffline) {
        return (
            <OfflineScreen
                onRetry={async () => {
                    if (navigator.onLine) {
                        window.location.replace('/');
                        return true;
                    }
                    return false;
                }}
            />
        );
    }

    return (
        <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-5 text-center">
            <Head>
                <title>Returning to Login | Seaside WRS</title>
            </Head>

            <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-800/60 flex items-center justify-center mx-auto">
                    <img src="/seaside.png" alt="Seaside WRS" className="w-9 h-9 object-contain" />
                </div>

                <div className="space-y-1">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {isRecovering ? 'Returning to Login...' : 'Session Expired'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Your session was closed for a long time. Redirecting to the login page.
                    </p>
                </div>

                <div className="pt-1">
                    <button
                        type="button"
                        onClick={() => window.location.replace('/')}
                        className="w-full h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                        {isRecovering ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Opening Login Page...</span>
                            </>
                        ) : (
                            <>
                                <span>Go to Login Page</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}