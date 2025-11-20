
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Configurações adicionais para evitar problemas com alguns provedores SMTP rigorosos
  tls: {
    rejectUnauthorized: false
  },
  // Ativa logs detalhados para debug
  logger: true,
  debug: true
});

// Verifica a conexão SMTP ao iniciar a aplicação
transporter.verify(function (error, success) {
  if (error) {
    logger.error('Erro na conexão SMTP (E-mail):', { message: error.message });
  } else {
    logger.info('Servidor de E-mail (SMTP) pronto para envios.');
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
      // Não logamos a stack inteira para economizar espaço, a mensagem geralmente basta para SMTP
    });
  }
};

module.exports = {
  sendWelcomeEmail,
};