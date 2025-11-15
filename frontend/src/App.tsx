import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BlockedPage from './pages/BlockedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';


function App() {
  const { auth } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!auth.token ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/blocked" element={<BlockedPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            {auth.user?.role === 'admin' ? <AdminRoutes /> : <UserRoutes />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}


// Routes for regular users
const UserRoutes = () => (
  <Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// Routes for admin users, wrapped in the AdminLayout
const AdminRoutes = () => (
  <AdminLayout>
    <Routes>
      <Route path="/" element={<AdminDashboardPage />} />
      <Route path="/users" element={<AdminUsersPage />} />
      <Route path="/products" element={<AdminProductsPage />} />
      <Route path="/banners" element={<AdminBannersPage />} />
      <Route path="/settings" element={<AdminSettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AdminLayout>
);


export default App;
