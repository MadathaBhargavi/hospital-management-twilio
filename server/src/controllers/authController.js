const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const config = require('../config/env');
const twilioService = require('../services/twilioService');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { full_name, email, password, phone_number, role = 'patient', date_of_birth, gender, blood_group, address } = req.body;

    if (!full_name || !email || !password || !phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, password, and phone number.'
      });
    }

    // Check existing email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const userId = `user-${uuidv4().substring(0, 8)}`;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userRole = ['patient', 'doctor', 'admin'].includes(role) ? role : 'patient';

    let formattedPhone = phone_number.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    // Insert user
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone_number, is_phone_verified)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(userId, email.toLowerCase().trim(), passwordHash, userRole, full_name.trim(), formattedPhone);

    // If patient, create patient profile
    if (userRole === 'patient') {
      const patientId = `patient-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(patientId, userId, date_of_birth || null, gender || null, blood_group || null, address || null);
    }

    // Send welcome SMS if configured
    try {
      const welcomeMsg = `Welcome to MediCare Hospital, ${full_name}! Your patient account has been created. Book appointments and manage healthcare conveniently.`;
      await twilioService.sendSMS({
        to: formattedPhone,
        message: welcomeMsg,
        triggerEvent: 'system',
        userId,
        recipientName: full_name
      });
    } catch (smsErr) {
      console.warn('Welcome SMS could not be sent (non-fatal):', smsErr.message);
    }

    const user = db.prepare('SELECT id, email, role, full_name, phone_number, is_phone_verified FROM users WHERE id = ?').get(userId);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Role specific details
    let roleDetails = null;
    if (user.role === 'doctor') {
      roleDetails = db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(user.id);
    } else if (user.role === 'patient') {
      roleDetails = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone_number: user.phone_number,
      is_phone_verified: user.is_phone_verified,
      avatar_url: user.avatar_url,
      roleDetails
    };

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    let roleDetails = null;
    if (req.user.role === 'doctor') {
      roleDetails = db.prepare(`
        SELECT d.*, dept.name AS department_name, dept.icon AS department_icon
        FROM doctors d
        LEFT JOIN departments dept ON d.department_id = dept.id
        WHERE d.user_id = ?
      `).get(req.user.id);
    } else if (req.user.role === 'patient') {
      roleDetails = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(req.user.id);
    }

    res.json({
      success: true,
      user: {
        ...req.user,
        roleDetails
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/send-otp
async function sendOTP(req, res, next) {
  try {
    const phoneNumber = req.body.phone_number || (req.user && req.user.phone_number);
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required to send verification OTP.'
      });
    }

    const result = await twilioService.sendOTP({ phoneNumber });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-otp
async function verifyOTP(req, res, next) {
  try {
    const { code } = req.body;
    const phoneNumber = req.body.phone_number || (req.user && req.user.phone_number);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required.'
      });
    }

    const result = await twilioService.verifyOTP({ phoneNumber, code });
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  sendOTP,
  verifyOTP
};
