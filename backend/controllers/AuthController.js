const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const axios = require('axios');
const otpStore = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = '7d';

/**
 * @route POST /api/auth/register
 * @desc Register a new user (Patient, Doctor, Assistant)
 * @access Public
 */
const Register = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/auth/register', {
    body: { ...req.body, password: '***' }
  });

  const { fullName, phoneNumber, password, userType } = req.body;

  if (!fullName || !phoneNumber || !password || !userType) {
    console.log('[API ERROR]', 'POST', '/api/auth/register', 'Missing required fields');
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    const [existingUsers] = await pool.query(
      'SELECT user_id FROM Users WHERE phone_number = ?',
      [phoneNumber]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ msg: 'Phone number already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [newUser] = await pool.query(
      'INSERT INTO Users (full_name, phone_number, password_hash, user_type) VALUES (?, ?, ?, ?)',
      [fullName, phoneNumber, passwordHash, userType]
    );
    const userId = newUser.insertId;

    if (userType === 'Patient') {
      await pool.query('INSERT INTO Patients (patient_id) VALUES (?)', [userId]);
    } else if (userType === 'Doctor') {
      await pool.query('INSERT INTO Doctors (doctor_id) VALUES (?)', [userId]);
    } else if (userType === 'Assistant') {
      await pool.query('INSERT INTO Assistants (assistant_id) VALUES (?)', [userId]);
    }

    const token = jwt.sign({ id: userId, userType }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log('[API SUCCESS]', 'POST', '/api/auth/register', {
      userId,
      userType,
      status: 201
    });

    res.status(201).json({
      token,
      user: {
        id: userId,
        fullName,
        userType
      }
    });
  } catch (err) {
    console.log('[API ERROR]', 'POST', '/api/auth/register', {
      error: err.message,
      status: 500
    });
    res.status(500).json({ msg: 'Server error during registration' });
  }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
const Login = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/auth/login', {
    body: { ...req.body, password: '***' }
  });

  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    console.log('[API ERROR]', 'POST', '/api/auth/login', 'Missing required fields');
    return res.status(400).json({ msg: 'Please provide phone number and password' });
  }

  try {
    const [users] = await pool.query(
      'SELECT user_id, full_name, password_hash, user_type, is_active FROM Users WHERE phone_number = ?',
      [phoneNumber]
    );

    if (users.length === 0) {
      console.log('[API ERROR]', 'POST', '/api/auth/login', 'User not found');
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      console.log('[API ERROR]', 'POST', '/api/auth/login', 'Account is inactive', { userId: user.user_id });
      return res.status(403).json({ msg: 'Account is deactivated. Please contact support.' });
    }

    if (!user.password_hash) {
      console.log('[API ERROR]', 'POST', '/api/auth/login', 'Password hash is missing', { 
        userId: user.user_id,
        userType: user.user_type 
      });
      return res.status(401).json({ 
        msg: 'No password set for this account. Please use "Forgot Password" to set a new password.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.log('[API ERROR]', 'POST', '/api/auth/login', 'Invalid password');
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.user_id, userType: user.user_type }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('[API SUCCESS]', 'POST', '/api/auth/login', {
      userId: user.user_id,
      userType: user.user_type,
      status: 200
    });

    res.json({
      token,
      user: {
        id: user.user_id,
        fullName: user.full_name,
        userType: user.user_type
      }
    });
  } catch (err) {
    console.log('[API ERROR]', 'POST', '/api/auth/login', {
      error: err.message,
      status: 500
    });
    res.status(500).json({ msg: 'Server error during login' });
  }
};

/**
 * @route POST /api/auth/forgot-password
 * @desc Handle forgot password request
 * @access Public
 */
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const ForgetPassword = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/auth/forgot-password', {
    body: req.body
  });

  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    console.log('[API ERROR]', 'POST', '/api/auth/forgot-password', 'Phone number is required');
    return res.status(400).json({ msg: 'Phone number is required' });
  }

  try {
    const [users] = await pool.query(
      'SELECT user_id, password_hash FROM Users WHERE phone_number = ?',
      [phoneNumber]
    );

    if (users.length > 0) {
      const user = users[0];
      
      if (!user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash(phoneNumber.slice(-6), salt);
        await pool.query(
          'UPDATE Users SET password_hash = ? WHERE user_id = ?',
          [defaultPassword, user.user_id]
        );
        console.log('[API INFO]', 'Set default password for user', { userId: user.user_id });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await pool.query(
        'DELETE FROM password_resets WHERE phone_number = ?',
        [phoneNumber]
      );

      await pool.query(
        'INSERT INTO password_resets (phone_number, otp_code, expires_at) VALUES (?, ?, ?)',
        [phoneNumber, otp, expiresAt]
      );

      const formattedPhone = phoneNumber.startsWith('0')
        ? '+213' + phoneNumber.slice(1)
        : phoneNumber;

      const smsUrl = `${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`;
      console.log('[API CALL START]', `POST ${smsUrl}`, { body: { to: formattedPhone, otp } });
      
      try {
        await axios.post(
          smsUrl,
          {
            messages: [
              {
                from: "Shifa",
                destinations: [{ to: formattedPhone }],
                text: `Your reset code is: ${otp}`,
              },
            ],
          },
          {
            headers: {
              Authorization: `App ${process.env.INFOBIP_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('[API CALL SUCCESS]', smsUrl, { sentTo: formattedPhone, otp });
      } catch (smsError) {
        console.log('[API CALL ERROR]', 'SMS sending failed', { error: smsError.message });
      }
    }

    res.json({
      msg: 'If an account with that phone number exists, a password reset code has been sent.'
    });

  } catch (err) {
    console.error('[API ERROR]', err.response?.data || err.message);
    res.status(500).json({ msg: 'Server error during password reset' });
  }
};

/**
 * @route POST /api/auth/verify-reset-code
 * @desc Verify OTP code for password reset
 * @access Public
 */
const VerifyResetCode = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/auth/verify-reset-code', {
    body: { ...req.body, code: '***' }
  });

  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    console.log('[API ERROR]', 'POST', '/api/auth/verify-reset-code', 'Missing required fields');
    return res.status(400).json({ msg: 'Phone and code are required' });
  }

  try {
    const [results] = await pool.query(
      'SELECT * FROM password_resets WHERE phone_number = ? AND otp_code = ?',
      [phoneNumber, code]
    );

    if (results.length === 0) {
      console.log('[API ERROR]', 'POST', '/api/auth/verify-reset-code', 'Invalid code');
      return res.status(401).json({ msg: 'Invalid code' });
    }

    const otpRecord = results[0];
    const now = new Date();

    if (new Date(otpRecord.expires_at) < now) {
      console.log('[API ERROR]', 'POST', '/api/auth/verify-reset-code', 'Code expired');
      return res.status(410).json({ msg: 'Code expired' });
    }

    await pool.query(
      'DELETE FROM password_resets WHERE phone_number = ?',
      [phoneNumber]
    );

    console.log('[API SUCCESS]', 'POST', '/api/auth/verify-reset-code', {
      phoneNumber,
      status: 200
    });

    res.json({ msg: 'Code verified. You can now reset your password.' });

  } catch (err) {
    console.log('[API ERROR]', 'POST', '/api/auth/verify-reset-code', {
      error: err.message,
      status: 500
    });
    res.status(500).json({ msg: 'Error verifying code' });
  }
};

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password after OTP verification
 * @access Public
 */
const ResetPassword = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/auth/reset-password', {
    body: { phoneNumber: req.body.phoneNumber, newPassword: '***' }
  });

  const { phoneNumber, newPassword } = req.body;

  if (!phoneNumber || !newPassword) {
    console.log('[API ERROR]', 'POST', '/api/auth/reset-password', 'Missing required fields');
    return res.status(400).json({ msg: 'Phone number and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const [updateResult] = await pool.query(
      'UPDATE Users SET password_hash = ? WHERE phone_number = ?',
      [hashedPassword, phoneNumber]
    );

    if (updateResult.affectedRows === 0) {
      console.log('[API ERROR]', 'POST', '/api/auth/reset-password', 'User not found');
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log('[API SUCCESS]', 'POST', '/api/auth/reset-password', {
      phoneNumber,
      status: 200
    });

    res.json({ msg: 'Password has been reset successfully' });

  } catch (err) {
    console.log('[API ERROR]', 'POST', '/api/auth/reset-password', {
      error: err.message,
      status: 500
    });
    res.status(500).json({ msg: 'Server error during password reset' });
  }
};

/**
 * @route POST /api/auth/set-password
 * @desc Set password for existing user who doesn't have one (created via appointment)
 * @access Public
 */
const SetPassword = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/auth/set-password', {
    body: { phoneNumber: req.body.phoneNumber, password: '***' }
  });

  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({ msg: 'Phone number and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  }

  try {
    const [users] = await pool.query(
      'SELECT user_id, password_hash FROM Users WHERE phone_number = ?',
      [phoneNumber]
    );

    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const user = users[0];

    if (user.password_hash) {
      return res.status(400).json({ msg: 'Password already set. Please use login instead.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await pool.query(
      'UPDATE Users SET password_hash = ? WHERE user_id = ?',
      [passwordHash, user.user_id]
    );

    const token = jwt.sign(
      { id: user.user_id, userType: 'Patient' }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('[API SUCCESS]', 'POST', '/api/auth/set-password', {
      userId: user.user_id,
      status: 200
    });

    res.json({
      msg: 'Password set successfully',
      token,
      user: {
        id: user.user_id
      }
    });

  } catch (err) {
    console.error('[API ERROR]', 'POST', '/api/auth/set-password', {
      error: err.message
    });
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  Register,
  Login,
  ForgetPassword,
  VerifyResetCode,
  ResetPassword,
  SetPassword,
};