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
});

const sendWelcomeEmail = async (to, name, password) => {
  const subject = 'Bem-vindo(a) à Maiflix! Seus dados de acesso.';
  
  // Simples, mas eficaz template HTML.
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h1 style="color: #E94560; text-align: center;">Bem-vindo(a) à Maiflix!</h1>
        <p>Olá, ${name},</p>
        <p>Sua assinatura da Maiflix foi confirmada com sucesso. Estamos muito felizes em ter você conosco!</p>
        <p>Aqui estão seus dados para acessar a plataforma e mergulhar em um universo de criatividade:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Link de Acesso:</strong> <a href="https://maiflix.sublimepapelaria.com.br" style="color: #0F3460;">Clique aqui para acessar</a></p>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Senha Provisória:</strong> <strong style="font-size: 1.1em;">${password}</strong></p>
        </div>
        <p>Por segurança, recomendamos que você altere sua senha assim que fizer o primeiro login.</p>
        <p>Qualquer dúvida, basta entrar em contato com nosso suporte.</p>
        <p>Atenciosamente,<br>Equipe Maiflix</p>
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
      stack: error.stack,
    });
  }
};

module.exports = {
  sendWelcomeEmail,
};