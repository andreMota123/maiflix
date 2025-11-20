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
import AdminFeedPage from './pages/admin/AdminFeedPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWebhookLogsPage from './pages/admin/AdminWebhookLogsPage';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Erro na aplicação:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 text-center">
          <div>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Algo deu errado</h2>
            <p className="mb-4">Tente recarregar a página.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-pink-600 px-4 py-2 rounded hover:bg-pink-700"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;