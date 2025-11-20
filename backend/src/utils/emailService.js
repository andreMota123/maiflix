const nodemailer = require('nodemailer');
const logger = require('./logger');

// Configuração BLINDADA para Gmail no Render
// Usamos Porta 465 (SSL Implícito) + IPv4 forçado.
// Isso resolve 99% dos problemas de "Connection Timeout" e bloqueios de rede.
const transportConfig = {
  host: 'smtp.gmail.com',
  port: 465, 
  secure: true, // TRUE para porta 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Ajuda a evitar erros de certificado em containers
    rejectUnauthorized: false 
  },
  // CRÍTICO: Força o Node.js a usar IPv4. 
  // O Render muitas vezes falha ao tentar resolver o Gmail via IPv6.
  family: 4, 
};

const transporter = nodemailer.createTransport({
  ...transportConfig,
  logger: true, // Logs detalhados para debug
  debug: true,  // Debug SMTP
  // Timeouts estendidos para garantir a conexão
  connectionTimeout: 30000, 
  greetingTimeout: 30000,
  socketTimeout: 30000 
});

// Verifica conexão na inicialização do servidor
transporter.verify(function (error, success) {
  if (error) {
    logger.error('❌ Erro na conexão com Gmail (SMTP):', { 
        message: error.message, 
        code: error.code 
    });
  } else {
    logger.info(`✅ Servidor de E-mail (Gmail) pronto para envios na porta 465.`);
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
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          Recomendamos alterar sua senha após o primeiro acesso.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
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
    logger.info(`Tentando enviar e-mail para ${to}...`);
    await transporter.sendMail(mailOptions);
    logger.info(`✅ E-mail enviado com sucesso para ${to}`);
  } catch (error) {
    logger.error(`❌ Falha ao enviar e-mail para ${to}`, {
      error: error.message,
      code: error.code
    });
  }
};

module.exports = {
  sendWelcomeEmail,
};