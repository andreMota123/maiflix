import axios from 'axios';

// Define a URL base.
// 1. Tenta usar VITE_API_URL do arquivo .env (útil para desenvolvimento local ou separação de servidores).
// 2. Se não existir, usa '/api' (padrão para deploy unificado no Render, onde front e back estão na mesma origem).
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
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
// Retorna { gcsPath, url }
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
        // O backend retorna { ok: true, gcsPath: '...', url: '...' }
        return response.data;
    } catch (error) {
        console.error("Erro no upload de imagem:", error);
        throw error;
    }
};

// Busca a URL assinada (temporária) para um arquivo privado
export const getSignedUrl = async (gcsPath) => {
    if (!gcsPath) return null;
    if (gcsPath.startsWith('http')) return gcsPath; // Se já for link externo, retorna direto

    try {
        // Codifica todo o caminho para garantir que caracteres especiais e barras
        // sejam passados corretamente para a rota wildcard do backend.
        const encodedPath = encodeURIComponent(gcsPath);
        
        const response = await api.get(`/media/image/${encodedPath}`);
        return response.data.url;
    } catch (error) {
        console.error(`Erro ao obter URL assinada para ${gcsPath}`, error);
        return null; 
    }
};

export default api;