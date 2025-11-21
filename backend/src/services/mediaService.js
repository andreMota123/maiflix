const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

// URL do Script de Upload no cPanel
const UPLOAD_API_URL = process.env.MEDIA_UPLOAD_URL || 'https://files.maiflix.sublimepapelaria.com.br/upload.php';

const ALLOWED_FOLDERS = ['profiles', 'products', 'banners', 'community'];

/**
 * Processa e envia uma imagem via HTTP POST para o script PHP remoto
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
        const optimizedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, withoutEnlargement: true }) // Limita largura HD
            .webp({ quality: 80 }) // Compressão WebP
            .toBuffer();

        // 2. Preparar Payload (FormData)
        const form = new FormData();
        form.append('folder', folder);
        
        // Anexa o buffer como um arquivo
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
            const errorMsg = response.data?.message || 'Erro desconhecido no servidor remoto';
            logger.error('O servidor de arquivos rejeitou o upload', { response: response.data });
            throw new Error(`Falha no upload remoto: ${errorMsg}`);
        }

    } catch (error) {
        if (error.response) {
            logger.error('Erro HTTP no upload', { status: error.response.status, data: error.response.data });
        } else if (error.request) {
            logger.error('Sem resposta do servidor de upload (Timeout ou Rede)', { error: error.message });
        } else {
            logger.error('Erro interno no processamento de imagem', { error: error.message });
        }
        throw new Error('Não foi possível salvar a imagem. Tente novamente mais tarde.');
    }
};

const deleteImage = async (imageUrl) => {
    logger.info(`Solicitação de deleção de imagem (placeholder): ${imageUrl}`);
    return true; 
};

module.exports = {
    processImage,
    deleteImage
};