const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    const mailOptions = {
      from: `"TeleBot Creator" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📬 Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Email Error:", error);
    throw error;
  }
}

module.exports = sendEmail;
