/**
 * Email Service
 * Copyright © 2025 DarkSide Developers
 */

const nodemailer = require('nodemailer');
const config = require('../config');

//
const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: false, // 465 නම් true, වෙන port නම් false
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
    }
});


// Send welcome email
const sendWelcomeEmail = async (email, firstName, verificationToken) => {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/verify-email/${verificationToken}`;
    
    const mailOptions = {
        from: config.EMAIL_FROM,
        to: email,
        subject: '🎉 Welcome to NovaX Mini - Verify Your Email',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to NovaX Mini</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #05070D 0%, #0A0F1C 100%); }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #00E5FF 0%, #7C3AED 100%); padding: 40px 20px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 2.5em; font-weight: 700; }
                .header p { margin: 10px 0 0 0; font-size: 1.1em; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .welcome-text { font-size: 1.2em; color: #333; line-height: 1.6; margin-bottom: 30px; }
                .features { background: #f8f9ff; border-radius: 15px; padding: 25px; margin: 30px 0; }
                .feature { display: flex; align-items: center; margin: 15px 0; }
                .feature-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #00E5FF, #7C3AED); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold; }
                .verify-btn { display: inline-block; background: linear-gradient(135deg, #00E5FF 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-weight: 600; font-size: 1.1em; margin: 20px 0; transition: transform 0.3s ease; }
                .verify-btn:hover { transform: translateY(-2px); }
                .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; border-top: 1px solid #eee; }
                .social-links { margin: 20px 0; }
                .social-links a { display: inline-block; margin: 0 10px; color: #7C3AED; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚡ NovaX Mini</h1>
                    <p>Advanced WhatsApp Bot Management System</p>
                </div>
                
                <div class="content">
                    <div class="welcome-text">
                        <h2>Welcome, ${firstName}! 🎉</h2>
                        <p>Thank you for joining NovaX Mini, the most advanced WhatsApp bot management platform. You're now part of an exclusive community of bot enthusiasts!</p>
                    </div>
                    
                    <div class="features">
                        <h3>🚀 What you can do with NovaX Mini:</h3>
                        <div class="feature">
                            <div class="feature-icon">🤖</div>
                            <div>
                                <strong>Multi-Bot Management</strong><br>
                                <small>Create and manage multiple WhatsApp bots from one dashboard</small>
                            </div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">⚡</div>
                            <div>
                                <strong>Real-time Control</strong><br>
                                <small>Monitor and control your bots in real-time with live updates</small>
                            </div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🎨</div>
                            <div>
                                <strong>Advanced Customization</strong><br>
                                <small>Customize bot behavior, commands, and responses</small>
                            </div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">📊</div>
                            <div>
                                <strong>Analytics & Insights</strong><br>
                                <small>Track performance and get detailed analytics</small>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <p><strong>Please verify your email address to get started:</strong></p>
                        <a href="${verificationUrl}" class="verify-btn">✅ Verify Email Address</a>
                        <p><small>This link will expire in 24 hours</small></p>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Need help?</strong> Contact our support team anytime.</p>
                    <div class="social-links">
                        <a href="${config.COPYRIGHT.GITHUB}">GitHub</a> |
                        <a href="mailto:support@novax-mini.com">Support</a>
                    </div>
                    <p><small>© ${config.COPYRIGHT.YEAR} ${config.COPYRIGHT.COMPANY} | Owner: ${config.COPYRIGHT.OWNER}</small></p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    // Check if email credentials are configured
    if (!config.EMAIL_USER || config.EMAIL_USER === 'your-email@gmail.com' || !config.EMAIL_PASS) {
        console.warn('⚠️ [Email] SMTP credentials not configured in .env. Skipping welcome email.');
        return;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Welcome email sent to ${email}`);
    } catch (error) {
        console.warn(`⚠️ [Email] Could not send welcome email to ${email}: ${error.message}`);
        // Do not throw so registration succeeds even if SMTP is misconfigured
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: config.EMAIL_FROM,
        to: email,
        subject: '🔐 NovaX Mini - Password Reset Request',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - NovaX Mini</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #05070D 0%, #0A0F1C 100%); }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #00E5FF 0%, #7C3AED 100%); padding: 40px 20px; text-align: center; color: white; }
                .content { padding: 40px 30px; text-align: center; }
                .reset-btn { display: inline-block; background: linear-gradient(135deg, #00E5FF 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-weight: 600; font-size: 1.1em; margin: 20px 0; }
                .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset</h1>
                </div>
                <div class="content">
                    <h2>Reset Your Password</h2>
                    <p>You requested a password reset for your NovaX Mini account.</p>
                    <a href="${resetUrl}" class="reset-btn">Reset Password</a>
                    <p><small>This link will expire in 1 hour. If you didn't request this, please ignore this email.</small></p>
                </div>
                <div class="footer">
                    <p>© ${config.COPYRIGHT.YEAR} ${config.COPYRIGHT.COMPANY}</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw error;
    }
};

module.exports = {
    sendWelcomeEmail,
    sendPasswordResetEmail
};
