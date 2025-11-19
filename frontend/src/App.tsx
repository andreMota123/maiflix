
import React, { useState, FC, useEffect } from 'react';
import { Page, Product, Banner } from './types';
import { HomeIcon, InfoIcon, UserGroupIcon, UserCircleIcon, UsersIcon, BoxIcon, PhotoIcon, Cog6ToothIcon, ClipboardDocumentListIcon } from './components/Icons';
import { useAuth } from './contexts/AuthContext';

// Importação das Páginas Reais (Restaurando funcionalidades completas)
import LoginPage from './pages/LoginPage';
import HomePage from './pages/user/HomePage';
import UserFeedPage from './pages/user/UserFeedPage';
import CommunityPage from './pages/user/CommunityPage';
import ProfilePage from './pages/user/ProfilePage';
import AdminFeedPage from './pages/admin/AdminFeedPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWebhookLogsPage from './pages/admin/AdminWebhookLogsPage'; // Página de Logs adicionada

import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Error Boundary Simples para Produção
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg text-white p-4">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Algo deu errado.</h2>
          <button onClick={() => window.location.reload()} className="bg-brand-primary px-4 py-2 rounded">
            Recarregar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: FC = () => {
    const { auth } = useAuth();
    const [activePage, setActivePage] = useState<string>(window.location.pathname);

    // Sincronizar URL simples (para evitar router complexo agora, mantendo a lógica anterior mas limpa)
    useEffect(() => {
        const handlePopState = () => setActivePage(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        setActivePage(path);
    };

    if (!auth.user) {
        return (
            <ErrorBoundary>
                <LoginPage />
            </ErrorBoundary>
        );
    }

    const isAdmin = auth.user.role === 'admin';

    // Roteamento Manual Simplificado para restaurar funcionamento
    const renderContent = () => {
        // Rotas de Admin
        if (isAdmin) {
            if (activePage === '/admin' || activePage === '/admin/') return <AdminFeedPage />;
            if (activePage === '/admin/users') return <AdminUsersPage />;
            if (activePage === '/admin/products') return <AdminProductsPage />;
            if (activePage === '/admin/banners') return <AdminBannersPage />;
            if (activePage === '/admin/settings') return <AdminSettingsPage />;
            if (activePage === '/admin/logs') return <AdminWebhookLogsPage />;
        }

        // Rotas de Usuário
        if (activePage === '/' || activePage === '') return <HomePage />;
        if (activePage === '/feed') return <UserFeedPage />;
        if (activePage === '/comunidade') return <CommunityPage />;
        if (activePage === '/perfil') return <ProfilePage />;

        // Fallback
        return isAdmin ? <AdminFeedPage /> : <HomePage />;
    };

    return (
        <ErrorBoundary>
             {isAdmin ? (
                 <AdminLayout>
                     {renderContent()}
                 </AdminLayout>
             ) : (
                 <UserLayout>
                     {renderContent()}
                 </UserLayout>
             )}
        </ErrorBoundary>
    );
};

export default App;
