import nodemailer from "nodemailer";
import "dotenv/config";

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function send_mail(mail: string, code: string) {
  console.log("try to send the mail")
  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; background-color: #f7f7f7; border-radius: 8px;">
    <h2 style="text-align: center; color: #4A90E2;">🔐 Verification Code</h2>

    <p style="font-size: 16px; color: #333;">
      Hello,
    </p>

    <p style="font-size: 16px; color: #333;">
      Here is your <strong>Transcendance</strong> verification code.  
      This code is valid for <strong>5 minutes</strong>.
    </p>

    <div style="text-align: center; margin-top: 20px; margin-bottom: 20px;">
      <span style="
        display: inline-block;
        background-color: #4A90E2;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 24px;
        letter-spacing: 4px;
        font-weight: bold;">
        ${code}
      </span>
    </div>

    <p style="font-size: 14px; color: #777;">
      If you did not request this code, please ignore this email.
    </p>

    <p style="font-size: 14px; color: #aaa; margin-top: 30px; text-align: center;">
      Transcendance — 42 Project
    </p>
  </div>
  `;

  try {
   
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: mail,
      subject: "Transcendance – Your verification code",
      html: htmlContent
    });

    console.log(`📧 HTML Email sent to ${mail}`);
  } catch (error) {
    console.error("Email sending error:", error);
  }
}

export function generateCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10); // chiffre entre 0 et 9
  }
  return code;
}

