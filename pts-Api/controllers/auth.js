const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Department } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '15m'; // 15 minutes for reset tokens

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Department, as: 'department' }]
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        department: user.department ? user.department.name : null
      },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Forgot Password - Send reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // In a real application, you would send this token via email
    // For now, we'll return it in the response for testing
    console.log('Reset token generated:', resetToken);

    res.json({ 
      success: true, 
      message: 'Password reset link sent to your email',
      resetToken: resetToken // Remove this in production
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process forgot password request', error: err.message });
  }
};

// Reset Password - Verify token and update password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword, resetToken } = req.body;

    if (!email || !newPassword || !confirmPassword || !resetToken) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token is for password reset
    if (decoded.type !== 'password_reset') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Check if email matches token
    if (decoded.email !== email) {
      return res.status(401).json({ message: 'Email does not match reset token' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await user.update({ password: hashedPassword });

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};

// Verify Reset Token - Check if token is valid
const verifyResetToken = async (req, res) => {
  try {
    const { resetToken } = req.body;

    if (!resetToken) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token is for password reset
    if (decoded.type !== 'password_reset') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Check if user still exists
    const user = await User.findOne({ where: { email: decoded.email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'Reset token is valid',
      email: decoded.email
    });

  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ message: 'Failed to verify reset token', error: err.message });
  }
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  verifyResetToken
};
