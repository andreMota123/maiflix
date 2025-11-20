
const nodemailer = require('nodemailer');
const logger = require('./logger');

// Detecta se é Gmail para usar a configuração otimizada
const isGmail = process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail');

let transportConfig;

if (isGmail) {
  // ESTRATÉGIA BLINDADA PARA GMAIL NO RENDER
  // A porta 587 (STARTTLS) costuma dar timeout em containers devido à negociação de chaves.
  // Forçamos a porta 465 (SSL Implícito) que é direta e muito mais estável.
  transportConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // TRUE para porta 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Previne erros de certificado em proxies
      rejectUnauthorized: false
    }
  };
} else {
  // Estratégia Padrão para outros provedores (GoDaddy, Hostgator, etc)
  transportConfig = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  };
}

const transporter = nodemailer.createTransport({
  ...transportConfig,
  // CRÍTICO PARA RENDER: Força IPv4. 
  // O Node tenta IPv6 por padrão, o que causa 99% dos timeouts no Render.
  family: 4, 
  
  // Timeouts estendidos para garantir que a conexão não caia se a rede oscilar
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000,
  socketTimeout: 60000,
  
  // Logs detalhados para monitorarmos a transação SMTP
  logger: true,
  debug: true
});

// Verifica a conexão SMTP ao iniciar a aplicação
transporter.verify(function (error, success) {
  if (error) {
    logger.error('Erro na conexão SMTP (E-mail):', { 
        message: error.message, 
        code: error.code, 
        response: error.response 
    });
  } else {
    logger.info(`Servidor de E-mail conectado com sucesso via ${isGmail ? 'Gmail (SSL/465)' : 'SMTP Padrão'}.`);
  }
});

const sendWelcomeEmail = async (to, name, password) => {
  const subject = 'Bem-vindo(a) à Maiflix! Seu acesso chegou 🚀';
  // Garante que não haja barra duplicada no final da URL
  const appUrl = (process.env.CORS_ORIGIN || 'https://maiflix-9kgs.onrender.com').replace(/\/$/, '');
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f4f4f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #E94560; text-align: center; margin-bottom: 30px;">Bem-vindo(a) à Maiflix!</h1>
        
        <p style="font-size: 16px;">Olá, <strong>${name}</strong>!</p>
        
        <p style="font-size: 16px;">Sua assinatura foi confirmada com sucesso. Estamos muito felizes em ter você no nosso universo criativo!</p>
        
        <p style="font-size: 16px;">Aqui estão seus dados exclusivos de acesso:</p>
        
        <div style="background-color: #1a1a2e; color: #dcdcdc; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <p style="margin: 10px 0; font-size: 14px; color: #a7a9be;">Seu E-mail</p>
          <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: #ffffff;">${to}</p>
          
          <p style="margin: 10px 0; font-size: 14px; color: #a7a9be;">Sua Senha Provisória</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #E94560; letter-spacing: 1px;">${password}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
          <a href="${appUrl}" style="background-color: #E94560; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);">
            Acessar a Plataforma Agora
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          Recomendamos que você altere sua senha após o primeiro login para sua segurança.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Se você não realizou esta assinatura, por favor desconsidere este e-mail.<br>
          Equipe Maiflix
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`E-mail de boas-vindas enviado com sucesso para ${to}`);
  } catch (error) {
    logger.error(`Falha ao enviar e-mail de boas-vindas para ${to}`, {
      errorMessage: error.message,
      response: error.response
    });
  }
};

module.exports = {
  sendWelcomeEmail,
};
