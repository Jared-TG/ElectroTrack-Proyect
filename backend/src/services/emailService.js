const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración del transporter usando SMTP de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para enviar el código OTP
const sendPasswordResetEmail = async (toEmail, otpCode) => {
    try {
        const mailOptions = {
            from: `"ElectroTrack Security" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Código de Recuperación de Contraseña - ElectroTrack',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff; border-radius: 10px;">
                <h2 style="color: #FFD700; text-align: center;">ElectroTrack</h2>
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer tu contraseña. Ingresa el siguiente código de 6 dígitos en tu aplicación:</p>
                <div style="background-color: #1a1a1a; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #FFD700;">${otpCode}</span>
                </div>
                <p style="color: #888; font-size: 12px; text-align: center;">Este código expira en 15 minutos.</p>
                <p style="color: #888; font-size: 12px; text-align: center;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent to ${toEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EmailService] Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail
};
