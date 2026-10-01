const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const config = require('./env');

const db = new Database(config.DB_PATH, { verbose: null });

// Enable foreign keys and WAL mode for high performance & reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) NOT NULL,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      is_phone_verified INTEGER DEFAULT 0,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      department_id TEXT NOT NULL,
      specialization TEXT NOT NULL,
      qualification TEXT NOT NULL,
      experience_years INTEGER DEFAULT 1,
      bio TEXT,
      consultation_fee REAL DEFAULT 50.0,
      room_number TEXT,
      available_days TEXT NOT NULL, -- JSON array of days: ["Monday", "Tuesday", ...]
      available_time_slots TEXT NOT NULL, -- JSON array of slots: ["09:00 AM", "10:00 AM", ...]
      rating REAL DEFAULT 4.9,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      date_of_birth TEXT,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other', '')),
      blood_group TEXT,
      address TEXT,
      emergency_contact TEXT,
      medical_history TEXT,
      allergies TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_number TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL, -- YYYY-MM-DD
      appointment_time TEXT NOT NULL, -- e.g. "09:30 AM"
      status TEXT CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'confirmed',
      reason TEXT,
      symptoms TEXT,
      doctor_notes TEXT,
      prescription TEXT,
      cancellation_reason TEXT,
      reminder_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      recipient_phone TEXT NOT NULL,
      recipient_name TEXT,
      channel TEXT CHECK(channel IN ('sms', 'whatsapp', 'in_app')) DEFAULT 'sms',
      trigger_event TEXT CHECK(trigger_event IN ('booking', 'confirmation', 'cancellation', 'reschedule', 'reminder', 'otp', 'system')) NOT NULL,
      content TEXT NOT NULL,
      twilio_sid TEXT,
      status TEXT CHECK(status IN ('sent', 'failed', 'not_configured', 'delivered')) NOT NULL,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id TEXT PRIMARY KEY,
      phone_number TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      purpose TEXT DEFAULT 'phone_verification',
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Password123!', salt);

  // 1. Seed Departments
  const departments = [
    {
      id: 'dept-cardio',
      name: 'Cardiology',
      code: 'CARD',
      description: 'Comprehensive heart & cardiovascular disease diagnosis, interventional therapy, and cardiac wellness.',
      icon: 'HeartPulse'
    },
    {
      id: 'dept-neuro',
      name: 'Neurology',
      code: 'NEUR',
      description: 'Advanced brain, spine, and peripheral nervous system diagnostics and therapeutic management.',
      icon: 'Brain'
    },
    {
      id: 'dept-ortho',
      name: 'Orthopedics',
      code: 'ORTH',
      description: 'Joint reconstruction, sports injuries, fracture management, and spine rehabilitation.',
      icon: 'Bone'
    },
    {
      id: 'dept-pedia',
      name: 'Pediatrics',
      code: 'PED',
      description: 'Specialized neonatal care, pediatric growth monitoring, immunizations, and child wellness.',
      icon: 'Baby'
    },
    {
      id: 'dept-derma',
      name: 'Dermatology',
      code: 'DERM',
      description: 'Clinical dermatology, aesthetic skin restoration, allergy testing, and laser therapies.',
      icon: 'Sparkles'
    },
    {
      id: 'dept-genmed',
      name: 'General Medicine',
      code: 'GMED',
      description: 'Primary care, chronic condition monitoring, lifestyle diseases, and general health evaluations.',
      icon: 'Stethoscope'
    }
  ];

  const insertDept = db.prepare(`
    INSERT INTO departments (id, name, code, description, icon)
    VALUES (@id, @name, @code, @description, @icon)
  `);

  for (const dept of departments) {
    insertDept.run(dept);
  }

  // 2. Seed Admin User
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone_number, is_phone_verified)
    VALUES (@id, @email, @password_hash, @role, @full_name, @phone_number, @is_phone_verified)
  `);

  insertUser.run({
    id: 'user-admin-1',
    email: 'admin@medicare.com',
    password_hash: passwordHash,
    role: 'admin',
    full_name: 'Dr. Sarah Jenkins (Admin)',
    phone_number: '+15551234567',
    is_phone_verified: 1
  });

  // 3. Seed Doctors
  const sampleDoctors = [
    {
      userId: 'user-doc-1',
      doctorId: 'doc-cardio-1',
      name: 'Dr. Arthur Campbell',
      email: 'arthur.campbell@medicare.com',
      phone: '+15552345678',
      deptId: 'dept-cardio',
      specialization: 'Interventional Cardiologist',
      qualification: 'MD, FACC, FSCAI (Harvard Medical)',
      experience: 16,
      fee: 150.0,
      room: 'Room 301 - Tower A',
      bio: 'Pioneering cardiologist with over 16 years of expertise in minimally invasive cardiac catheterization, coronary stenting, and hypertension management.',
      rating: 4.9,
      days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      slots: JSON.stringify(['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM'])
    },
    {
      userId: 'user-doc-2',
      doctorId: 'doc-neuro-1',
      name: 'Dr. Elena Rostova',
      email: 'elena.rostova@medicare.com',
      phone: '+15553456789',
      deptId: 'dept-neuro',
      specialization: 'Senior Neurologist & Neurophysiologist',
      qualification: 'MD, PhD, FAAN (Johns Hopkins)',
      experience: 14,
      fee: 175.0,
      room: 'Room 412 - Tower B',
      bio: 'Specialist in migraine management, stroke prevention, Parkinson disease therapies, and neurodegenerative disorder diagnostics.',
      rating: 4.95,
      days: JSON.stringify(['Monday', 'Wednesday', 'Friday', 'Saturday']),
      slots: JSON.stringify(['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:00 PM', '04:00 PM'])
    },
    {
      userId: 'user-doc-3',
      doctorId: 'doc-ortho-1',
      name: 'Dr. Marcus Vance',
      email: 'marcus.vance@medicare.com',
      phone: '+15554567890',
      deptId: 'dept-ortho',
      specialization: 'Orthopedic Surgeon & Sports Medicine',
      qualification: 'MBBS, MS (Ortho), Fellowship in Sports Trauma',
      experience: 12,
      fee: 140.0,
      room: 'Room 205 - Tower A',
      bio: 'Dedicated orthopedic surgeon specializing in robotic knee/hip arthroplasty, rotator cuff repairs, and athletic ligament reconstruction.',
      rating: 4.88,
      days: JSON.stringify(['Tuesday', 'Wednesday', 'Thursday', 'Saturday']),
      slots: JSON.stringify(['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '03:30 PM'])
    },
    {
      userId: 'user-doc-4',
      doctorId: 'doc-pedia-1',
      name: 'Dr. Maya Patel',
      email: 'maya.patel@medicare.com',
      phone: '+15555678901',
      deptId: 'dept-pedia',
      specialization: 'Consultant Pediatrician & Neonatologist',
      qualification: 'MD (Pediatrics), DCH, FAAP',
      experience: 10,
      fee: 110.0,
      room: 'Room 108 - Children Wing',
      bio: 'Warm and compassionate pediatrician committed to comprehensive infant developmental checks, allergies, and pediatric wellness care.',
      rating: 4.92,
      days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slots: JSON.stringify(['08:30 AM', '09:15 AM', '10:00 AM', '10:45 AM', '02:00 PM', '02:45 PM', '03:30 PM'])
    },
    {
      userId: 'user-doc-5',
      doctorId: 'doc-derma-1',
      name: 'Dr. Sophia Lin',
      email: 'sophia.lin@medicare.com',
      phone: '+15556789012',
      deptId: 'dept-derma',
      specialization: 'Dermatologist & Laser Specialist',
      qualification: 'MD (Dermatology), Board Certified Dermatologist',
      experience: 9,
      fee: 125.0,
      room: 'Room 220 - Aesthetic Clinic',
      bio: 'Expert in clinical eczema, psoriasis therapies, acne scarring rehabilitation, and advanced medical laser procedures.',
      rating: 4.85,
      days: JSON.stringify(['Monday', 'Tuesday', 'Thursday', 'Friday']),
      slots: JSON.stringify(['10:00 AM', '11:00 AM', '12:00 PM', '02:30 PM', '03:30 PM', '04:30 PM'])
    },
    {
      userId: 'user-doc-6',
      doctorId: 'doc-genmed-1',
      name: 'Dr. David Miller',
      email: 'david.miller@medicare.com',
      phone: '+15557890123',
      deptId: 'dept-genmed',
      specialization: 'Internal Medicine & Preventive Health',
      qualification: 'MD (Internal Medicine), FACP',
      experience: 18,
      fee: 95.0,
      room: 'Room 102 - OPD Tower A',
      bio: 'Experienced internist focused on holistic family medicine, diabetes management, metabolic syndromes, and geriatric health.',
      rating: 4.9,
      days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      slots: JSON.stringify(['08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'])
    }
  ];

  const insertDoctor = db.prepare(`
    INSERT INTO doctors (
      id, user_id, department_id, specialization, qualification,
      experience_years, bio, consultation_fee, room_number,
      available_days, available_time_slots, rating
    ) VALUES (
      @id, @user_id, @department_id, @specialization, @qualification,
      @experience_years, @bio, @consultation_fee, @room_number,
      @available_days, @available_time_slots, @rating
    )
  `);

  for (const doc of sampleDoctors) {
    insertUser.run({
      id: doc.userId,
      email: doc.email,
      password_hash: passwordHash,
      role: 'doctor',
      full_name: doc.name,
      phone_number: doc.phone,
      is_phone_verified: 1
    });

    insertDoctor.run({
      id: doc.doctorId,
      user_id: doc.userId,
      department_id: doc.deptId,
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience_years: doc.experience,
      bio: doc.bio,
      consultation_fee: doc.fee,
      room_number: doc.room,
      available_days: doc.days,
      available_time_slots: doc.slots,
      rating: doc.rating
    });
  }

  // 4. Seed Sample Patients
  const samplePatients = [
    {
      userId: 'user-patient-1',
      patientId: 'patient-1',
      name: 'John Doe',
      email: 'patient@medicare.com',
      phone: '+15559876543',
      dob: '1988-06-15',
      gender: 'Male',
      bloodGroup: 'O+',
      address: '742 Evergreen Terrace, Springfield, IL',
      emergencyContact: 'Jane Doe (+1 555-987-6544)',
      medicalHistory: 'Mild seasonal allergies. Non-smoker. Routine annual cardiac checkups.'
    },
    {
      userId: 'user-patient-2',
      patientId: 'patient-2',
      name: 'Alice Henderson',
      email: 'alice.h@example.com',
      phone: '+15558765432',
      dob: '1992-11-20',
      gender: 'Female',
      bloodGroup: 'A+',
      address: '120 Elmwood St, Boston, MA',
      emergencyContact: 'Mark Henderson (+1 555-876-5430)',
      medicalHistory: 'History of tension headaches and posture strain.'
    }
  ];

  const insertPatient = db.prepare(`
    INSERT INTO patients (
      id, user_id, date_of_birth, gender, blood_group,
      address, emergency_contact, medical_history
    ) VALUES (
      @id, @user_id, @date_of_birth, @gender, @blood_group,
      @address, @emergency_contact, @medical_history
    )
  `);

  for (const p of samplePatients) {
    insertUser.run({
      id: p.userId,
      email: p.email,
      password_hash: passwordHash,
      role: 'patient',
      full_name: p.name,
      phone_number: p.phone,
      is_phone_verified: 1
    });

    insertPatient.run({
      id: p.patientId,
      user_id: p.userId,
      date_of_birth: p.dob,
      gender: p.gender,
      blood_group: p.bloodGroup,
      address: p.address,
      emergency_contact: p.emergencyContact,
      medical_history: p.medicalHistory
    });
  }

  // 5. Seed sample appointments
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  const sampleAppointments = [
    {
      id: 'apt-101',
      appointment_number: 'APT-2026-0001',
      patient_id: 'patient-1',
      doctor_id: 'doc-cardio-1',
      department_id: 'dept-cardio',
      appointment_date: today,
      appointment_time: '10:30 AM',
      status: 'confirmed',
      reason: 'Quarterly cardiovascular checkup & blood pressure review.',
      symptoms: 'Occasional mild palpitations after exertion.',
      doctor_notes: 'ECG normal. Continue standard diet regimen.',
      reminder_sent: 1
    },
    {
      id: 'apt-102',
      appointment_number: 'APT-2026-0002',
      patient_id: 'patient-1',
      doctor_id: 'doc-derma-1',
      department_id: 'dept-derma',
      appointment_date: tomorrow,
      appointment_time: '02:30 PM',
      status: 'confirmed',
      reason: 'Skin allergy screening and seasonal rash consultation.',
      symptoms: 'Mild redness on forearm after yard work.',
      doctor_notes: null,
      reminder_sent: 0
    },
    {
      id: 'apt-103',
      appointment_number: 'APT-2026-0003',
      patient_id: 'patient-2',
      doctor_id: 'doc-neuro-1',
      department_id: 'dept-neuro',
      appointment_date: dayAfterTomorrow,
      appointment_time: '09:30 AM',
      status: 'confirmed',
      reason: 'Recurrent morning headaches and visual sensitivity.',
      symptoms: 'Throbbing frontal headache lasting ~2 hours.',
      doctor_notes: null,
      reminder_sent: 0
    }
  ];

  const insertApt = db.prepare(`
    INSERT INTO appointments (
      id, appointment_number, patient_id, doctor_id, department_id,
      appointment_date, appointment_time, status, reason, symptoms, doctor_notes, reminder_sent
    ) VALUES (
      @id, @appointment_number, @patient_id, @doctor_id, @department_id,
      @appointment_date, @appointment_time, @status, @reason, @symptoms, @doctor_notes, @reminder_sent
    )
  `);

  for (const apt of sampleAppointments) {
    insertApt.run(apt);
  }

  // 6. Seed sample notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (
      id, user_id, recipient_phone, recipient_name, channel,
      trigger_event, content, status, error_message, twilio_sid
    ) VALUES (
      @id, @user_id, @recipient_phone, @recipient_name, @channel,
      @trigger_event, @content, @status, @error_message, @twilio_sid
    )
  `);

  insertNotification.run({
    id: 'notif-1',
    user_id: 'user-patient-1',
    recipient_phone: '+15559876543',
    recipient_name: 'John Doe',
    channel: 'sms',
    trigger_event: 'booking',
    content: 'Hello John Doe, your appointment with Dr. Arthur Campbell is confirmed for ' + today + ' at 10:30 AM. Thank you for choosing MediCare.',
    status: config.isTwilioConfigured ? 'sent' : 'not_configured',
    error_message: config.isTwilioConfigured ? null : 'Twilio credentials not configured in .env (Development Mode)',
    twilio_sid: config.isTwilioConfigured ? 'SM_SAMPLE_12345' : null
  });

  insertNotification.run({
    id: 'notif-2',
    user_id: 'user-patient-1',
    recipient_phone: '+15559876543',
    recipient_name: 'John Doe',
    channel: 'sms',
    trigger_event: 'reminder',
    content: 'Reminder: You have an appointment with Dr. Arthur Campbell today at 10:30 AM at Room 301 - Tower A.',
    status: config.isTwilioConfigured ? 'sent' : 'not_configured',
    error_message: config.isTwilioConfigured ? null : 'Twilio credentials not configured in .env (Development Mode)',
    twilio_sid: config.isTwilioConfigured ? 'SM_SAMPLE_67890' : null
  });

  console.log('✅ SQLite Database successfully initialized and seeded with demo accounts:');
  console.log('   - Admin:   admin@medicare.com / Password123!');
  console.log('   - Patient: patient@medicare.com / Password123!');
  console.log('   - Doctor:  arthur.campbell@medicare.com / Password123!');
}

initDatabase();

module.exports = db;
