import '../styles/globals.css';
import React, { useState } from 'react';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'next/router';
import Sidebar from '../src/components/Sidebar';
import { Button } from '../src/components/ui';

// --- NEW IMPORTS for Offline-First ---
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';
// -------------------------------------

// --- NEW: Setup for IndexedDB Persister ---
// Uses idb-keyval for simple async storage
const storage = {
    setItem: async (key, value) => { await set(key, value); },
    getItem: async (key) => { return await get(key); },
    removeItem: async (key) => { await del(key); },
};
const persister = createSyncStoragePersister({ storage: storage });
// ------------------------------------------

// --- NEW: Create the QueryClient ---
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Keep cached data for 7 days
            gcTime: 1000 * 60 * 60 * 24 * 7,
        },
        mutations: {
            // Configure mutations to retry 3 times if they fail (e.g., offline)
            retry: (failureCount, error) => {
                // Don't retry auth errors
                if (error.status === 401) return false;
                return failureCount < 3;
            },
        },
    },
});
// -----------------------------------


function AuthGate({ children }) {
    const token = useStore(s => s.token);
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);

    React.useEffect(() => {
        setIsHydrated(true);
        if (isHydrated) {
            if (!token && router.pathname !== '/login') {
                router.push('/login');
            }
            if (token && router.pathname === '/login') {
                router.push('/');
            }
        }
    }, [token, router, isHydrated]);

    if (!isHydrated) {
        return <div>Loading...</div>; // Prevent mismatched rendering during hydration
    }

    if (router.pathname === '/login' || token) {
        return children;
    }

    return null;
}

export default function App({ Component, pageProps }) {
    // We only get toast functions from the store here
    // products, customers, sales are no longer loaded globally
    const { toasts, dismissToast } = useStore();
    const router = useRouter();
    const isLoginPage = router.pathname === '/login';

    // The old `loadAll` function and its useEffect are no longer needed.
    // TanStack Query will now fetch data on a per-component basis.

    return (
        // --- NEW: Wrap your app in the provider ---
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            <AuthGate>
                <div className="app">
                    {!isLoginPage && <Sidebar />}
                    <main className="main">
                        <div className="container">
                            {/* We pass a new 'reload' prop that invalidates all queries */}
                            <Component {...pageProps} reload={() => queryClient.invalidateQueries()} />
                        </div>
                    </main>
                    <div className="toasts" aria-live="polite">
                        {toasts.map(t => (
                            <div key={t.id} className="toast">
                                <div className="toast__title">{t.title}</div>
                                <div className="toast__desc">{t.description}</div>
                                <div className="toast__actions">
                                    <Button variant="ghost" size="sm" onClick={() => dismissToast(t.id)}>Dismiss</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AuthGate>
        </PersistQueryClientProvider> // --- End provider wrap ---
    );
}