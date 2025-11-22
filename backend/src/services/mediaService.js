const { bucket } = require('../config/gcs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Gera uma URL assinada (Signed URL) para acesso temporário a um arquivo privado
 * @param {string} gcsPath - O caminho/nome do arquivo no bucket
 * @returns {Promise<string|null>} - A URL pública temporária ou null se não existir
 */
const getSignedUrl = async (gcsPath) => {
  if (!gcsPath || gcsPath.startsWith('http')) return gcsPath; // Se já for URL (legado), retorna ela

  try {
    if (!bucket) throw new Error('Bucket GCS não configurado.');

    const file = bucket.file(gcsPath);
    
    // Verifica se o arquivo realmente existe antes de assinar a URL
    // Isso evita gerar links quebrados que retornam XML de erro do Google
    const [exists] = await file.exists();

    if (!exists) {
      logger.warn(`Arquivo não encontrado no bucket: ${gcsPath}`);
      return null; 
    }

    // Gera URL assinada V4
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hora de validade
    });

    return url;
  } catch (error) {
    logger.error(`Erro ao gerar URL assinada para ${gcsPath}:`, error.message);
    return null;
  }
};

/**
 * Processa a imagem (Sharp) e faz upload para o Google Cloud Storage
 * @param {Object} file - Objeto file do Multer
 * @param {string} folder - Pasta lógica
 * @returns {Promise<{gcsPath: string, url: string}>}
 */
const processImage = async (file, folder = 'uploads') => {
  if (!bucket) throw new Error('Serviço de Storage indisponível.');
  
  if (!file) throw new Error('Nenhum arquivo enviado.');

  try {
    // 1. Otimização na memória com Sharp (converte para WebP)
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 2. Gerar nome único
    const timestamp = Date.now();
    const safeName = path.parse(file.originalname).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${folder}/${timestamp}-${safeName}-${uuidv4()}.webp`;
    const fileUpload = bucket.file(fileName);

    // 3. Upload Stream para o GCS
    await fileUpload.save(optimizedBuffer, {
      metadata: {
        contentType: 'image/webp',
      },
      resumable: false
    });

    logger.info(`Arquivo salvo no GCS: ${fileName}`);

    // 4. Gerar URL assinada imediata para o frontend visualizar agora
    const signedUrl = await getSignedUrl(fileName);

    return {
      gcsPath: fileName, // O que será salvo no MongoDB (ex: products/123-foto.webp)
      url: signedUrl     // Para preview imediato no frontend
    };

  } catch (error) {
    logger.error('Erro no upload para GCS:', { error: error.message });
    throw new Error('Falha ao processar e salvar imagem.');
  }
};

/**
 * Remove um arquivo do bucket
 */
const deleteImage = async (gcsPath) => {
  if (!gcsPath || !bucket) return;
  try {
    await bucket.file(gcsPath).delete();
    logger.info(`Arquivo removido do GCS: ${gcsPath}`);
  } catch (error) {
    logger.warn(`Falha ao remover arquivo ${gcsPath}:`, error.message);
  }
};

module.exports = {
  processImage,
  getSignedUrl,
  deleteImage
};