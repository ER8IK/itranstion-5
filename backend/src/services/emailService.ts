import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * IMPORTANT: Email service for sending verification emails
 * Emails are sent asynchronously as per requirements
 */

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * NOTA BENE: Generate email verification token
 * Simple approach: encode user ID and email
 */
export function generateVerificationToken(userId: number, email: string): string {
  const data = JSON.stringify({ userId, email, timestamp: Date.now() });
  return Buffer.from(data).toString('base64');
}

/**
 * Parse verification token
 */
export function parseVerificationToken(token: string): { userId: number; email: string } | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString());
    return { userId: data.userId, email: data.email };
  } catch {
    return null;
  }
}

/**
 * IMPORTANT: Send verification email asynchronously
 * This is called after user registration completes
 * The email is sent in the background, not blocking the response
 */
export async function sendVerificationEmail(
  userEmail: string, 
  userName: string, 
  userId: number
): Promise<void> {
  try {
    const token = generateVerificationToken(userId, userEmail);
    const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@usermanagement.com',
      to: userEmail,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome, ${userName}!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    
    // Send email asynchronously
    await transporter.sendMail(mailOptions);
    console.log(`✓ Verification email sent to ${userEmail}`);
    
  } catch (error) {
    // NOTA BENE: Don't throw error - email failure shouldn't block registration
    console.error('Failed to send verification email:', error);
  }
}

/**
 * Test email configuration
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✓ Email service is ready');
    return true;
  } catch (error) {
    console.warn('⚠ Email service not configured properly:', error);
    return false;
  }
}
