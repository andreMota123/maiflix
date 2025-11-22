const { Storage } = require('@google-cloud/storage');
const logger = require('../utils/logger');

let storage;
let bucket;

try {
  if (!process.env.GCS_CREDENTIALS) {
    throw new Error('Variável GCS_CREDENTIALS não encontrada.');
  }

  // O Render armazena o JSON como string, precisamos fazer o parse
  const credentials = JSON.parse(process.env.GCS_CREDENTIALS);
  const bucketName = process.env.GCS_BUCKET_NAME || 'maiflix-uploads';

  storage = new Storage({ credentials });
  bucket = storage.bucket(bucketName);

  logger.info(`Google Cloud Storage configurado para o bucket: ${bucketName}`);
} catch (error) {
  logger.error('Erro ao configurar Google Cloud Storage:', { message: error.message });
  // Não derruba a aplicação, mas as funções de mídia falharão se chamadas
}

module.exports = { storage, bucket };