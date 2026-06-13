const nodemailer = require('nodemailer');

/**
 * Create email transporter using Gmail SMTP
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>}
 */
exports.sendOTPEmail = async (email, otp, firstName) => {
  try {
    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || 
        process.env.SMTP_USER.includes('your_email') || 
        process.env.SMTP_PASS.includes('your_email_password')) {
      console.warn('⚠️  SMTP not configured. OTP for testing:', otp);
      return true; // Don't fail the request
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"CareLink" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'CareLink - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">CareLink</h1>
            <p style="margin: 5px 0;">Healthcare Made Easy</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 5px 5px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            
            <p>Hi ${firstName},</p>
            
            <p>We received a request to reset your CareLink password. Use the OTP below to proceed:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4CAF50; color: white; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; display: inline-block; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>⏱️  This OTP will expire in 10 minutes.</strong>
            </p>
            
            <p style="color: #666;">If you didn't request a password reset, please ignore this email. Your account is secure.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              © 2024 CareLink. All rights reserved.<br>
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    // In development, don't fail the request if email sending fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Continuing without email. OTP for testing:', otp);
      return true;
    }
    return false;
  }
};

/**
 * Send welcome email after registration
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>}
 */
exports.sendWelcomeEmail = async (email, firstName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || 
        process.env.SMTP_USER.includes('your_email')) {
      return true;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"CareLink" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to CareLink!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Welcome to CareLink!</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 5px 5px;">
            <p>Hi ${firstName},</p>
            <p>Your account has been successfully created. You can now book appointments with healthcare professionals.</p>
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    return false;
  }
};
