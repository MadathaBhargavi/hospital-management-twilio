const db = require('../config/database');

// GET /api/patients/profile
async function getPatientProfile(req, res, next) {
  try {
    const patient = db.prepare(`
      SELECT 
        p.*,
        u.full_name,
        u.email,
        u.phone_number,
        u.is_phone_verified,
        u.avatar_url
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `).get(req.user.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    res.json({
      success: true,
      patient
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/patients/profile
async function updatePatientProfile(req, res, next) {
  try {
    const { full_name, phone_number, date_of_birth, gender, blood_group, address, emergency_contact, medical_history, allergies } = req.body;

    // Update user table
    db.prepare(`
      UPDATE users SET
        full_name = COALESCE(?, full_name),
        phone_number = COALESCE(?, phone_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(full_name, phone_number, req.user.id);

    // Update patient table
    db.prepare(`
      UPDATE patients SET
        date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender),
        blood_group = COALESCE(?, blood_group),
        address = COALESCE(?, address),
        emergency_contact = COALESCE(?, emergency_contact),
        medical_history = COALESCE(?, medical_history),
        allergies = COALESCE(?, allergies)
      WHERE user_id = ?
    `).run(date_of_birth, gender, blood_group, address, emergency_contact, medical_history, allergies, req.user.id);

    res.json({
      success: true,
      message: 'Profile updated successfully!'
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/patients/dashboard
async function getPatientDashboard(req, res, next) {
  try {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Next upcoming appointment
    const nextAppointment = db.prepare(`
      SELECT 
        a.id,
        a.appointment_number,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        d.id AS doctor_id,
        d.specialization,
        d.room_number,
        d.consultation_fee,
        u.full_name AS doctor_name,
        u.phone_number AS doctor_phone,
        u.email AS doctor_email,
        dept.name AS department_name,
        dept.icon AS department_icon
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.patient_id = ? 
        AND a.appointment_date >= ?
        AND a.status IN ('pending', 'confirmed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 1
    `).get(patient.id, today);

    // Recent appointment list (up to 5)
    const recentAppointments = db.prepare(`
      SELECT 
        a.id,
        a.appointment_number,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        u.full_name AS doctor_name,
        d.specialization,
        dept.name AS department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.created_at DESC
      LIMIT 5
    `).all(patient.id);

    // Statistics
    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN appointment_date >= ? AND status IN ('pending', 'confirmed') THEN 1 END) AS upcoming_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count,
        COUNT(*) AS total_appointments
      FROM appointments
      WHERE patient_id = ?
    `).get(today, patient.id);

    // Recent notifications
    const recentNotifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(req.user.id);

    res.json({
      success: true,
      nextAppointment,
      recentAppointments,
      stats,
      recentNotifications
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getPatientDashboard
};
