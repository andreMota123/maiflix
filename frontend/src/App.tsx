import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BlockedPage from './pages/BlockedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AdminUsersPage from './pages/admin/AdminUsersPage';


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
      <Route path="/" element={<h1 className="p-8 text-2xl">Admin Dashboard (Em construção)</h1>} />
      <Route path="/users" element={<AdminUsersPage />} />
      {/* Future admin pages can be added here */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AdminLayout>
);


export default App;