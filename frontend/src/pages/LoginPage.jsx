
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';

const LoginPage = () => {
  const [email, setEmail] = useState('levitamota@gmail.com');
  const [password, setPassword] = useState('Andre9157$');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('user');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // After successful login, the AuthContext will have the user's role.
      // We read the role from localStorage to decide the redirect destination.
      const userRole = localStorage.getItem('maiflix_user_role');
      const destination = from === "/" ? (userRole === 'admin' ? '/admin' : '/') : from;
      navigate(destination, { replace: true });

    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleMode = () => {
    setMode(prev => (prev === 'user' ? 'admin' : 'user'));
    setError(''); // Clear error on mode toggle
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-center text-pink-500 mb-2">Maiflix</h1>
        <p className="text-center text-gray-400 mb-8">
          {mode === 'user' ? 'Seu universo de criatividade.' : 'Acesso Administrativo'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email"
            id="email" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            autoComplete="email"
          />
          <Input 
            label="Senha"
            id="password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            autoComplete="current-password"
          />
          
          {error && <p className="text-red-400 text-sm text-center pt-2">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 mt-4 text-lg bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-transform transform hover:scale-105 disabled:bg-pink-800 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-center mt-6">
            <button
                onClick={toggleMode}
                className="bg-transparent border-none text-sm text-gray-400 hover:text-pink-500 transition-colors cursor-pointer"
            >
                {mode === 'user' ? 'Acessar como Administrador' : 'Acessar como Assinante'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
