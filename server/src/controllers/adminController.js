const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const twilioService = require('../services/twilioService');

// GET /api/admin/analytics
async function getAdminAnalytics(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Counts
    const patientCount = db.prepare('SELECT COUNT(*) AS count FROM patients').get().count;
    const doctorCount = db.prepare('SELECT COUNT(*) AS count FROM doctors WHERE is_active = 1').get().count;
    const departmentCount = db.prepare('SELECT COUNT(*) AS count FROM departments').get().count;
    
    // Appointment Stats
    const appointmentStats = db.prepare(`
      SELECT
        COUNT(*) AS total_appointments,
        COUNT(CASE WHEN appointment_date = ? THEN 1 END) AS today_appointments,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
      FROM appointments
    `).get(today);

    // Notification Stats
    const notificationStats = db.prepare(`
      SELECT
        COUNT(*) AS total_notifications,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) AS sent_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count,
        COUNT(CASE WHEN status = 'not_configured' THEN 1 END) AS dev_count,
        COUNT(CASE WHEN trigger_event = 'reminder' THEN 1 END) AS reminder_count,
        COUNT(CASE WHEN trigger_event = 'booking' THEN 1 END) AS booking_count
      FROM notifications
    `).get();

    // Department Distribution
    const departmentDistribution = db.prepare(`
      SELECT 
        dept.name,
        dept.code,
        COUNT(a.id) AS appointment_count
      FROM departments dept
      LEFT JOIN appointments a ON dept.id = a.department_id
      GROUP BY dept.id
      ORDER BY appointment_count DESC
    `).all();

    // Recent 10 Communication Logs
    const recentCommunications = db.prepare(`
      SELECT * FROM notifications
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    // Twilio Live Status
    const twilioStatus = twilioService.getStatus();

    res.json({
      success: true,
      stats: {
        totalPatients: patientCount,
        totalDoctors: doctorCount,
        totalDepartments: departmentCount,
        ...appointmentStats,
        notifications: notificationStats
      },
      departmentDistribution,
      recentCommunications,
      twilioStatus
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/doctors
async function getAdminDoctors(req, res, next) {
  try {
    const doctors = db.prepare(`
      SELECT 
        d.*,
        u.full_name,
        u.email,
        u.phone_number,
        u.is_phone_verified,
        dept.name AS department_name,
        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id) AS appointment_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON d.department_id = dept.id
      ORDER BY u.full_name ASC
    `).all();

    res.json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/doctors (Create new doctor)
async function createDoctor(req, res, next) {
  try {
    const { full_name, email, password, phone_number, department_id, specialization, qualification, experience_years, consultation_fee, room_number, available_days, available_time_slots } = req.body;

    if (!full_name || !email || !password || !phone_number || !department_id || !specialization) {
      return res.status(400).json({ success: false, message: 'All required doctor fields must be provided.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address is already in use.' });
    }

    const userId = `user-${uuidv4().substring(0, 8)}`;
    const doctorId = `doc-${uuidv4().substring(0, 8)}`;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    let formattedPhone = phone_number.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    const defaultDays = available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const defaultSlots = available_time_slots || ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone_number, is_phone_verified)
      VALUES (?, ?, ?, 'doctor', ?, ?, 1)
    `).run(userId, email.toLowerCase().trim(), passwordHash, full_name.trim(), formattedPhone);

    db.prepare(`
      INSERT INTO doctors (
        id, user_id, department_id, specialization, qualification,
        experience_years, bio, consultation_fee, room_number,
        available_days, available_time_slots, rating, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 1)
    `).run(
      doctorId,
      userId,
      department_id,
      specialization,
      qualification || 'MBBS, MD',
      experience_years || 5,
      `Dr. ${full_name} is a specialist in ${specialization}.`,
      consultation_fee || 100.0,
      room_number || 'Room 101',
      JSON.stringify(defaultDays),
      JSON.stringify(defaultSlots)
    );

    res.status(201).json({
      success: true,
      message: 'Doctor account created successfully!',
      doctorId
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/patients
async function getAdminPatients(req, res, next) {
  try {
    const patients = db.prepare(`
      SELECT 
        p.*,
        u.full_name,
        u.email,
        u.phone_number,
        u.is_phone_verified,
        u.created_at AS registered_at,
        (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) AS appointment_count
      FROM patients p
      JOIN users u ON p.user_id = u.id
      ORDER BY u.created_at DESC
    `).all();

    res.json({ success: true, count: patients.length, patients });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/departments
async function getAdminDepartments(req, res, next) {
  try {
    const departments = db.prepare(`
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM doctors doc WHERE doc.department_id = d.id AND doc.is_active = 1) AS doctor_count,
        (SELECT COUNT(*) FROM appointments a WHERE a.department_id = d.id) AS appointment_count
      FROM departments d
      ORDER BY d.name ASC
    `).all();

    res.json({ success: true, departments });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/departments
async function createDepartment(req, res, next) {
  try {
    const { name, code, description, icon } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required.' });
    }

    const id = `dept-${code.toLowerCase().trim()}`;
    db.prepare(`
      INSERT INTO departments (id, name, code, description, icon)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, code.toUpperCase(), description || null, icon || 'Activity');

    res.status(201).json({ success: true, message: 'Department created successfully!', id });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/communications (Communication Logs)
async function getCommunicationLogs(req, res, next) {
  try {
    const { status, channel, trigger_event, search } = req.query;

    let query = `
      SELECT * FROM notifications WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (channel) {
      query += ` AND channel = ?`;
      params.push(channel);
    }
    if (trigger_event) {
      query += ` AND trigger_event = ?`;
      params.push(trigger_event);
    }
    if (search) {
      query += ` AND (recipient_phone LIKE ? OR recipient_name LIKE ? OR content LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const logs = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/test-twilio
async function testTwilioSMS(req, res, next) {
  try {
    const { phone_number, message, channel = 'sms' } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Target phone number is required.' });
    }

    const testMsg = message || 'Test communication message from MediCare Hospital System. Your Twilio integration is working seamlessly!';

    let result;
    if (channel === 'whatsapp') {
      result = await twilioService.sendWhatsApp({
        to: phone_number,
        message: testMsg,
        triggerEvent: 'system',
        userId: req.user.id,
        recipientName: 'Test Recipient'
      });
    } else {
      result = await twilioService.sendSMS({
        to: phone_number,
        message: testMsg,
        triggerEvent: 'system',
        userId: req.user.id,
        recipientName: 'Test Recipient'
      });
    }

    res.json({
      success: true,
      result,
      twilioConfigured: twilioService.isConfigured,
      channel
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminAnalytics,
  getAdminDoctors,
  createDoctor,
  getAdminPatients,
  getAdminDepartments,
  createDepartment,
  getCommunicationLogs,
  testTwilioSMS
};
