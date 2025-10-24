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
    console.time('loadAll'); // Start timing the loadAll function
    try {
      setLoading('products', true);
      setLoading('customers', true);
      setLoading('sales', true);
      const [products, customers, sales] = await Promise.all([
        api.fetchProducts(),
        api.fetchCustomers(),
        api.fetchSales()
      ]);

      // Map products
      setProducts(products.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price) // Ensure price is a number
      })));

      // Map customers
      setCustomers(customers.map(c => ({
        id: c.id,
        name: c.name,
        contact: c.contact || 'N/A', // Default to 'N/A' if contact is null
        address: c.address,
        dateAdded: new Date(c.dateAdded) // Convert dateAdded to a Date object
      })));

      // Map sales
      setSales(sales.map(s => ({
        id: s.id,
        saleTimestamp: new Date(s.saleTimestamp), // Convert saleTimestamp to a Date object
        totalAmount: parseFloat(s.totalAmount), // Ensure totalAmount is a number
        customerId: s.customerId,
        customerName: s.customerName
      })));

      // If sale items are needed, fetch and map them here
      // Example:
      // const saleItems = await api.fetchSaleItems();
      // setSaleItems(saleItems.map(item => ({
      //   id: item.id,
      //   saleId: item.saleId,
      //   productId: item.productId,
      //   productName: item.productName,
      //   quantity: item.quantity,
      //   priceAtSale: parseFloat(item.priceAtSale),
      //   subtotal: parseFloat(item.subtotal)
      // })));
    } catch (e) {
      console.error('Error loading data', e);
    } finally {
      console.timeEnd('loadAll'); // End timing and log the duration
    }
  };

  useEffect(() => { loadAll(); }, []);

  const renderPage = () => {
    console.time('renderPage'); // Start timing the renderPage function
    let page;
    switch (currentPage) {
      case 'products':
        page = <ProductManagementPage reload={loadAll} />;
        break;
      case 'customers':
        page = <CustomerManagementPage reload={loadAll} />;
        break;
      case 'history':
        page = <HistoryPage reload={loadAll} />;
        break;
      case 'pos':
      default:
        page = <POSPage reload={loadAll} />;
    }
    console.timeEnd('renderPage'); // End timing and log the duration
    return page;
  };

  return (
    <div className="app">
      {/* Sidebar for md+ */}
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">SEASIDE POS</div>

        <nav aria-label="Primary" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <Button variant={currentPage === 'pos' ? 'primary' : 'ghost'} onClick={() => setCurrentPage('pos')}>Point of Sale</Button>
          <Button variant={currentPage === 'products' ? 'primary' : 'ghost'} onClick={() => setCurrentPage('products')}>Products</Button>
          <Button variant={currentPage === 'customers' ? 'primary' : 'ghost'} onClick={() => setCurrentPage('customers')}>Customers</Button>
          <Button variant={currentPage === 'history' ? 'primary' : 'ghost'} onClick={() => setCurrentPage('history')}>History</Button>
        </nav>

        <div className="meta">API: {process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8055'}</div>
      </aside>

      {/* Mobile header (visible on small screens) */}
      <header className="mobile-header" role="banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div className="mobile-title">SEASIDE POS</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant={currentPage === 'pos' ? 'primary' : 'ghost'} onClick={() => setCurrentPage('pos')}>POS</Button>
          <Button variant={currentPage === 'products' ? 'primary' : 'ghost'} onClick={() => setCurrentPage('products')}>Products</Button>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {renderPage()}
        </div>
      </main>

      {/* Toasts */}
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
  );
}
