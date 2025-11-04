import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendOtpEmail = async (to, otp) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>OTP xác thực tài khoản</h2>
      <p>Mã OTP của bạn: <strong style="font-size:20px">${otp}</strong></p>
      <p>Mã có hiệu lực trong 5 phút.</p>
    </div>
  `;
  await transporter.sendMail({ from, to, subject: 'Xác thực OTP - Hotel App', html });
};

export const sendWelcomeEmail = async (to, name) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Chào mừng ${name} đến với Hotel App</h2>
      <p>Tài khoản của bạn đã được tạo thành công.</p>
    </div>
  `;
  await transporter.sendMail({ from, to, subject: 'Chào mừng - Hotel App', html });
};

export const sendGuestEmail = async (to, name) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Xin chào ${name}</h2>
      <p>Chúng tôi đã lưu thông tin khách hàng của bạn. Bạn có thể tạo tài khoản bất cứ lúc nào.</p>
    </div>
  `;
  await transporter.sendMail({ from, to, subject: 'Thông tin khách hàng - Hotel App', html });
};