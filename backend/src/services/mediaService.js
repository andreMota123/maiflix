const sharp = require('sharp');
const ftp = require('basic-ftp');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const logger = require('../utils/logger');

// Configurações do Servidor de Arquivos (cPanel)
const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASS;
const FTP_SECURE = process.env.FTP_SECURE === 'true' || process.env.FTP_SECURE === true; // Use true para FTPS (recomendado)

// URL Base pública (Subdomínio configurado no cPanel)
const PUBLIC_URL_BASE = 'https://files.maiflix.sublimepapelaria.com.br';

// Pastas permitidas
const ALLOWED_FOLDERS = ['profiles', 'products', 'banners', 'community'];

/**
 * Processa e envia uma imagem para o servidor FTP
 * @param {Object} file - Objeto do arquivo (do multer, contém .buffer)
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

    if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
        logger.error('Credenciais de FTP não configuradas.');
        throw new Error('Erro de configuração do servidor de arquivos.');
    }

    const client = new ftp.Client();
    // client.ftp.verbose = true; // Habilite para debug se necessário

    try {
        // 1. Otimização da Imagem (Em Memória)
        // Converte para WebP, redimensiona se for muito grande (max 1920px largura), qualidade 80%
        const optimizedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // 2. Gerar nome único: {folder}-{timestamp}-{uuid}.webp
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
        const filename = `${folder}-${timestamp}-${uuidv4().slice(0, 8)}.webp`;
        const remotePath = `/${folder}/${filename}`; // Caminho absoluto no FTP (assumindo root do usuário FTP na pasta public_html ou subdomínio)

        // 3. Conexão FTP
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
            secure: FTP_SECURE,
        });

        // 4. Garantir que a pasta existe
        await client.ensureDir(`/${folder}`);

        // 5. Upload via Stream (Buffer -> FTP)
        const stream = Readable.from(optimizedBuffer);
        await client.uploadFrom(stream, remotePath);

        // 6. Retornar URL Pública
        const publicUrl = `${PUBLIC_URL_BASE}/${folder}/${filename}`;
        
        logger.info(`Imagem enviada via FTP com sucesso: ${publicUrl}`);
        return publicUrl;

    } catch (error) {
        logger.error('Erro ao processar/enviar imagem via FTP', { error: error.message });
        throw new Error('Falha ao salvar a imagem no servidor remoto.');
    } finally {
        if (!client.closed) {
            client.close();
        }
    }
};

/**
 * Remove uma imagem antiga do servidor FTP
 * @param {String} imageUrl - URL da imagem a ser removida
 */
const deleteImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes(PUBLIC_URL_BASE)) return;

    const client = new ftp.Client();

    try {
        // Extrai o caminho relativo (ex: /profiles/arquivo.webp)
        const relativePath = imageUrl.split(PUBLIC_URL_BASE)[1];
        if (!relativePath) return;

        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
            secure: FTP_SECURE,
        });

        await client.remove(relativePath);
        logger.info(`Imagem removida do FTP: ${relativePath}`);

    } catch (error) {
        logger.warn('Erro ao tentar excluir imagem antiga do FTP', { error: error.message, imageUrl });
        // Não lança erro para não interromper o fluxo principal
    } finally {
        if (!client.closed) {
            client.close();
        }
    }
};

module.exports = {
    processImage,
    deleteImage
};