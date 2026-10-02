const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const { initReminderScheduler } = require('./services/reminderScheduler');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  'https://hospital-management-twilio-1.onrender.com',
  'https://hospital-management-twilio.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  ...(config.CLIENT_URL ? [config.CLIENT_URL.replace(/\/+$/, '')] : [])
];

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/hospital-management-twilio.*\.onrender\.com$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    // Default fallback to allow access
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MediCare Hospital API',
    time: new Date().toISOString(),
    twilioConfigured: config.isTwilioConfigured,
    twilioVerifyConfigured: config.isTwilioVerifyConfigured,
    twilioWhatsAppConfigured: config.isTwilioWhatsAppConfigured
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// In production, serve the React client build
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// 404 & Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.PORT || 5000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 MediCare Hospital Management Server is running!`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`📱 Twilio SMS Mode: ${config.isTwilioConfigured ? 'LIVE (Configured)' : 'DEVELOPMENT / SIMULATED'}`);
  console.log(`====================================================`);

  // Initialize reminder cron job
  initReminderScheduler();
});

module.exports = app;
