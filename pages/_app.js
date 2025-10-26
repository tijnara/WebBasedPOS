import '../styles/globals.css';
import React, { useEffect, useState } from 'react';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'next/router';
import * as api from '../src/lib/api';
import Sidebar from '../src/components/Sidebar';
import { Button } from '../src/components/ui';

function AuthGate({ children }) {
    const token = useStore(s => s.token);
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
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
    const { setProducts, setCustomers, setSales, setLoading, toasts, dismissToast } = useStore();
    const router = useRouter();
    const isLoginPage = router.pathname === '/login';

    const loadAll = async () => {
        console.time('loadAll');
        try {
            setLoading('products', true);
            setLoading('customers', true);
            setLoading('sales', true);
            const [products, customers, sales] = await Promise.all([
                api.fetchProducts(),
                api.fetchCustomers(),
                api.fetchSales()
            ]);

            setProducts(products.map(p => ({
                id: p.id,
                name: p.name,
                price: parseFloat(p.price) || 0,
                category: p.category || 'N/A',
                stock: parseInt(p.stock, 10) || 0
            })));

            setCustomers(customers.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email || 'N/A',
                phone: c.phone || 'N/A',
                dateAdded: new Date(c.dateAdded)
            })));

            setSales(sales.map(s => ({
                id: s.id,
                saleTimestamp: new Date(s.saleTimestamp || s.created_at),
                totalAmount: parseFloat(s.totalAmount) || 0,
                customerId: s.customerId,
                customerName: s.customerName || 'N/A',
                items: s.items || [],
                paymentMethod: s.paymentMethod || 'N/A',
                status: s.status || 'Completed'
            })));
        } catch (e) {
            console.error('Error loading data', e);
        } finally {
            console.timeEnd('loadAll');
        }
    };

    useEffect(() => { loadAll(); }, []);

    return (
        <AuthGate>
            <div className="app">
                {!isLoginPage && <Sidebar />}
                <main className="main">
                    <div className="container">
                        <Component {...pageProps} reload={loadAll} />
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
    );
}