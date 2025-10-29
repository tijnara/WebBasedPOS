import React from 'react';
import Sidebar from './Sidebar';
import { useRouter } from 'next/router';

// Import page components
import POSPage from './pages/POSPage';
import ProductManagementPage from './pages/ProductManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import HistoryPage from './pages/HistoryPage';
import UserManagementPage from './pages/UserManagementPage';

const AppMain = () => {
  const router = useRouter();
  let MainContent;

  switch (router.pathname) {
    case '/':
      MainContent = <POSPage />;
      break;
    case '/product-management':
      MainContent = <ProductManagementPage />;
      break;
    case '/customer-management':
      MainContent = <CustomerManagementPage />;
      break;
    case '/history':
      MainContent = <HistoryPage />;
      break;
    case '/user-management':
      MainContent = <UserManagementPage />;
      break;
    default:
      MainContent = <POSPage />;
  }

  return (
    <div className="flex flex-row h-screen w-screen bg-gray-50">
      {/* Sidebar with reduced width */}
      <Sidebar className="w-[200px] flex-shrink-0" />

      {/* Main Content */}
      <main className="flex-1 px-8 py-6 flex items-start justify-center min-h-screen">
        {MainContent}
      </main>

      {/* Additional Section */}
      <aside className="w-[300px] flex-shrink-0 bg-gray-100 border-l border-gray-200">
        <div className="p-4">Additional Content</div>
      </aside>
    </div>
  );
};

export default AppMain;
