import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

/**
 * IMPORTANT: Email service via Resend (API-based, Render-safe)
 */

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate email verification token
 */
export function generateVerificationToken(userId: number, email: string): string {
  const data = JSON.stringify({ userId, email, timestamp: Date.now() });
  return Buffer.from(data).toString('base64');
}

/**
 * Parse verification token
 */
export function parseVerificationToken(
  token: string
): { userId: number; email: string } | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString());
    return { userId: data.userId, email: data.email };
  } catch {
    return null;
  }
}

/**
 * Send verification email asynchronously
 */
export async function sendVerificationEmail(
  userEmail: string,
  userName: string,
  userId: number
): Promise<void> {
  try {
    const token = generateVerificationToken(userId, userEmail);
    const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'no-reply@yourdomain.com',
      to: userEmail,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width:600px;margin:auto;padding:20px">
            <h2>Welcome, ${userName}!</h2>
            <p>Please verify your email address by clicking the button below:</p>

            <a href="${verificationUrl}"
               style="
                 display:inline-block;
                 padding:12px 24px;
                 background:#007bff;
                 color:white;
                 text-decoration:none;
                 border-radius:4px;
                 margin:20px 0;
               ">
              Verify Email Address
            </a>

            <p>Or copy this link:</p>
            <p style="word-break:break-all;color:#007bff;">
              ${verificationUrl}
            </p>

            <hr />
            <p style="font-size:12px;color:#666">
              If you didn’t create this account, ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✓ Verification email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}

/**
 * Test email configuration
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'no-reply@yourdomain.com',
      to: process.env.EMAIL_FROM || 'test@yourdomain.com',
      subject: 'Email service test',
      html: '<p>Email service is working</p>',
    });

    console.log('✓ Email service is ready');
    return true;
  } catch (error) {
    console.warn('⚠ Email service not configured properly:', error);
    return false;
  }
}
