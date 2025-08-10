// server/emailService.ts — use SMTP to dodge IPv6 issues
import nodemailer from 'nodemailer';

const FROM = process.env.EMAIL_FROM || 'beerhopapp@gmail.com';
const KEY = process.env.SENDGRID_API_KEY!;

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,            // STARTTLS
  secure: false,        // TLS will be upgraded
  auth: {
    user: 'apikey',     // literally the string 'apikey'
    pass: KEY,          // your SendGrid API key
  },
  family: 4,            // <— force IPv4 at socket level
  debug: true,          // Enable debug logging
  logger: true,         // Enable logger
});

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    if (!KEY) {
      console.warn('SENDGRID_API_KEY missing - using console output for development');
      console.log(`\n🔐 VERIFICATION CODE FOR ${email}: ${code}\n`);
      return true;
    }

    console.log(`[emailService] Attempting to send email to ${email} with code ${code}`);
    console.log(`[emailService] Using SendGrid API key: ${KEY.substring(0, 10)}...`);
    
    const info = await transporter.sendMail({
      from: FROM, // must be a verified sender in SendGrid
      to: email,
      subject: 'Your Beer Hop verification code',
      text: `Your code is ${code}`,
      html: `<p>Your code is <strong>${code}</strong></p>`,
    });

    console.log('[emailService] smtp messageId', info.messageId);
    console.log('[emailService] Email sent successfully');
    return true;
  } catch (err: any) {
    console.error('[emailService] smtp error details:', {
      message: err?.message,
      code: err?.code,
      response: err?.response,
      responseCode: err?.responseCode,
      command: err?.command
    });
    // Fallback to console output for development
    console.log(`\n🔐 VERIFICATION CODE FOR ${email}: ${code}\n`);
    return true;
  }
}
