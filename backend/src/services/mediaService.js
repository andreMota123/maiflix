const sharp = require('sharp');
const Client = require('ssh2-sftp-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const path = require('path');

// Configurações do Servidor SFTP (cPanel)
const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASS;
const FTP_PORT = process.env.FTP_PORT || 22; // Padrão SFTP é 22, mas cPanel costuma usar 2222 ou 22228

// CAMINHO BASE NO SERVIDOR:
// IMPORTANTE: No SFTP, você entra na raiz do servidor (/home/usuario).
// Você precisa apontar para onde o subdomínio "files" está configurado.
// Geralmente é: /public_html/files OU apenas /files (depende do cPanel)
// Deixamos configurável via ENV, ou usamos um padrão comum 'public_html' se não definido.
const REMOTE_ROOT_PATH = process.env.FTP_ROOT_PATH || '/public_html/files'; 

// URL Base pública
const PUBLIC_URL_BASE = process.env.MEDIA_BASE_URL || 'https://files.maiflix.sublimepapelaria.com.br';

const ALLOWED_FOLDERS = ['profiles', 'products', 'banners', 'community'];

/**
 * Processa e envia uma imagem via SFTP
 */
const processImage = async (file, folder) => {
    if (!ALLOWED_FOLDERS.includes(folder)) {
        throw new Error('Pasta de destino inválida.');
    }

    if (!file.mimetype.startsWith('image/')) {
        throw new Error('Apenas arquivos de imagem são permitidos.');
    }

    if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
        logger.error('Credenciais de SFTP não configuradas.');
        throw new Error('Erro de configuração do servidor de arquivos.');
    }

    const sftp = new Client();

    try {
        // 1. Otimização (Sharp)
        const optimizedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // 2. Nomes e Caminhos
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
        const filename = `${folder}-${timestamp}-${uuidv4().slice(0, 8)}.webp`;
        
        // O caminho remoto completo: /home/user/public_html/files/products/imagem.webp
        // path.posix.join garante que use barras / (linux) mesmo se o dev estiver no windows
        const remoteDir = path.posix.join(REMOTE_ROOT_PATH, folder);
        const remoteFilePath = path.posix.join(remoteDir, filename);

        // 3. Conexão SFTP
        logger.info(`Conectando SFTP em ${FTP_HOST}:${FTP_PORT}...`);
        await sftp.connect({
            host: FTP_HOST,
            port: parseInt(FTP_PORT),
            username: FTP_USER,
            password: FTP_PASSWORD,
            // Aumentar timeout para evitar quedas em arquivos grandes
            readyTimeout: 20000, 
        });

        // 4. Garantir pasta existe (recursive true cria parents se faltar)
        const dirExists = await sftp.exists(remoteDir);
        if (!dirExists) {
            logger.info(`Criando diretório remoto: ${remoteDir}`);
            await sftp.mkdir(remoteDir, true);
        }

        // 5. Upload do Buffer
        await sftp.put(optimizedBuffer, remoteFilePath);

        // 6. Retornar URL
        // A URL pública não inclui o '/public_html', ela aponta direto para o subdomínio
        const publicUrl = `${PUBLIC_URL_BASE}/${folder}/${filename}`;
        
        logger.info(`Upload SFTP concluído: ${publicUrl}`);
        return publicUrl;

    } catch (error) {
        logger.error('Erro no upload SFTP', { error: error.message, stack: error.stack });
        throw new Error('Falha ao salvar imagem no servidor remoto.');
    } finally {
        // Sempre fechar conexão
        try {
            await sftp.end();
        } catch (err) {
            // Ignora erro de fechamento
        }
    }
};

/**
 * Remove imagem via SFTP
 */
const deleteImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes(PUBLIC_URL_BASE)) return;

    const sftp = new Client();

    try {
        // url: https://files.../products/img.webp
        // relative: /products/img.webp
        const urlPart = imageUrl.split(PUBLIC_URL_BASE)[1];
        if (!urlPart) return;

        const remoteFilePath = path.posix.join(REMOTE_ROOT_PATH, urlPart);

        await sftp.connect({
            host: FTP_HOST,
            port: parseInt(FTP_PORT),
            username: FTP_USER,
            password: FTP_PASSWORD
        });

        const exists = await sftp.exists(remoteFilePath);
        if (exists) {
            await sftp.delete(remoteFilePath);
            logger.info(`Imagem deletada via SFTP: ${remoteFilePath}`);
        }

    } catch (error) {
        logger.warn('Erro ao deletar imagem SFTP', { error: error.message });
    } finally {
        try { await sftp.end(); } catch (e) {}
    }
};

module.exports = {
    processImage,
    deleteImage
};