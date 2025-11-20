
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

// Pages - Public
import LoginPage from './pages/LoginPage';
import BlockedPage from './pages/BlockedPage';

// Pages - User
import HomePage from './pages/user/HomePage';
import UserFeedPage from './pages/user/UserFeedPage';
import CommunityPage from './pages/user/CommunityPage';
import ProfilePage from './pages/user/ProfilePage';

// Pages - Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminFeedPage from './pages/admin/AdminFeedPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWebhookLogsPage from './pages/admin/AdminWebhookLogsPage';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/blocked" element={<BlockedPage />} />

      {/* Rotas de Admin - Protegidas */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminFeedPage />} /> {/* Dashboard/Avisos */}
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="logs" element={<AdminWebhookLogsPage />} />
      </Route>

      {/* Rotas de Usuário - Protegidas */}
      <Route path="/" element={
        <ProtectedRoute role="user">
          <UserLayout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="feed" element={<UserFeedPage />} />
        <Route path="comunidade" element={<CommunityPage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Route>

      {/* Fallback para rotas não encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
