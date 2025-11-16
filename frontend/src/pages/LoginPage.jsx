
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';

// Credentials for easy testing of both roles
const ADMIN_CREDENTIALS = {
  email: 'levitamota@gmail.com',
  password: 'Andre9157$',
};
const USER_CREDENTIALS = {
  email: 'assinante@example.com',
  password: 'senha123',
};


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('user');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // Effect to automatically fill credentials when mode changes
  useEffect(() => {
    if (mode === 'user') {
      setEmail(USER_CREDENTIALS.email);
      setPassword(USER_CREDENTIALS.password);
    } else {
      setEmail(ADMIN_CREDENTIALS.email);
      setPassword(ADMIN_CREDENTIALS.password);
    }
    setError(''); // Clear any previous errors
  }, [mode]);


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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-center text-pink-500 mb-2">Maiflix</h1>
        <p className="text-center text-gray-400 mb-8">
          {mode === 'user' ? 'Seu universo de criatividade.' : 'Acesso Administrativo'}
        </p>

        <div className="text-center bg-gray-700/50 p-3 rounded-lg mb-6 text-sm text-gray-300">
            <p>
                <strong>Para testar:</strong><br />
                Alterne entre os modos de login. O usuário de assinante <strong>({USER_CREDENTIALS.email})</strong> precisa ser criado no painel de admin primeiro com a senha <strong>{USER_CREDENTIALS.password}</strong>.
            </p>
        </div>
        
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
