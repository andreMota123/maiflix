import React, { useState, FC, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importação das Páginas Reais (Conectadas ao Backend)
import LoginPage from './pages/LoginPage';
import HomePage from './pages/user/HomePage';
import UserFeedPage from './pages/user/UserFeedPage';
import CommunityPage from './pages/user/CommunityPage';
import ProfilePage from './pages/user/ProfilePage';

// Importação das Páginas de Admin Reais
import AdminFeedPage from './pages/admin/AdminFeedPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWebhookLogsPage from './pages/admin/AdminWebhookLogsPage';
import BlockedPage from './pages/BlockedPage';

import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

const DEFAULT_COLORS: Record<string, string> = {
  'brand-bg': '#1a1a2e',
  'brand-surface': '#16213e',
  'brand-primary': '#e94560',
  'brand-secondary': '#0f3460',
  'brand-text': '#dcdcdc',
  'brand-text-light': '#a7a9be',
};

const COLOR_VAR_MAP: Record<string, string> = {
  'brand-bg': '--color-brand-bg',
  'brand-surface': '--color-brand-surface',
  'brand-primary': '--color-brand-primary',
  'brand-secondary': '--color-brand-secondary',
  'brand-text': '--color-brand-text',
  'brand-text-light': '--color-brand-text-light',
};

// Error Boundary Simples
class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean }> {
  public state = { hasError: false };
  // Explicitly define props to avoid TS errors in some environments
  readonly props: Readonly<{ children?: React.ReactNode }>;

  constructor(props: { children?: React.ReactNode }) {
      super(props);
      this.props = props;
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
    
    // Gerenciamento de Cores Globais
    const [colors] = useState<Record<string, string>>(() => {
        const savedColors = localStorage.getItem('maiflix-colors');
        if (savedColors) {
            try {
                const parsed = JSON.parse(savedColors);
                return parsed as Record<string, string>;
            } catch (e) {
                console.error(e);
            }
        }
        return DEFAULT_COLORS;
    });

    useEffect(() => {
        Object.entries(colors).forEach(([key, value]) => {
            if (COLOR_VAR_MAP[key]) {
                document.documentElement.style.setProperty(COLOR_VAR_MAP[key], value as string);
            }
        });
        localStorage.setItem('maiflix-colors', JSON.stringify(colors));
    }, [colors]);


    // --- Lógica de Roteamento ---

    // 1. Se não estiver logado, mostra Login
    if (!auth.user) {
        return (
            <ErrorBoundary>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </ErrorBoundary>
        );
    }

    // 2. Se estiver bloqueado ou inativo (e não for admin), redireciona para página de bloqueio
    if (auth.user.role !== 'admin' && (auth.user.subscriptionStatus === 'blocked' || auth.user.subscriptionStatus === 'inactive')) {
         return (
             <ErrorBoundary>
                 <Routes>
                     <Route path="/blocked" element={<BlockedPage />} />
                     <Route path="*" element={<Navigate to="/blocked" replace />} />
                 </Routes>
             </ErrorBoundary>
         )
    }

    const isAdmin = auth.user.role === 'admin';

    return (
        <ErrorBoundary>
            <Routes>
                {/* ROTAS DE ADMIN (Aninhadas no AdminLayout) */}
                {isAdmin ? (
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminFeedPage />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="products" element={<AdminProductsPage />} />
                        <Route path="banners" element={<AdminBannersPage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                        <Route path="logs" element={<AdminWebhookLogsPage />} />
                        {/* Catch-all dentro do admin */}
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Route>
                ) : (
                    /* ROTAS DE USUÁRIO (Aninhadas no UserLayout) */
                    <>
                        <Route path="/" element={<UserLayout><HomePage /></UserLayout>} />
                        <Route path="/feed" element={<UserLayout><UserFeedPage /></UserLayout>} />
                        <Route path="/comunidade" element={<UserLayout><CommunityPage /></UserLayout>} />
                        <Route path="/perfil" element={<UserLayout><ProfilePage /></UserLayout>} />
                        
                        {/* Redirecionar admin tentado acessar rota de user */}
                        <Route path="/admin/*" element={<Navigate to="/" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                )}
                
                {/* Redirecionamento Raiz Inteligente */}
                <Route path="/" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
            </Routes>
        </ErrorBoundary>
    );
};

export default App;