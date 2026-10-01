const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'hospital_jwt_secret_super_secure_key_2026_healthcare',
  
  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DB_PATH: path.join(__dirname, '../../hospital.sqlite')
};

// Check if Twilio is configured
config.isTwilioConfigured = Boolean(
  config.TWILIO_ACCOUNT_SID &&
  config.TWILIO_AUTH_TOKEN &&
  config.TWILIO_PHONE_NUMBER &&
  !config.TWILIO_ACCOUNT_SID.startsWith('your_')
);

config.isTwilioVerifyConfigured = Boolean(
  config.isTwilioConfigured && config.TWILIO_VERIFY_SERVICE_SID
);

config.isTwilioWhatsAppConfigured = Boolean(
  config.isTwilioConfigured && config.TWILIO_WHATSAPP_NUMBER
);

module.exports = config;
