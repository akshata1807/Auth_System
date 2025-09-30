const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Configure Twilio (only if valid credentials)
let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_SID.startsWith('AC')) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = new User({
      name,
      email,
      password,
      phone,
      otp,
      otpExpires,
    });

    await user.save();

    // Send email OTP
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com' &&
        process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password') {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify your email - OTP Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; text-align: center;">Email Verification</h2>
              <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
              <p style="color: #666; line-height: 1.6;">Thank you for signing up! Please use the OTP below to verify your email address:</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 24px; font-weight: bold; color: #007bff; background: #f8f9fa; padding: 15px 25px; border-radius: 5px; display: inline-block;">
                  ${otp}
                </span>
              </div>
              <p style="color: #999; font-size: 14px; line-height: 1.6;">This OTP will expire in 5 minutes.</p>
              <p style="color: #999; font-size: 14px; line-height: 1.6;">If you didn't request this verification, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message from Auth System.</p>
            </div>
          `,
        });
        res.status(201).json({
          message: 'User created. Please check your email for OTP verification.',
          otp: otp // Include OTP in response for development/testing
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        res.status(500).json({
          message: 'User created but failed to send verification email. Please try again.',
          otp: otp // Include OTP in response for development/testing
        });
      }
    } else {
      // Email not configured - return OTP for development
      console.log(`Email not configured. OTP for ${email}: ${otp}`);
      res.status(201).json({
        message: 'User created successfully. Email service not configured - OTP shown below for development.',
        otp: otp,
        note: 'Configure EMAIL_USER and EMAIL_PASS in .env file for production email sending'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const tokenPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      iat: Math.floor(Date.now() / 1000)
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send phone OTP
router.post('/send-phone-otp', auth, async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(500).json({ message: 'SMS service not configured' });
    }

    const { phone } = req.body;
    const otp = generateOTP();

    req.user.otp = otp;
    req.user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await req.user.save();

    await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    res.json({ message: 'OTP sent to phone' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify phone OTP
router.post('/verify-phone-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;

    if (req.user.otp !== otp || req.user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    req.user.otp = undefined;
    req.user.otpExpires = undefined;
    await req.user.save();

    res.json({ message: 'Phone verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    // Track login activity
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Set token expiration based on "Remember Me"
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const tokenPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: tokenExpiry }
    );

    // Calculate actual expiry date for frontend
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);

    res.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com' &&
        process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password') {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; text-align: center;">Password Reset</h2>
              <p style="color: #666; line-height: 1.6;">Hello,</p>
              <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Click the button below to reset it:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p style="color: #999; font-size: 14px; line-height: 1.6;">This link will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 14px; line-height: 1.6;">If you didn't request this password reset, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message from Auth System.</p>
            </div>
          `,
        });
        res.json({ message: 'Password reset link sent to your email' });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        res.status(500).json({ message: 'Failed to send password reset email. Please try again.' });
      }
    } else {
      // Email not configured - return reset token for development
      console.log(`Email not configured. Reset token for ${email}: ${resetToken}`);
      res.json({
        message: 'Password reset token generated. Email service not configured.',
        resetToken: resetToken,
        resetUrl: resetUrl,
        note: 'Configure EMAIL_USER and EMAIL_PASS in .env file for production email sending'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const resetToken = req.params.token;

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test OAuth configuration
router.get('/test-oauth', (req, res) => {
  const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here' &&
                          process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret_here'
  const facebookConfigured = process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_ID !== 'your_facebook_app_id' &&
                            process.env.FACEBOOK_APP_SECRET && process.env.FACEBOOK_APP_SECRET !== 'your_facebook_app_secret'

  res.json({
    googleConfigured,
    facebookConfigured,
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
    facebookAppId: process.env.FACEBOOK_APP_ID ? 'configured' : 'missing',
    message: 'OAuth configuration status checked'
  })
})

// Create test user for OAuth testing
router.post('/create-test-user', async (req, res) => {
  try {
    const testUser = new User({
      name: 'Test OAuth User',
      email: 'oauth-test@example.com',
      password: 'testpassword123',
      isVerified: true
    })

    await testUser.save()
    res.json({
      message: 'Test user created',
      user: {
        id: testUser._id,
        name: testUser.name,
        email: testUser.email
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Google OAuth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here' ||
      !process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here') {
    return res.status(500).json({
      message: 'Google OAuth not configured. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment variables.',
      setup_instructions: {
        step1: 'Go to https://console.cloud.google.com/',
        step2: 'Create a new project or select existing one',
        step3: 'Enable Google+ API',
        step4: 'Go to "Credentials" -> "Create Credentials" -> "OAuth 2.0 Client IDs"',
        step5: 'Set authorized redirect URIs to: http://localhost:5000/api/auth/google/callback',
        step6: 'Copy the Client ID and Client Secret to your .env file'
      }
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here' ||
      !process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here') {
    return res.status(500).json({
      message: 'Google OAuth not configured. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment variables.',
      setup_instructions: {
        step1: 'Go to https://console.cloud.google.com/',
        step2: 'Create a new project or select existing one',
        step3: 'Enable Google+ API',
        step4: 'Go to "Credentials" -> "Create Credentials" -> "OAuth 2.0 Client IDs"',
        step5: 'Set authorized redirect URIs to: http://localhost:5000/api/auth/google/callback',
        step6: 'Copy the Client ID and Client Secret to your .env file'
      }
    });
  }
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' })(req, res, next);
}, async (req, res) => {
  try {
    console.log('OAuth callback successful for user:', req.user.email);
    console.log('User object:', JSON.stringify(req.user, null, 2));

    // Ensure user has required fields
    let user = req.user;
    if (!user.name || !user.email) {
      // Reload user from database to get complete data
      user = await User.findById(req.user._id);
      console.log('Reloaded user object:', JSON.stringify(user, null, 2));
    }

    // Final fallback - ensure we have the required fields
    const finalName = user.name || user.displayName || 'OAuth User';
    const finalEmail = user.email;

    if (!finalEmail) {
      console.error('User email is still missing after reload:', user);
      return res.redirect('http://localhost:3000/login?error=email_missing');
    }

    const tokenPayload = {
      id: user._id.toString(),
      name: finalName,
      email: finalEmail,
      iat: Math.floor(Date.now() / 1000)
    };

    console.log('Token payload:', tokenPayload);
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    console.log('Generated token for OAuth user, redirecting to welcome page');
    res.redirect(`http://localhost:3000/welcome?token=${token}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('http://localhost:3000/login?error=oauth_failed');
  }
});

// Facebook OAuth
router.get('/facebook', (req, res, next) => {
  if (!process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID === 'your_facebook_app_id' ||
      !process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_APP_SECRET === 'your_facebook_app_secret') {
    return res.status(500).json({
      message: 'Facebook OAuth not configured. Please configure FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in the environment variables.',
      setup_instructions: {
        step1: 'Go to https://developers.facebook.com/',
        step2: 'Create a new app or select existing one',
        step3: 'Go to Settings → Basic and copy App ID and App Secret',
        step4: 'Add your App Secret to your .env file',
        step5: 'Set authorized redirect URIs to: http://localhost:5000/api/auth/facebook/callback',
        step6: 'Copy the App ID and App Secret to your .env file'
      }
    });
  }
  passport.authenticate('facebook', { scope: ['public_profile'] })(req, res, next);
});

router.get('/facebook/callback', (req, res, next) => {
  if (!process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID === 'your_facebook_app_id' ||
      !process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_APP_SECRET === 'your_facebook_app_secret') {
    return res.status(500).json({
      message: 'Facebook OAuth not configured. Please configure FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in the environment variables.',
      setup_instructions: {
        step1: 'Go to https://developers.facebook.com/',
        step2: 'Create a new app or select existing one',
        step3: 'Go to Settings → Basic and copy App ID and App Secret',
        step4: 'Add your App Secret to your .env file',
        step5: 'Set authorized redirect URIs to: http://localhost:5000/api/auth/facebook/callback',
        step6: 'Copy the App ID and App Secret to your .env file'
      }
    });
  }
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:3000/login' })(req, res, next);
}, async (req, res) => {
  try {
    console.log('Facebook OAuth callback successful for user:', req.user.email);
    console.log('Facebook User object:', JSON.stringify(req.user, null, 2));

    // Ensure user has required fields
    let user = req.user;
    if (!user.name || !user.email) {
      // Reload user from database to get complete data
      user = await User.findById(req.user._id);
      console.log('Reloaded Facebook user object:', JSON.stringify(user, null, 2));
    }

    // Final fallback - ensure we have the required fields
    const finalName = user.name || user.displayName || 'Facebook User';
    const finalEmail = user.email;

    if (!finalEmail) {
      console.error('Facebook user email is still missing after reload:', user);
      return res.redirect('http://localhost:3000/login?error=email_missing');
    }

    const tokenPayload = {
      id: user._id.toString(),
      name: finalName,
      email: finalEmail,
      iat: Math.floor(Date.now() / 1000)
    };

    console.log('Facebook Token payload:', tokenPayload);
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    console.log('Generated Facebook token, redirecting to welcome page');
    res.redirect(`http://localhost:3000/welcome?token=${token}`);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    res.redirect('http://localhost:3000/login?error=oauth_failed');
  }
});

// Logout
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;