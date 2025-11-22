const { Storage } = require('@google-cloud/storage');
const logger = require('../utils/logger');

let storage;
let bucket;

try {
  if (!process.env.GCS_CREDENTIALS) {
    throw new Error('Variável GCS_CREDENTIALS não encontrada no ambiente.');
  }

  if (!process.env.GCS_BUCKET_NAME) {
    throw new Error('Variável GCS_BUCKET_NAME não encontrada no ambiente.');
  }

  // O Render armazena o JSON como string nas variáveis de ambiente.
  // É crucial fazer o JSON.parse aqui.
  const credentials = JSON.parse(process.env.GCS_CREDENTIALS);
  const bucketName = process.env.GCS_BUCKET_NAME;

  storage = new Storage({ credentials });
  bucket = storage.bucket(bucketName);

  logger.info(`Google Cloud Storage configurado com sucesso. Bucket: ${bucketName}`);
} catch (error) {
  logger.error('Erro fatal ao configurar Google Cloud Storage:', { message: error.message });
  // Não derrubamos o processo aqui para permitir que o servidor inicie,
  // mas as funções de mídia falharão se chamadas.
}

module.exports = { storage, bucket };
