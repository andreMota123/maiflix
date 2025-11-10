import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const [mode, setMode] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (mode === 'admin') {
      setEmail('levitamota@gmail.com');
      setPassword('Andre9157$');
    } else {
      setEmail('');
      setPassword('');
    }
  }, [mode]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // The router in App.tsx will handle redirection based on role
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-center text-pink-500 mb-2">Maiflix</h1>
        <p className="text-center text-gray-400 mb-6">Seu universo de criatividade.</p>
        
        <div className="flex border-b border-gray-700 mb-6">
          <button onClick={() => setMode('user')} className={`flex-1 py-2 text-center font-semibold transition-colors ${mode === 'user' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400 hover:text-white'}`}>
              Assinante
          </button>
          <button onClick={() => setMode('admin')} className={`flex-1 py-2 text-center font-semibold transition-colors ${mode === 'admin' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400 hover:text-white'}`}>
              Administrador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 text-lg bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-transform transform hover:scale-105 disabled:bg-pink-800 disabled:cursor-not-allowed">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          {mode === 'user' && (
              <div className="text-center">
                  <a href="#" className="text-sm text-gray-400 hover:text-pink-500 transition">Esqueceu a senha?</a>
              </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;