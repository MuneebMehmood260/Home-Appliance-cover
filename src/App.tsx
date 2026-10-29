import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// Common Components
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { CartDrawer } from './components/common/CartDrawer';
import { SupabaseStatusBanner } from './components/common/SupabaseStatusBanner';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ShopPage } from './pages/public/ShopPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { CategoriesPage } from './pages/public/CategoriesPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Admin Components & Pages
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ProductsManagerPage } from './pages/admin/ProductsManagerPage';
import { CategoriesManagerPage } from './pages/admin/CategoriesManagerPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { OrdersManagerPage } from './pages/admin/OrdersManagerPage';
import { BulkImportPage } from './pages/admin/BulkImportPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { SqlSetupGuidePage } from './pages/admin/SqlSetupGuidePage';

// Public Layout Wrapper
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <SupabaseStatusBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#18181b',
                  color: '#fff',
                  fontSize: '12px',
                  borderRadius: '10px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
              }}
            />

            <Routes>
              {/* Public Storefront Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Admin Login Route */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="products" element={<ProductsManagerPage />} />
                <Route path="categories" element={<CategoriesManagerPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="orders" element={<OrdersManagerPage />} />
                <Route path="import" element={<BulkImportPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="sql-setup" element={<SqlSetupGuidePage />} />
              </Route>
            </Routes>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
