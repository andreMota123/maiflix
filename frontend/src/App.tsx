import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import BlockedPage from './pages/BlockedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminFeedPage from './pages/admin/AdminFeedPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWebhookLogsPage from './pages/admin/AdminWebhookLogsPage';
import HomePage from './pages/user/HomePage';
import UserFeedPage from './pages/user/UserFeedPage';
import CommunityPage from './pages/user/CommunityPage';
import ProfilePage from './pages/user/ProfilePage';

function App() {
  const { auth } = useAuth();

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!auth.token ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/blocked" element={<BlockedPage />} />
      
      {/* FIX: Refactored routing to correctly use nested routes with layout components as required by React Router v6. */}
      {/* Admin Routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminFeedPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="logs" element={<AdminWebhookLogsPage />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>
      </Route>

      {/* User Routes */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="feed" element={<UserFeedPage />} />
          <Route path="comunidade" element={<CommunityPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;