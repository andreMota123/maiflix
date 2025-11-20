const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Configuração do domínio de arquivos
// Se MEDIA_HOST não estiver definido, usa o próprio domínio da API (relativo ou configurado)
const MEDIA_HOST = process.env.MEDIA_HOST || process.env.CORS_ORIGIN || 'https://maiflix-9kgs.onrender.com';
const UPLOAD_DIR = path.join(__dirname, '../../public');

// Pastas permitidas
const ALLOWED_FOLDERS = ['profiles', 'products', 'banners', 'community'];

/**
 * Garante que a pasta existe
 */
const ensureFolder = async (folder) => {
    const folderPath = path.join(UPLOAD_DIR, folder);
    await fs.ensureDir(folderPath);
    return folderPath;
};

/**
 * Processa e salva uma imagem
 * @param {Object} file - Objeto do arquivo (do multer)
 * @param {String} folder - Pasta de destino (profiles, products, etc.)
 * @returns {Promise<String>} - URL pública da imagem
 */
const processImage = async (file, folder) => {
    if (!ALLOWED_FOLDERS.includes(folder)) {
        throw new Error('Pasta de destino inválida.');
    }

    // Validação básica de tipo
    if (!file.mimetype.startsWith('image/')) {
        throw new Error('Apenas arquivos de imagem são permitidos.');
    }

    try {
        await ensureFolder(folder);

        // Gerar nome único: {folder}-{timestamp}-{uuid}.webp
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
        const filename = `${folder}-${timestamp}-${uuidv4().slice(0, 8)}.webp`;
        const filepath = path.join(UPLOAD_DIR, folder, filename);

        // Processamento com Sharp (Otimização)
        // Converte para WebP, redimensiona se for muito grande (max 1920px largura), qualidade 80%
        await sharp(file.buffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filepath);

        // Construir URL pública
        // Se for local/render, servimos via estático do express
        const publicUrl = `${MEDIA_HOST}/${folder}/${filename}`;
        
        logger.info(`Imagem salva com sucesso: ${publicUrl}`);
        return publicUrl;

    } catch (error) {
        logger.error('Erro ao processar imagem no MediaService', { error: error.message });
        throw new Error('Falha ao processar a imagem.');
    }
};

/**
 * Remove uma imagem antiga (se existir e for local)
 * @param {String} imageUrl - URL da imagem a ser removida
 */
const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;

    try {
        // Verifica se a imagem pertence ao nosso domínio
        if (imageUrl.includes(MEDIA_HOST)) {
            // Extrai o caminho relativo (ex: /profiles/arquivo.webp)
            const relativePath = imageUrl.split(MEDIA_HOST)[1];
            if (relativePath) {
                const filePath = path.join(UPLOAD_DIR, relativePath);
                if (await fs.pathExists(filePath)) {
                    await fs.remove(filePath);
                    logger.info(`Imagem antiga removida: ${filePath}`);
                }
            }
        }
    } catch (error) {
        logger.warn('Erro ao tentar excluir imagem antiga', { error: error.message });
        // Não lança erro para não interromper o fluxo principal
    }
};

module.exports = {
    processImage,
    deleteImage
};