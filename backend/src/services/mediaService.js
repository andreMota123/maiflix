const { bucket } = require('../config/gcs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Gera uma URL assinada (Signed URL) para acesso temporário a um arquivo privado.
 * Checklist: V4, 1 hora de validade, verifica existência.
 * 
 * @param {string} gcsPath - O caminho/nome do arquivo no bucket (ex: products/foto.png)
 * @returns {Promise<string|null>} - A URL pública temporária ou null se não existir/erro
 */
const getSignedUrl = async (gcsPath) => {
  // Se não houver path ou se já for uma URL externa (legado), retorna como está
  if (!gcsPath || gcsPath.startsWith('http')) return gcsPath;

  try {
    if (!bucket) throw new Error('Bucket GCS não está inicializado.');

    const file = bucket.file(gcsPath);
    
    // 1. Verifica se o arquivo realmente existe (Tratamento 404)
    const [exists] = await file.exists();
    if (!exists) {
      logger.warn(`Arquivo solicitado não encontrado no GCS: ${gcsPath}`);
      return null; 
    }

    // 2. Gera URL assinada V4 com validade de 1 hora (Checklist 4)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hora a partir de agora
    });

    return url;
  } catch (error) {
    logger.error(`Erro ao gerar URL assinada para ${gcsPath}:`, error.message);
    throw error; // Lança erro para o controller tratar como 500
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
    // Otimização na memória com Sharp (converte para WebP)
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Gerar nome único
    const timestamp = Date.now();
    const safeName = path.parse(file.originalname).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${folder}/${timestamp}-${safeName}-${uuidv4()}.webp`;
    const fileUpload = bucket.file(fileName);

    // Upload Stream para o GCS
    await fileUpload.save(optimizedBuffer, {
      metadata: {
        contentType: 'image/webp',
      },
      resumable: false
    });

    logger.info(`Arquivo salvo no GCS: ${fileName}`);

    // Gerar URL assinada imediata para preview no frontend
    const signedUrl = await getSignedUrl(fileName);

    return {
      gcsPath: fileName, // Salvar no MongoDB
      url: signedUrl     // Preview imediato
    };

  } catch (error) {
    logger.error('Erro no upload para GCS:', { error: error.message });
    throw new Error('Falha ao processar e salvar imagem.');
  }
};

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
