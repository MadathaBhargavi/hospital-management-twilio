const db = require('../config/database');

// GET /api/doctors
async function getAllDoctors(req, res, next) {
  try {
    const { search, department_id, day } = req.query;

    let query = `
      SELECT 
        d.id,
        d.user_id,
        d.department_id,
        d.specialization,
        d.qualification,
        d.experience_years,
        d.bio,
        d.consultation_fee,
        d.room_number,
        d.available_days,
        d.available_time_slots,
        d.rating,
        d.is_active,
        u.full_name,
        u.email,
        u.phone_number,
        u.avatar_url,
        dept.name AS department_name,
        dept.icon AS department_icon
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.is_active = 1
    `;

    const params = [];

    if (department_id) {
      query += ` AND d.department_id = ?`;
      params.push(department_id);
    }

    if (search) {
      query += ` AND (u.full_name LIKE ? OR d.specialization LIKE ? OR dept.name LIKE ? OR d.qualification LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY d.rating DESC, u.full_name ASC`;

    const doctorsRaw = db.prepare(query).all(...params);

    // Parse JSON fields
    const doctors = doctorsRaw.map(doc => {
      let days = [];
      let slots = [];
      try { days = JSON.parse(doc.available_days || '[]'); } catch (e) { days = []; }
      try { slots = JSON.parse(doc.available_time_slots || '[]'); } catch (e) { slots = []; }

      return {
        ...doc,
        available_days: days,
        available_time_slots: slots
      };
    });

    // Optional filter by day if requested
    let filteredDoctors = doctors;
    if (day) {
      filteredDoctors = doctors.filter(doc => doc.available_days.includes(day));
    }

    res.json({
      success: true,
      count: filteredDoctors.length,
      doctors: filteredDoctors
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/doctors/:id
async function getDoctorById(req, res, next) {
  try {
    const { id } = req.params;

    const doc = db.prepare(`
      SELECT 
        d.id,
        d.user_id,
        d.department_id,
        d.specialization,
        d.qualification,
        d.experience_years,
        d.bio,
        d.consultation_fee,
        d.room_number,
        d.available_days,
        d.available_time_slots,
        d.rating,
        d.is_active,
        u.full_name,
        u.email,
        u.phone_number,
        u.avatar_url,
        dept.name AS department_name,
        dept.code AS department_code,
        dept.description AS department_description,
        dept.icon AS department_icon
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = ? OR d.user_id = ?
    `).get(id, id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    let days = [];
    let slots = [];
    try { days = JSON.parse(doc.available_days || '[]'); } catch (e) { days = []; }
    try { slots = JSON.parse(doc.available_time_slots || '[]'); } catch (e) { slots = []; }

    res.json({
      success: true,
      doctor: {
        ...doc,
        available_days: days,
        available_time_slots: slots
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
async function getDoctorAvailableSlots(req, res, next) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please specify an appointment date (YYYY-MM-DD).'
      });
    }

    const doctor = db.prepare('SELECT available_days, available_time_slots FROM doctors WHERE id = ?').get(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Determine Day of week for target date
    const dateObj = new Date(date + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayName = dayNames[dateObj.getDay()];

    let availableDays = [];
    let allSlots = [];
    try { availableDays = JSON.parse(doctor.available_days || '[]'); } catch (e) {}
    try { allSlots = JSON.parse(doctor.available_time_slots || '[]'); } catch (e) {}

    const isWorkingDay = availableDays.includes(targetDayName);

    if (!isWorkingDay) {
      return res.json({
        success: true,
        date,
        dayOfWeek: targetDayName,
        isWorkingDay: false,
        availableSlots: [],
        message: `Doctor is not scheduled to consult on ${targetDayName}s.`
      });
    }

    // Get already booked appointments for this doctor on this date
    const bookedAppointments = db.prepare(`
      SELECT appointment_time FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND status IN ('pending', 'confirmed')
    `).all(id, date);

    const bookedTimes = new Set(bookedAppointments.map(a => a.appointment_time));

    const slotDetails = allSlots.map(slot => ({
      time: slot,
      isAvailable: !bookedTimes.has(slot)
    }));

    res.json({
      success: true,
      date,
      dayOfWeek: targetDayName,
      isWorkingDay: true,
      slots: slotDetails,
      availableSlots: slotDetails.filter(s => s.isAvailable).map(s => s.time)
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/doctors/dashboard/metrics (Doctor specific dashboard)
async function getDoctorDashboard(req, res, next) {
  try {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(req.user.id);
    if (!doctor) {
      return res.status(403).json({ success: false, message: 'Doctor profile not found.' });
    }

    const today = new Date().toISOString().split('T')[0];

    const todayAppointments = db.prepare(`
      SELECT 
        a.id,
        a.appointment_number,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        a.symptoms,
        a.doctor_notes,
        a.prescription,
        u.full_name AS patient_name,
        u.email AS patient_email,
        u.phone_number AS patient_phone,
        p.gender,
        p.blood_group,
        p.date_of_birth,
        p.medical_history,
        p.allergies
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? AND a.appointment_date = ?
      ORDER BY a.appointment_time ASC
    `).all(doctor.id, today);

    const upcomingAppointments = db.prepare(`
      SELECT 
        a.id,
        a.appointment_number,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        a.symptoms,
        u.full_name AS patient_name,
        u.phone_number AS patient_phone,
        p.gender,
        p.blood_group
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? AND a.appointment_date > ? AND a.status IN ('pending', 'confirmed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 10
    `).all(doctor.id, today);

    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN appointment_date = ? THEN 1 END) AS today_count,
        COUNT(CASE WHEN appointment_date > ? AND status IN ('pending', 'confirmed') THEN 1 END) AS upcoming_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
        COUNT(DISTINCT patient_id) AS total_patients
      FROM appointments
      WHERE doctor_id = ?
    `).get(today, today, doctor.id);

    res.json({
      success: true,
      stats,
      todayAppointments,
      upcomingAppointments
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/doctors/profile
async function updateDoctorProfile(req, res, next) {
  try {
    const { specialization, qualification, experience_years, bio, consultation_fee, room_number, available_days, available_time_slots } = req.body;
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(req.user.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    db.prepare(`
      UPDATE doctors SET
        specialization = COALESCE(?, specialization),
        qualification = COALESCE(?, qualification),
        experience_years = COALESCE(?, experience_years),
        bio = COALESCE(?, bio),
        consultation_fee = COALESCE(?, consultation_fee),
        room_number = COALESCE(?, room_number),
        available_days = COALESCE(?, available_days),
        available_time_slots = COALESCE(?, available_time_slots)
      WHERE id = ?
    `).run(
      specialization,
      qualification,
      experience_years,
      bio,
      consultation_fee,
      room_number,
      available_days ? JSON.stringify(available_days) : null,
      available_time_slots ? JSON.stringify(available_time_slots) : null,
      doctor.id
    );

    res.json({
      success: true,
      message: 'Doctor profile updated successfully!'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorAvailableSlots,
  getDoctorDashboard,
  updateDoctorProfile
};
