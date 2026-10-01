const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const twilioService = require('../services/twilioService');

// POST /api/appointments
async function createAppointment(req, res, next) {
  try {
    const { doctor_id, appointment_date, appointment_time, reason, symptoms } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment date, and time slot are required.'
      });
    }

    // Get patient record
    let patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
    if (!patient) {
      // Auto-create patient record if user is a patient
      const newPatientId = `patient-${uuidv4().substring(0, 8)}`;
      db.prepare('INSERT INTO patients (id, user_id) VALUES (?, ?)').run(newPatientId, req.user.id);
      patient = { id: newPatientId };
    }

    // Fetch doctor and department details
    const doctor = db.prepare(`
      SELECT 
        d.id, d.room_number, d.consultation_fee,
        u.full_name AS doctor_name, u.phone_number AS doctor_phone,
        dept.id AS department_id, dept.name AS department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = ?
    `).get(doctor_id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check slot collision
    const existingBooking = db.prepare(`
      SELECT id FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status IN ('pending', 'confirmed')
    `).get(doctor_id, appointment_date, appointment_time);

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot has just been booked by another patient. Please choose another slot.'
      });
    }

    const appointmentId = `apt-${uuidv4().substring(0, 8)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appointmentNumber = `APT-2026-${randomSuffix}`;

    db.prepare(`
      INSERT INTO appointments (
        id, appointment_number, patient_id, doctor_id, department_id,
        appointment_date, appointment_time, status, reason, symptoms, reminder_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, 0)
    `).run(
      appointmentId,
      appointmentNumber,
      patient.id,
      doctor.id,
      doctor.department_id,
      appointment_date,
      appointment_time,
      reason || 'General Consultation',
      symptoms || null
    );

    // Send Twilio SMS to Patient
    const patientName = req.user.full_name;
    const roomInfo = doctor.room_number ? ` Room: ${doctor.room_number}.` : '';
    const docName = doctor.doctor_name.startsWith('Dr.') ? doctor.doctor_name : `Dr. ${doctor.doctor_name}`;
    const smsContent = `Hello ${patientName}, your appointment with ${docName} (${doctor.department_name}) is confirmed for ${appointment_date} at ${appointment_time}. Appt #${appointmentNumber}.${roomInfo} Thank you for choosing MediCare.`;

    const smsResult = await twilioService.sendSMS({
      to: req.user.phone_number,
      message: smsContent,
      triggerEvent: 'booking',
      userId: req.user.id,
      recipientName: patientName
    });

    const newAppointment = db.prepare(`
      SELECT 
        a.*,
        u_doc.full_name AS doctor_name,
        d.specialization,
        d.room_number,
        d.consultation_fee,
        dept.name AS department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = ?
    `).get(appointmentId);

    let clientMessage = 'Appointment booked and confirmed successfully!';
    if (smsResult.status === 'sent') {
      clientMessage = 'Appointment confirmed! SMS confirmation sent to your phone.';
    } else if (smsResult.status === 'not_configured') {
      clientMessage = 'Appointment confirmed! (Twilio SMS simulated in development mode).';
    } else if (smsResult.status === 'failed') {
      clientMessage = 'Appointment booked, but SMS notification could not be delivered.';
    }

    res.status(201).json({
      success: true,
      message: clientMessage,
      appointment: newAppointment,
      smsStatus: smsResult.status,
      smsError: smsResult.errorMessage
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments
async function getAppointments(req, res, next) {
  try {
    const { status, date, doctor_id, patient_id } = req.query;
    let query = `
      SELECT 
        a.*,
        u_patient.full_name AS patient_name,
        u_patient.phone_number AS patient_phone,
        u_patient.email AS patient_email,
        p.gender AS patient_gender,
        p.blood_group AS patient_blood_group,
        p.date_of_birth AS patient_dob,
        u_doc.full_name AS doctor_name,
        u_doc.phone_number AS doctor_phone,
        d.specialization AS doctor_specialization,
        d.room_number,
        d.consultation_fee,
        dept.name AS department_name,
        dept.icon AS department_icon
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE 1=1
    `;

    const params = [];

    // Role-based restrictions
    if (req.user.role === 'patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
      if (!patient) return res.json({ success: true, appointments: [] });
      query += ` AND a.patient_id = ?`;
      params.push(patient.id);
    } else if (req.user.role === 'doctor') {
      const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(req.user.id);
      if (!doctor) return res.json({ success: true, appointments: [] });
      query += ` AND a.doctor_id = ?`;
      params.push(doctor.id);
    } else if (req.user.role === 'admin') {
      if (doctor_id) {
        query += ` AND a.doctor_id = ?`;
        params.push(doctor_id);
      }
      if (patient_id) {
        query += ` AND a.patient_id = ?`;
        params.push(patient_id);
      }
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const appointments = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments/:id
async function getAppointmentById(req, res, next) {
  try {
    const { id } = req.params;

    const appointment = db.prepare(`
      SELECT 
        a.*,
        u_patient.full_name AS patient_name,
        u_patient.phone_number AS patient_phone,
        u_patient.email AS patient_email,
        p.gender AS patient_gender,
        p.blood_group AS patient_blood_group,
        p.date_of_birth AS patient_dob,
        p.medical_history,
        p.allergies,
        u_doc.full_name AS doctor_name,
        u_doc.phone_number AS doctor_phone,
        d.specialization AS doctor_specialization,
        d.room_number,
        d.consultation_fee,
        dept.name AS department_name,
        dept.icon AS department_icon
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = ? OR a.appointment_number = ?
    `).get(id, id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Role security check
    if (req.user.role === 'patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
      if (!patient || appointment.patient_id !== patient.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(req.user.id);
      if (!doctor || appointment.doctor_id !== doctor.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({
      success: true,
      appointment
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/appointments/:id/status (Confirm, Complete, Cancel, Reschedule)
async function updateAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, cancellation_reason, doctor_notes, prescription, new_date, new_time } = req.body;

    const apt = db.prepare(`
      SELECT 
        a.*,
        u_patient.full_name AS patient_name,
        u_patient.phone_number AS patient_phone,
        u_patient.id AS patient_user_id,
        u_doc.full_name AS doctor_name,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = ?
    `).get(id);

    if (!apt) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    let updatedDate = apt.appointment_date;
    let updatedTime = apt.appointment_time;
    let newStatus = status || apt.status;
    let eventType = 'confirmation';
    let smsMessage = '';

    const docName = apt.doctor_name.startsWith('Dr.') ? apt.doctor_name : `Dr. ${apt.doctor_name}`;

    if (status === 'confirmed') {
      newStatus = 'confirmed';
      eventType = 'confirmation';
      smsMessage = `Hello ${apt.patient_name}, ${docName} has confirmed your appointment for ${apt.appointment_date} at ${apt.appointment_time}.`;
    } else if (status === 'cancelled') {
      newStatus = 'cancelled';
      eventType = 'cancellation';
      const reasonText = cancellation_reason ? ` Reason: ${cancellation_reason}.` : '';
      smsMessage = `Hello ${apt.patient_name}, your appointment with ${docName} on ${apt.appointment_date} at ${apt.appointment_time} has been cancelled.${reasonText} Please contact MediCare to reschedule.`;
    } else if (status === 'rescheduled') {
      if (!new_date || !new_time) {
        return res.status(400).json({ success: false, message: 'New date and new time are required for rescheduling.' });
      }
      newStatus = 'confirmed'; // Status becomes confirmed for the new date
      updatedDate = new_date;
      updatedTime = new_time;
      eventType = 'reschedule';
      smsMessage = `Hello ${apt.patient_name}, your appointment with ${docName} has been rescheduled to ${new_date} at ${new_time}. Appt #${apt.appointment_number}.`;
    } else if (status === 'completed') {
      newStatus = 'completed';
    }

    db.prepare(`
      UPDATE appointments SET
        status = ?,
        appointment_date = ?,
        appointment_time = ?,
        cancellation_reason = COALESCE(?, cancellation_reason),
        doctor_notes = COALESCE(?, doctor_notes),
        prescription = COALESCE(?, prescription),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newStatus,
      updatedDate,
      updatedTime,
      cancellation_reason || null,
      doctor_notes || null,
      prescription || null,
      id
    );

    // Send Twilio notification if status changed to confirmed, cancelled, or rescheduled
    let smsResult = null;
    if (smsMessage) {
      smsResult = await twilioService.sendSMS({
        to: apt.patient_phone,
        message: smsMessage,
        triggerEvent: eventType,
        userId: apt.patient_user_id,
        recipientName: apt.patient_name
      });
    }

    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Appointment updated successfully to ${newStatus}.`,
      appointment: updated,
      smsStatus: smsResult ? smsResult.status : undefined
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/appointments/:id (Admin cancel/delete)
async function deleteAppointment(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
    res.json({ success: true, message: 'Appointment removed successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment
};
