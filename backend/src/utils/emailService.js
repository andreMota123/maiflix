const nodemailer = require('nodemailer');
const logger = require('./logger');

// --- CONFIGURAÇÃO BLINDADA PARA GMAIL NO RENDER ---
// 1. Host: smtp.gmail.com
// 2. Porta: 465 (SSL Implícito)
// 3. Secure: true
// 4. Family: 4 (Força IPv4)
// 5. TLS: rejectUnauthorized: false

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false 
  },
  family: 4, // Força IPv4
  connectionTimeout: 60000, 
  greetingTimeout: 30000,
  socketTimeout: 60000,
  logger: true,
  debug: true, 
});

transporter.verify(function (error, success) {
  if (error) {
    logger.error('❌ Erro de conexão SMTP (Gmail):', { 
        message: error.message, 
        code: error.code 
    });
  } else {
    logger.info(`✅ Servidor de E-mail (Gmail/SSL) conectado e pronto.`);
  }
});

const sendWelcomeEmail = async (to, name, password) => {
  const subject = 'Bem-vindo(a) à Maiflix! Seu acesso chegou 🚀';
  const appUrl = (process.env.CORS_ORIGIN || 'https://maiflix-9kgs.onrender.com').replace(/\/$/, '');
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f4f4f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #E94560; text-align: center; margin-bottom: 30px;">Bem-vindo(a) à Maiflix!</h1>
        <p style="font-size: 16px;">Olá, <strong>${name}</strong>!</p>
        <p style="font-size: 16px;">Sua conta foi criada com sucesso. Abaixo estão seus dados de acesso:</p>
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
        <p style="font-size: 14px; color: #666; text-align: center;">Recomendamos alterar sua senha após o primeiro acesso.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">Equipe Maiflix</p>
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
    logger.info(`Tentando enviar e-mail para ${to}...`);
    await transporter.sendMail(mailOptions);
    logger.info(`✅ E-mail enviado com sucesso para ${to}`);
  } catch (error) {
    logger.error(`❌ Falha ao enviar e-mail para ${to}`, {
      error: error.message,
      code: error.code,
      response: error.response
    });
  }
};

module.exports = {
  sendWelcomeEmail,
};