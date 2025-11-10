import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

// FIX: Update JSDoc to use @type for better TypeScript interoperability in .jsx files. This ensures the 'children' prop is correctly typed.
/**
 * @type {React.FC<{ children: React.ReactNode }>}
 */
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: localStorage.getItem('maiflix_token'), user: null, loading: true });
  const navigate = useNavigate();

  const verifyUserSubscription = useCallback(async () => {
    if (!auth.token) {
      setAuth({ token: null, user: null, loading: false });
      return;
    }
    try {
      const { data } = await api.get('/check-subscription');
      if (data.isSubscribed) {
        setAuth({ token: auth.token, user: { isSubscribed: true }, loading: false });
      } else {
        localStorage.removeItem('maiflix_token');
        setAuth({ token: null, user: null, loading: false });
        navigate('/blocked');
      }
    } catch (error) {
      console.error("Erro ao verificar assinatura, fazendo logout.", error);
      localStorage.removeItem('maiflix_token');
      setAuth({ token: null, user: null, loading: false });
    }
  }, [auth.token, navigate]);

  useEffect(() => {
    verifyUserSubscription();
  }, [verifyUserSubscription]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('maiflix_token', data.token);
    setAuth({ token: data.token, user: { isSubscribed: true }, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('maiflix_token');
    setAuth({ token: null, user: null, loading: false });
    navigate('/login');
  };

  const value = { auth, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!auth.loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);