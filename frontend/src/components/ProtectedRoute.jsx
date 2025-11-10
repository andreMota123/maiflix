import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// FIX: Update JSDoc to use @type for better TypeScript interoperability in .jsx files. This ensures the 'children' prop is correctly typed.
/**
 * @type {React.FC<{ children: React.ReactNode }>}
 */
const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth();
  const location = useLocation();
  
  if (auth.loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-white text-lg">Carregando...</div>
        </div>
    );
  }

  if (!auth.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;