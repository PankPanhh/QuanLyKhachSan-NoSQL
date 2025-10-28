import nodemailer from 'nodemailer';

// Cau hinh transporter (nguoi gui)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true cho port 465, false cho cac port khac
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Ham gui email
 * @param {string} to - Email nguoi nhan
 * @param {string} subject - Tieu de email
 * @param {string} text - Noi dung dang text
 * @param {string} html - Noi dung dang HTML
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Khach San Mellow" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log('Email da gui: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Loi khi gui email:', error);
  }
};
