
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage'; // Yeni import
import { OrdersPage } from './pages/OrdersPage';
import { OrderFormPage } from './pages/OrderFormPage';
import { OrderViewPage } from './pages/OrderViewPage';
import ReportsPage from './pages/ReportsPage'; 
import { SettingsPage } from './pages/SettingsPage';

const ThemedApp: React.FC = () => {
  const { theme } = useAppContext();

  useEffect(() => {
    const rootHtmlElement = document.documentElement;
    if (theme === 'dark') {
      rootHtmlElement.classList.add('dark');
    } else {
      rootHtmlElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-800 p-0 md:p-0">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/new" element={<OrderFormPage />} />
              <Route path="/orders/edit/:orderId" element={<OrderFormPage />} />
              <Route path="/orders/view/:orderId" element={<OrderViewPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}


const App: React.FC = () => {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
};

export default App;