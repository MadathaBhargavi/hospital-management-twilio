const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/database');

/**
 * Authenticate incoming request using JWT Bearer token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Fetch fresh user data from DB
    const user = db.prepare(`
      SELECT id, email, role, full_name, phone_number, is_phone_verified, avatar_url
      FROM users WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user no longer exists.'
      });
    }

    req.user = user;

    // Attach role-specific ID
    if (user.role === 'doctor') {
      const doctor = db.prepare('SELECT id, department_id, specialization FROM doctors WHERE user_id = ?').get(user.id);
      req.doctor = doctor;
    } else if (user.role === 'patient') {
      const patient = db.prepare('SELECT id, blood_group FROM patients WHERE user_id = ?').get(user.id);
      req.patient = patient;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.'
    });
  }
}

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You need one of the following roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize
};
