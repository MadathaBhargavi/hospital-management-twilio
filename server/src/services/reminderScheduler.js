const cron = require('node-cron');
const db = require('../config/database');
const twilioService = require('./twilioService');

async function runRemindersCheck() {
  console.log('⏰ [Reminder Job] Checking for pending appointment reminders...');
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  try {
    // Query appointments for today or tomorrow with status 'confirmed' and reminder_sent = 0
    const pendingReminders = db.prepare(`
      SELECT 
        a.id AS appointment_id,
        a.appointment_number,
        a.appointment_date,
        a.appointment_time,
        u_patient.full_name AS patient_name,
        u_patient.phone_number AS patient_phone,
        u_patient.id AS patient_user_id,
        u_doctor.full_name AS doctor_name,
        d.room_number,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doctor ON d.user_id = u_doctor.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.status = 'confirmed'
        AND a.reminder_sent = 0
        AND a.appointment_date IN (?, ?)
    `).all(today, tomorrow);

    console.log(`📋 Found ${pendingReminders.length} appointments requiring reminder.`);

    const results = [];

    for (const apt of pendingReminders) {
      const isToday = apt.appointment_date === today;
      const dayLabel = isToday ? 'today' : `tomorrow (${apt.appointment_date})`;
      const roomInfo = apt.room_number ? ` at ${apt.room_number}` : '';

      const docName = apt.doctor_name.startsWith('Dr.') ? apt.doctor_name : `Dr. ${apt.doctor_name}`;
      const reminderText = `Reminder: You have an appointment with ${docName} (${apt.department_name}) ${dayLabel} at ${apt.appointment_time}${roomInfo}. Appt #${apt.appointment_number}. Thank you, MediCare Hospital.`;

      const sendRes = await twilioService.sendSMS({
        to: apt.patient_phone,
        message: reminderText,
        triggerEvent: 'reminder',
        userId: apt.patient_user_id,
        recipientName: apt.patient_name
      });

      // Mark reminder_sent in database
      db.prepare('UPDATE appointments SET reminder_sent = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(apt.appointment_id);

      results.push({
        appointmentId: apt.appointment_id,
        patientName: apt.patient_name,
        phone: apt.patient_phone,
        status: sendRes.status,
        date: apt.appointment_date,
        time: apt.appointment_time
      });
    }

    return {
      processed: pendingReminders.length,
      timestamp: new Date().toISOString(),
      results
    };
  } catch (err) {
    console.error('Error during reminder schedule check:', err);
    return { error: err.message, processed: 0 };
  }
}

function initReminderScheduler() {
  // Run every hour at minute 0 (0 * * * *)
  cron.schedule('0 * * * *', () => {
    runRemindersCheck();
  });

  console.log('⏱️ Appointment reminder cron scheduler initialized (Hourly).');
}

module.exports = {
  initReminderScheduler,
  runRemindersCheck
};
