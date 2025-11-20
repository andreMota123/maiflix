const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

// URL do Script de Upload no cPanel
// Padrão: https://files.maiflix.sublimepapelaria.com.br/upload.php
const UPLOAD_API_URL = process.env.MEDIA_UPLOAD_URL || 'https://files.maiflix.sublimepapelaria.com.br/upload.php';

const ALLOWED_FOLDERS = ['profiles', 'products', 'banners', 'community'];

/**
 * Processa e envia uma imagem via HTTP POST para o script PHP remoto
 * @param {Object} file - Objeto de arquivo do Multer
 * @param {String} folder - Pasta de destino (profiles, products, etc.)
 * @returns {Promise<String>} URL pública da imagem
 */
const processImage = async (file, folder) => {
    if (!ALLOWED_FOLDERS.includes(folder)) {
        throw new Error('Pasta de destino inválida.');
    }

    if (!file.mimetype.startsWith('image/')) {
        throw new Error('Apenas arquivos de imagem são permitidos.');
    }

    try {
        // 1. Otimização (Sharp) - Processamento em Memória
        // Reduz tamanho, converte para WebP e remove metadados
        const optimizedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, withoutEnlargement: true }) // Limita largura HD
            .webp({ quality: 80 }) // Compressão WebP
            .toBuffer();

        // 2. Preparar Payload (FormData)
        const form = new FormData();
        form.append('folder', folder);
        
        // Anexa o buffer como um arquivo. É CRUCIAL informar filename e contentType
        form.append('file', optimizedBuffer, {
            filename: `image-${Date.now()}.webp`,
            contentType: 'image/webp',
        });

        // 3. Enviar Requisição HTTP
        logger.info(`Enviando imagem para: ${UPLOAD_API_URL} (Pasta: ${folder})`);

        const response = await axios.post(UPLOAD_API_URL, form, {
            headers: {
                ...form.getHeaders(), // Headers essenciais do multipart/form-data
                'User-Agent': 'Maiflix-Backend/1.0'
            },
            timeout: 30000 // 30 segundos de timeout
        });

        // 4. Processar Resposta
        if (response.data && response.data.success) {
            logger.info(`Upload HTTP concluído com sucesso: ${response.data.url}`);
            return response.data.url;
        } else {
            // Se o PHP retornou success: false ou erro
            const errorMsg = response.data?.message || 'Erro desconhecido no servidor remoto';
            logger.error('O servidor de arquivos rejeitou o upload', { response: response.data });
            throw new Error(`Falha no upload remoto: ${errorMsg}`);
        }

    } catch (error) {
        // Tratamento detalhado de erro Axios
        if (error.response) {
            logger.error('Erro HTTP no upload', { 
                status: error.response.status, 
                data: error.response.data 
            });
        } else if (error.request) {
            logger.error('Sem resposta do servidor de upload (Timeout ou Rede)', { error: error.message });
        } else {
            logger.error('Erro interno no processamento de imagem', { error: error.message });
        }
        
        throw new Error('Não foi possível salvar a imagem. Tente novamente mais tarde.');
    }
};

/**
 * Deleta imagem (Placeholder)
 * Nota: A deleção remota via HTTP requer um endpoint delete.php protegido.
 * Por enquanto, apenas logamos, pois o foco é corrigir o upload.
 */
const deleteImage = async (imageUrl) => {
    // Implementação futura: chamar endpoint de delete no PHP
    logger.info(`Solicitação de deleção de imagem (ainda não implementado no PHP): ${imageUrl}`);
    return true; 
};

module.exports = {
    processImage,
    deleteImage
};