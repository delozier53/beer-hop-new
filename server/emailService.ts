import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D97706; font-size: 28px; margin: 0;">Beer Hop</h1>
        <p style="color: #6B7280; font-size: 16px; margin: 10px 0 0 0;">Brewery Discovery & Check-ins</p>
      </div>
      
      <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin: 20px 0;">
        <h2 style="color: #111827; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Verification Code</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
          Please use the following 6-digit code to verify your account:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #FFFFFF; border: 2px solid #D97706; border-radius: 8px; display: inline-block; padding: 20px 30px;">
            <span style="font-size: 32px; font-weight: bold; color: #D97706; letter-spacing: 8px;">${code}</span>
          </div>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
          This code will expire in 10 minutes. Don't share this code with anyone.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  const text = `
    Beer Hop - Verification Code
    
    Please use the following 6-digit code to verify your account: ${code}
    
    This code will expire in 10 minutes. Don't share this code with anyone.
    
    If you didn't request this code, you can safely ignore this email.
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@beerhop.app', // You should verify this sender email in SendGrid
    subject: 'Beer Hop - Verification Code',
    text,
    html
  });
}