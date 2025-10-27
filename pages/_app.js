import '../styles/globals.css';
import React, { useState } from 'react';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'next/router';
import Sidebar from '../src/components/Sidebar';
import { Button } from '../src/components/ui';

// --- NEW IMPORTS for Offline-First ---
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
// --- CORRECTED IMPORT ---
import { get, set, del } from 'idb-keyval';
// -------------------------------------

// --- Custom IndexedDB Persister for TanStack Query ---
const persister = {
    persistClient: async (client) => {
        await set('tanstack-query-client', JSON.stringify(client));
    },
    restoreClient: async () => {
        const client = await get('tanstack-query-client');
        return client ? JSON.parse(client) : undefined;
    },
    removeClient: async () => {
        await del('tanstack-query-client');
    },
};
// ------------------------------------------

// --- Create the QueryClient (remains the same) ---
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
                // Note: Directus SDK might throw errors without a status property
                // You might need more robust error checking here based on error types
                if (error && error.status === 401) return false;
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
        // We need to run the check *after* hydration is complete
        // to ensure we have the correct token state from localStorage
    }, []); // Run only once on mount to set hydration flag

    React.useEffect(() => {
        if (isHydrated) { // Only run auth checks after hydration
            if (!token && router.pathname !== '/login') {
                router.push('/login');
            }
            if (token && router.pathname === '/login') {
                router.push('/');
            }
        }
    }, [token, router, isHydrated]); // Depend on isHydrated

    if (!isHydrated) {
        // Render nothing or a loading spinner until hydration is complete
        // This prevents content flashing or incorrect redirects
        return <div>Loading...</div>;
    }

    // Allow rendering login page or any page if token exists (after hydration)
    if (router.pathname === '/login' || token) {
        return children;
    }

    // If not hydrated, or no token and not on login, render nothing yet
    // AuthGate will redirect shortly after hydration if needed
    return null;
}

export default function App({ Component, pageProps }) {
    // We only get toast functions from the store here
    const { toasts, dismissToast } = useStore();
    const router = useRouter();
    const isLoginPage = router.pathname === '/login';

    // The old `loadAll` function and its useEffect are no longer needed.
    // TanStack Query will now fetch data on a per-component basis via hooks.

    return (
        // --- NEW: Wrap your app in the provider ---
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
            // Optional: Show loading indicator while cache is restored
            // onRestore={() => console.log('Attempting to restore cache...')}
            // onSuccess={() => console.log('Cache restored successfully!')}
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
                                {t.action && ( // Render action button if provided
                                    <div className="toast__actions">
                                        <Button variant="ghost" size="sm" onClick={t.action.onClick}>
                                            {t.action.label}
                                        </Button>
                                    </div>
                                )}
                                {/* Always show dismiss button */}
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