const winston = require('winston');

// Configuração dos níveis de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define o nível de log com base no ambiente
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Formato do log: JSON estruturado, incluindo stack traces para erros.
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// O transporte via Console é ideal para o cPanel/Passenger,
// pois ele captura stdout/stderr e os salva em arquivos de log.
const transports = [
  new winston.transports.Console(),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Captura exceções não tratadas para evitar que o app quebre silenciosamente
  exceptionHandlers: [
    new winston.transports.Console()
  ],
  // Evita que o logger saia após uma exceção não tratada
  exitOnError: false
});

module.exports = logger;
