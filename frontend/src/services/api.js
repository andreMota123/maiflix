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

// Função auxiliar para upload de imagem
// Retorna o gcsPath (para salvar no banco)
export const uploadImage = async (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
        const response = await api.post('/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        // O backend agora retorna { ok: true, gcsPath: '...', url: '...' }
        // Retornamos gcsPath para persistência no banco de dados
        return response.data.gcsPath;
    } catch (error) {
        console.error("Erro no upload de imagem:", error);
        throw error;
    }
};

export default api;