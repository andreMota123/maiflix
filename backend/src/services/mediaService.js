const { bucket } = require('../config/gcs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Gera uma URL assinada (Signed URL) para acesso temporário a um arquivo privado.
 */
const getSignedUrl = async (gcsPath) => {
  if (!gcsPath || gcsPath.startsWith('http')) return gcsPath;

  try {
    if (!bucket) throw new Error('Bucket GCS não está inicializado.');

    const file = bucket.file(gcsPath);
    
    // Gera URL assinada V4 com validade de 1 hora
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hora
    });

    return url;
  } catch (error) {
    logger.error(`Erro ao gerar URL assinada para ${gcsPath}:`, error.message);
    // Em caso de erro (ex: arquivo não existe), retorna null para o frontend tratar
    return null;
  }
};

/**
 * Processa a imagem e faz upload para o GCS
 */
const processImage = async (file, folder = 'uploads') => {
  if (!bucket) throw new Error('Serviço de Storage indisponível.');
  if (!file) throw new Error('Nenhum arquivo enviado.');

  try {
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const timestamp = Date.now();
    const safeName = path.parse(file.originalname).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${folder}/${timestamp}-${safeName}-${uuidv4()}.webp`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(optimizedBuffer, {
      metadata: { contentType: 'image/webp' },
      resumable: false
    });

    logger.info(`Arquivo salvo no GCS: ${fileName}`);

    // Retorna URL assinada imediata para preview
    const signedUrl = await getSignedUrl(fileName);

    return {
      gcsPath: fileName, 
      url: signedUrl     
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
  } catch (error) {
    logger.warn(`Falha ao remover arquivo ${gcsPath}:`, error.message);
  }
};

module.exports = {
  processImage,
  getSignedUrl,
  deleteImage
};