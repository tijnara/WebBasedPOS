import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import * as api from '../lib/api';
import POSPage from './pages/POSPage.jsx';
import ProductManagementPage from './pages/ProductManagementPage.jsx';
import CustomerManagementPage from './pages/CustomerManagementPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import { Button } from './ui';

export default function AppMain() {
  const { currentPage, setCurrentPage, setProducts, setCustomers, setSales, setLoading, toasts, dismissToast } = useStore();

  const loadAll = async () => {
    try {
      setLoading('products', true);
      setLoading('customers', true);
      setLoading('sales', true);
      const [products, customers, sales] = await Promise.all([api.fetchProducts(), api.fetchCustomers(), api.fetchSales()]);
      setProducts(products.map(p => ({ id: p.id, ...p })));
      setCustomers(customers.map(c => ({ id: c.id, ...c })));
      setSales(sales.map(s => ({ id: s.id, ...s })));
    } catch (e) {
      console.error('Error loading data', e);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'products': return <ProductManagementPage reload={loadAll} />;
      case 'customers': return <CustomerManagementPage reload={loadAll} />;
      case 'history': return <HistoryPage reload={loadAll} />;
      case 'pos':
      default:
        return <POSPage reload={loadAll} />;
    }
  };

  return (
    <div className="flex h-screen">
      <aside className="hidden md:flex md:flex-col w-56 bg-white border-r p-4 space-y-4">
        <h1 className="text-xl font-bold">SEASIDE POS</h1>
        <nav className="flex flex-col space-y-2">
          <Button variant={currentPage === 'pos' ? 'secondary' : 'ghost'} onClick={() => setCurrentPage('pos')}>Point of Sale</Button>
          <Button variant={currentPage === 'products' ? 'secondary' : 'ghost'} onClick={() => setCurrentPage('products')}>Products</Button>
          <Button variant={currentPage === 'customers' ? 'secondary' : 'ghost'} onClick={() => setCurrentPage('customers')}>Customers</Button>
          <Button variant={currentPage === 'history' ? 'secondary' : 'ghost'} onClick={() => setCurrentPage('history')}>History</Button>
        </nav>
        <div className="mt-auto text-xs text-gray-600">API: {process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8055'}</div>
      </aside>

      <main className="flex-1 overflow-auto p-4">{renderPage()}</main>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className="p-3 rounded shadow bg-white border">
            <div className="font-semibold">{t.title}</div>
            <div className="text-sm text-gray-600">{t.description}</div>
            <div className="text-right mt-2"><button className="text-xs text-blue-600" onClick={() => dismissToast(t.id)}>Dismiss</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
