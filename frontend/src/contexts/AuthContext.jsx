
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * @type {React.FC<{ children: React.ReactNode }>}
 */
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ 
    token: localStorage.getItem('maiflix_token'), 
    user: null, 
    loading: true 
  });
  const navigate = useNavigate();

  const verifyUserSubscription = useCallback(async () => {
    const token = localStorage.getItem('maiflix_token');
    if (!token) {
      setAuth({ token: null, user: null, loading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/check-subscription');
      if (data.isSubscribed) {
        localStorage.setItem('maiflix_user_role', data.user.role);
        setAuth({ token, user: data.user, loading: false });
      } else {
        localStorage.removeItem('maiflix_token');
        localStorage.removeItem('maiflix_user_role');
        setAuth({ token: null, user: null, loading: false });
        navigate('/blocked');
      }
    } catch (error) {
      console.error("Erro ao verificar sessão.", error.response?.data?.message || error.message);
      localStorage.removeItem('maiflix_token');
      localStorage.removeItem('maiflix_user_role');
      setAuth({ token: null, user: null, loading: false });
      if (error.response?.status === 403) {
        navigate('/blocked');
      }
    }
  }, [navigate]);

  useEffect(() => {
    verifyUserSubscription();
  }, [verifyUserSubscription]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('maiflix_token', data.token);
    // Save user role to help with immediate redirects after login
    localStorage.setItem('maiflix_user_role', data.user.role);
    setAuth({ token: data.token, user: data.user, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('maiflix_token');
    localStorage.removeItem('maiflix_user_role');
    setAuth({ token: null, user: null, loading: false });
    navigate('/login');
  };

  const value = { auth, login, logout, verifyUserSubscription };

  return (
    <AuthContext.Provider value={value}>
      {!auth.loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
