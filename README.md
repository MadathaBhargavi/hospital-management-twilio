# 🏥 MediCare — Hospital Management & Patient Communication Web App

A modern, production-grade Healthcare SaaS web application with integrated **Twilio SMS**, **Twilio Verify (OTP)**, **Twilio WhatsApp (Optional)**, and **Automated Appointment Reminders**.

Built with **React (Vite)**, **Express.js**, and **SQLite (`better-sqlite3`)**.

---

## 🌟 Key Features

### 👤 Patient Module
- **Registration & Authentication**: Secure sign-up with contact info, demographic parameters, and optional Twilio OTP phone verification.
- **Patient Dashboard**: Real-time overview of next scheduled consultation (with doctor contact, room number, fee, and actions), key health visit metrics, quick actions, and recent Twilio alerts feed.
- **Specialist Directory & Slot Discovery**: Search by physician name, specialty, or condition, with department filter pills (Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, General Medicine) and day-of-week filters.
- **Interactive Booking Flow**: Select date, pick available time slots (automatically checks against booked collisions), enter symptoms, and preview the instant Twilio SMS confirmation.
- **My Appointments**: Filter by Upcoming, Completed, or Cancelled. Reschedule appointments to new slots or cancel visits with automated SMS notifications to the patient's phone.
- **Doctor Notes & Prescriptions**: View clinical observations and medication instructions entered by doctors.
- **Medical Profile**: Manage blood group, emergency contacts, chronic conditions, and drug allergies.

### 🩺 Doctor / Physician Module
- **Doctor Dashboard**: Real-time queue for today's consultations, upcoming schedule, and total patients treated.
- **Patient Queue & Actions**: Confirm pending appointments, cancel appointments, or mark consultations as completed with clinical notes and prescriptions.
- **Consultation Schedule & Practice Settings**: Configure available working days, time slot intervals, consultation fees ($), room locations, and bio.

### 🛡️ Hospital Admin Module
- **Operations Analytics**: Live statistics for total registered patients, active physicians, today's appointments, completed vs cancelled rates, and department capacity loads.
- **Physician Directory Management**: Register new doctors with credentials, specialties, room allocations, and fee schedules.
- **Patient Master Records**: View patient directories, emergency contacts, medical histories, and Twilio phone verification statuses.
- **Master Appointment Control**: Full administrative oversight of hospital bookings with filtering and cancellation controls.
- **Automated Reminder Job Runner**: Trigger the appointment reminder cron scanner on demand to inspect and notify all upcoming patients.
- **Twilio Diagnostic & Test Suite**: Send live test SMS or WhatsApp messages directly to any phone number to verify Twilio connectivity.

### 📱 Twilio Telephony & Notification Service
- **Twilio SMS**:
  - Automated confirmation on appointment booking.
  - Doctor confirmation alert.
  - Cancellation notification with stated reason.
  - Reschedule alert with new date & time.
  - Automated appointment reminder.
- **Twilio Verify & OTP**:
  - Secure 6-digit phone verification with 10-minute expiry.
  - Supports Twilio Verify Service SID or direct SMS fallback.
- **Optional WhatsApp Support**:
  - Dispatches WhatsApp alerts if `TWILIO_WHATSAPP_NUMBER` is configured.
- **Twilio Development & Simulation Mode**:
  - If Twilio credentials are not configured, the app **never crashes**.
  - Notifications are logged with status `not_configured` in the database, with full audit trail visibility in the Admin Communication Logs.
  - Verification codes are clearly displayed in the UI for effortless local testing.

---

## 🔑 Demo Accounts (Pre-Seeded)

| Role | Email | Password | Phone |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@medicare.com` | `Password123!` | `+15551234567` |
| **Doctor** | `arthur.campbell@medicare.com` | `Password123!` | `+15552345678` |
| **Patient** | `patient@medicare.com` | `Password123!` | `+15559876543` |

*Tip: You can also use the 1-click quick login buttons on the login screen or top navigation bar to switch roles instantly.*

---

## ⚙️ Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Configure your `.env` parameters:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=hospital_jwt_secret_super_secure_key_2026_healthcare

# Twilio SMS & Voice Configuration (From https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Optional: Twilio Verify Service SID (for OTP verification)
TWILIO_VERIFY_SERVICE_SID=VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional: Twilio WhatsApp Number (e.g. +14155238886 for Twilio Sandbox)
TWILIO_WHATSAPP_NUMBER=

# Frontend Client URL
CLIENT_URL=http://localhost:5173
```

---

## 🚀 How to Run the Application

### 1. Install Dependencies
```bash
npm install
npm install --prefix client
```

### 2. Start Backend & Frontend Simultaneously
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 How to Test SMS & OTP

1. **In Development Mode (Without Twilio Credentials)**:
   - Book an appointment as a patient: The UI will display a `Dev Mode (Simulated)` confirmation, and the alert content will be recorded in the Admin **Twilio & SMS Logs**.
   - Click **Verify Phone with OTP** in the Patient Dashboard: The generated 6-digit OTP code will appear on screen for easy 1-click verification.
   - Go to Admin Dashboard and click **Trigger Automated Reminders Job** to simulate the hourly reminder scanner.

2. **In Live Twilio Mode**:
   - Provide your real `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` in `.env`.
   - Register or update your profile with your real mobile phone number (including country code, e.g. `+1...` or `+91...`).
   - Book an appointment or click **Test SMS / WhatsApp** in the top Twilio banner. The SMS will be delivered directly to your device.

---

## 🗄️ Database Architecture

The application uses high-performance SQLite (`hospital.sqlite`) with WAL mode and foreign key constraints:
- `users`: User credentials, roles (`patient`, `doctor`, `admin`), phone number, verification state.
- `departments`: Medical specialties (Cardiology, Neurology, Pediatrics, Orthopedics, Dermatology, General Medicine).
- `doctors`: Doctor profiles, specialization, qualification, fees, room numbers, availability days, time slots JSON.
- `patients`: Patient profiles, DOB, gender, blood group, emergency contact, medical history, allergies.
- `appointments`: Booking numbers, patient ID, doctor ID, department ID, date, time slot, status, reason, symptoms, notes, prescriptions.
- `notifications`: Complete communication audit log tracking recipient phone, channel, trigger event, Twilio SID, delivery status (`sent`, `failed`, `not_configured`), and error messages.
- `otp_verifications`: Phone number OTP codes, expiration timestamps, attempt tracking, and verification flags.
