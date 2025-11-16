import axios from 'axios';

const api = axios.create({
  // Usar um caminho relativo para a baseURL da API.
  // Funciona porque em produção o frontend é servido do mesmo domínio que o backend.
  // Em desenvolvimento, o proxy do Vite cuidará do redirecionamento.
  baseURL: '/api',
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('maiflix_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
