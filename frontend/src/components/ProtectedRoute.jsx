import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// FIX: Added a JSDoc type definition to ensure TypeScript can correctly infer the type of the 'children' prop for this functional component within a .jsx file.
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