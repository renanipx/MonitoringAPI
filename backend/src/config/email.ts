import nodemailer from "nodemailer";
import { env } from "./env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.emailUser,
    pass: env.emailPassword,
  },
});

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  if (!env.emailUser || !env.emailPassword) {
    throw new Error(
      "Email credentials not configured. Please check EMAIL_USER and EMAIL_PASSWORD environment variables."
    );
  }

  const baseUrl = (env.frontendOrigin || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${baseUrl}/?resetToken=${resetToken}`;

  const mailOptions = {
    from: `"Chronoly" <${env.emailUser}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"> 
        <h2 style="color: #764ba2;">Password Reset Request</h2> 
        <p>You requested a password reset for your account.</p> 
        <p>Click the button below to reset your password:</p> 
        <div style="text-align: center; margin: 30px 0;"> 
          <a href="${resetUrl}" 
             style="background-color: #764ba2; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;"> 
            Reset Password 
          </a> 
        </div> 
        <p style="color: #666; font-size: 14px;"> 
          If you didn't request this, please ignore this email or contact support if you have concerns. 
        </p> 
        <p style="color: #666; font-size: 14px;"> 
          This link will expire in 1 hour. 
        </p> 
      </div> 
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
