import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importação das Rotas e Layouts
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import LoginPage from './pages/LoginPage';
import BlockedPage from './pages/BlockedPage';
import HomePage from './pages/user/HomePage';
import UserFeedPage from './pages/user/UserFeedPage';
import CommunityPage from './pages/user/CommunityPage';
import ProfilePage from './pages/user/ProfilePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWebhookLogsPage from './pages/admin/AdminWebhookLogsPage';
import AdminFeedPage from './pages/admin/AdminFeedPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';

// --- ERROR BOUNDARY ---
interface ErrorBoundaryProps { children?: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  readonly props: Readonly<ErrorBoundaryProps>;
  constructor(props: ErrorBoundaryProps) { super(props); this.props = props; }
  static getDerivedStateFromError(_error: Error): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("Erro não capturado:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-gray-400 flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">Oops! Algo deu errado.</h2>
          <button onClick={() => window.location.reload()} className="bg-pink-600 text-white px-4 py-2 rounded">Recarregar Página</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CONFIGS ---
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

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [colors, setColors] = useState<Record<string, string>>(() => {
        const savedColors = localStorage.getItem('maiflix-colors');
        if (savedColors) {
            try {
                const parsed: unknown = JSON.parse(savedColors);
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    const allValuesAreStrings = Object.values(parsed as Record<string, unknown>).every((value) => typeof value === 'string');
                    if (allValuesAreStrings) return parsed as Record<string, string>;
                }
            } catch (e) { console.error('Could not parse colors:', e); }
        }
        return DEFAULT_COLORS;
    });

    useEffect(() => {
        Object.entries(colors).forEach(([key, value]) => { document.documentElement.style.setProperty(COLOR_VAR_MAP[key], value as string); });
        localStorage.setItem('maiflix-colors', JSON.stringify(colors));
    }, [colors]);

    return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/blocked" element={<BlockedPage />} />
        
        {/* Rotas de Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminFeedPage />} /> 
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="logs" element={<AdminWebhookLogsPage />} />
        </Route>

        {/* Rotas de Usuário */}
        <Route path="/" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="feed" element={<UserFeedPage />} />
          <Route path="comunidade" element={<CommunityPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;