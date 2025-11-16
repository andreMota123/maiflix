import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// FIX: Added a JSDoc type definition to ensure TypeScript can correctly infer the type of the 'children' and 'role' props for this functional component within a .jsx file.
/**
 * @type {React.FC<{ children: React.ReactNode, role?: 'admin' | 'user' }>}
 */
const ProtectedRoute = ({ children, role }) => {
  const { auth } = useAuth();
  const location = useLocation();
  
  if (auth.loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg">
            <div className="text-white text-lg">Carregando...</div>
        </div>
    );
  }

  if (!auth.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // New: Role-based authorization
  if (role && auth.user.role !== role) {
    // If a user tries to access an admin route, or vice-versa, redirect them.
    return <Navigate to={auth.user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;