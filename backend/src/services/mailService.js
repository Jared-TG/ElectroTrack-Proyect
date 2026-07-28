const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendVerificationCode(to, code) {
    const mailOptions = {
      from: `"ElectroTrack" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Código de verificación de ElectroTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #FFD700;">¡Bienvenido a ElectroTrack!</h2>
          <p style="font-size: 16px; color: #333;">Gracias por registrarte. Para activar tu cuenta, ingresa el siguiente código de verificación:</p>
          <div style="margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; background-color: #f5f5f5; padding: 15px 30px; border-radius: 8px;">
              ${code}
            </span>
          </div>
          <p style="font-size: 14px; color: #666;">Este código expirará pronto. Si no solicitaste esta cuenta, ignora este correo.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[MailService] Correo enviado a ${to}`);
      return true;
    } catch (error) {
      console.error(`[MailService] Error al enviar correo a ${to}:`, error);
      return false;
    }
  }
}

module.exports = new MailService();
