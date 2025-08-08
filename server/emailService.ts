// server/emailService.ts — use SMTP to dodge IPv6 issues
import nodemailer from 'nodemailer';

const FROM = process.env.EMAIL_FROM!;
const KEY = process.env.SENDGRID_API_KEY!;

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,            // STARTTLS
  secure: false,        // TLS will be upgraded
  auth: {
    user: 'apikey',     // literally the string 'apikey'
    pass: KEY,          // your SendGrid API key
  },
  family: 4,            // <— force IPv4 at socket level
});

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    if (!KEY) throw new Error('SENDGRID_API_KEY missing');
    if (!FROM) throw new Error('EMAIL_FROM missing');

    const info = await transporter.sendMail({
      from: FROM, // must be a verified sender in SendGrid
      to: email,
      subject: 'Your Beer Hop verification code',
      text: `Your code is ${code}`,
      html: `<p>Your code is <strong>${code}</strong></p>`,
    });

    console.log('[emailService] smtp messageId', info.messageId);
    return true;
  } catch (err: any) {
    console.error('[emailService] smtp error', err?.response?.toString?.() || err?.message || String(err));
    return false;
  }
}
