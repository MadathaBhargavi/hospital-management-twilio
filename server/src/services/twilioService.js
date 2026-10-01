const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const db = require('../config/database');

class TwilioService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.init();
  }

  init() {
    try {
      if (
        config.TWILIO_ACCOUNT_SID &&
        config.TWILIO_AUTH_TOKEN &&
        config.TWILIO_PHONE_NUMBER &&
        !config.TWILIO_ACCOUNT_SID.startsWith('your_') &&
        config.TWILIO_ACCOUNT_SID.trim().length > 0 &&
        config.TWILIO_PHONE_NUMBER.trim().length > 0
      ) {
        this.client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        this.isConfigured = true;
        console.log('📱 Twilio client successfully initialized with live sender phone number.');
      } else {
        this.isConfigured = false;
        this.client = null;
        console.log('ℹ️ Twilio phone number not configured or incomplete. Running in Development/Simulation mode.');
      }
    } catch (err) {
      this.isConfigured = false;
      this.client = null;
      console.warn('⚠️ Warning: Failed to initialize Twilio client:', err.message);
    }
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      hasAccountSid: Boolean(config.TWILIO_ACCOUNT_SID && !config.TWILIO_ACCOUNT_SID.startsWith('your_')),
      hasAuthToken: Boolean(config.TWILIO_AUTH_TOKEN && !config.TWILIO_AUTH_TOKEN.startsWith('your_')),
      fromNumber: config.TWILIO_PHONE_NUMBER || null,
      verifyServiceSid: config.TWILIO_VERIFY_SERVICE_SID || null,
      whatsappNumber: config.TWILIO_WHATSAPP_NUMBER || null,
      isVerifyConfigured: Boolean(this.isConfigured && config.TWILIO_VERIFY_SERVICE_SID),
      isWhatsAppConfigured: Boolean(this.isConfigured && config.TWILIO_WHATSAPP_NUMBER)
    };
  }

  /**
   * Send an SMS notification (Live Twilio or Simulated Dev Mode)
   */
  async sendSMS({ to, message, triggerEvent = 'system', userId = null, recipientName = '' }) {
    const notificationId = `notif-${uuidv4().substring(0, 8)}`;
    let status = 'not_configured';
    let errorMessage = null;
    let twilioSid = null;

    if (!to) {
      return { success: false, message: 'Recipient phone number is required.', status: 'failed' };
    }

    // Format phone number to E.164 if missing '+'
    let formattedPhone = to.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    if (this.isConfigured && this.client && config.TWILIO_PHONE_NUMBER) {
      try {
        const result = await this.client.messages.create({
          body: message,
          from: config.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });

        twilioSid = result.sid;
        status = result.status === 'failed' || result.status === 'undelivered' ? 'failed' : 'sent';
        console.log(`✅ [Twilio SMS Sent] To: ${formattedPhone} | SID: ${result.sid}`);
      } catch (err) {
        console.error(`❌ [Twilio SMS Error] To: ${formattedPhone} | Error: ${err.message}`);
        status = 'failed';
        errorMessage = err.message;
      }
    } else {
      status = 'not_configured';
      errorMessage = 'Twilio phone number not configured in .env (Simulated in Dev Mode)';
      console.log(`ℹ️ [Dev Mode SMS] To: ${formattedPhone} | Event: ${triggerEvent} | Content: "${message}"`);
    }

    // Persist notification log in SQLite database
    try {
      db.prepare(`
        INSERT INTO notifications (
          id, user_id, recipient_phone, recipient_name, channel,
          trigger_event, content, twilio_sid, status, error_message
        ) VALUES (?, ?, ?, ?, 'sms', ?, ?, ?, ?, ?)
      `).run(
        notificationId,
        userId,
        formattedPhone,
        recipientName || 'Patient',
        triggerEvent,
        message,
        twilioSid,
        status,
        errorMessage
      );
    } catch (dbErr) {
      console.error('Error logging notification to DB:', dbErr.message);
    }

    return {
      success: status === 'sent' || status === 'not_configured',
      notificationId,
      status,
      twilioSid,
      errorMessage,
      devMode: !this.isConfigured
    };
  }

  /**
   * Send a WhatsApp message (Live Twilio or Simulated Dev Mode)
   */
  async sendWhatsApp({ to, message, triggerEvent = 'system', userId = null, recipientName = '' }) {
    const notificationId = `notif-${uuidv4().substring(0, 8)}`;
    let status = 'not_configured';
    let errorMessage = null;
    let twilioSid = null;

    if (!to) {
      return { success: false, message: 'Recipient phone number is required.', status: 'failed' };
    }

    let formattedPhone = to.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    const isWhatsAppReady = Boolean(
      this.isConfigured && 
      this.client && 
      config.TWILIO_WHATSAPP_NUMBER && 
      config.TWILIO_WHATSAPP_NUMBER.trim().length > 0
    );

    if (isWhatsAppReady) {
      try {
        const fromWhatsApp = config.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
          ? config.TWILIO_WHATSAPP_NUMBER
          : `whatsapp:${config.TWILIO_WHATSAPP_NUMBER}`;
        
        const toWhatsApp = formattedPhone.startsWith('whatsapp:')
          ? formattedPhone
          : `whatsapp:${formattedPhone}`;

        const result = await this.client.messages.create({
          body: message,
          from: fromWhatsApp,
          to: toWhatsApp
        });

        twilioSid = result.sid;
        status = result.status === 'failed' || result.status === 'undelivered' ? 'failed' : 'sent';
        console.log(`✅ [Twilio WhatsApp Sent] To: ${toWhatsApp} | SID: ${result.sid}`);
      } catch (err) {
        console.error(`❌ [Twilio WhatsApp Error] To: ${formattedPhone} | Error: ${err.message}`);
        status = 'failed';
        errorMessage = err.message;
      }
    } else {
      status = 'not_configured';
      errorMessage = 'Twilio WhatsApp not configured in .env (Simulated in Dev Mode)';
      console.log(`ℹ️ [Dev Mode WhatsApp] To: ${formattedPhone} | Event: ${triggerEvent} | Content: "${message}"`);
    }

    // Persist notification log in SQLite database
    try {
      db.prepare(`
        INSERT INTO notifications (
          id, user_id, recipient_phone, recipient_name, channel,
          trigger_event, content, twilio_sid, status, error_message
        ) VALUES (?, ?, ?, ?, 'whatsapp', ?, ?, ?, ?, ?)
      `).run(
        notificationId,
        userId,
        formattedPhone,
        recipientName || 'Patient',
        triggerEvent,
        message,
        twilioSid,
        status,
        errorMessage
      );
    } catch (dbErr) {
      console.error('Error logging notification to DB:', dbErr.message);
    }

    return {
      success: status === 'sent' || status === 'not_configured',
      notificationId,
      status,
      twilioSid,
      errorMessage,
      devMode: !isWhatsAppReady
    };
  }

  /**
   * Send OTP via Twilio Verify or local fallback
   */
  async sendOTP({ phoneNumber, purpose = 'phone_verification' }) {
    if (!phoneNumber) {
      return { success: false, message: 'Phone number is required.' };
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    // If Twilio Verify service is configured
    if (this.isConfigured && this.client && config.TWILIO_VERIFY_SERVICE_SID) {
      try {
        const verification = await this.client.verify.v2
          .services(config.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: formattedPhone, channel: 'sms' });

        return {
          success: true,
          status: verification.status,
          service: 'twilio_verify',
          message: `OTP sent to ${formattedPhone} via Twilio Verify.`
        };
      } catch (err) {
        console.error('Twilio Verify error:', err.message);
        // Fallback to direct SMS / OTP table if Verify API fails
      }
    }

    // Standard 6-digit OTP generation
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
    const otpId = `otp-${uuidv4().substring(0, 8)}`;

    // Store in DB
    db.prepare(`
      INSERT INTO otp_verifications (id, phone_number, otp_code, purpose, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(otpId, formattedPhone, otpCode, purpose, expiresAt);

    // Send SMS with OTP
    const smsMessage = `Your MediCare verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code with anyone.`;
    
    const smsResult = await this.sendSMS({
      to: formattedPhone,
      message: smsMessage,
      triggerEvent: 'otp'
    });

    return {
      success: true,
      service: 'sms_otp',
      otpId,
      otpCode: this.isConfigured ? undefined : otpCode, // In dev mode, return OTP for easy testing
      status: smsResult.status,
      message: this.isConfigured 
        ? `OTP sent to ${formattedPhone}.` 
        : `[Dev Mode] Verification code generated: ${otpCode} (Valid for 10 min)`
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP({ phoneNumber, code }) {
    if (!phoneNumber || !code) {
      return { success: false, message: 'Phone number and verification code are required.' };
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    // Try Twilio Verify if configured
    if (this.isConfigured && this.client && config.TWILIO_VERIFY_SERVICE_SID) {
      try {
        const verificationCheck = await this.client.verify.v2
          .services(config.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: formattedPhone, code: code.trim() });

        if (verificationCheck.status === 'approved') {
          db.prepare('UPDATE users SET is_phone_verified = 1 WHERE phone_number = ?').run(formattedPhone);
          return { success: true, message: 'Phone number successfully verified!' };
        } else {
          return { success: false, message: 'Invalid verification code.' };
        }
      } catch (err) {
        console.error('Twilio Verify check error:', err.message);
      }
    }

    // Verify against local table
    const record = db.prepare(`
      SELECT * FROM otp_verifications
      WHERE phone_number = ? AND is_used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(formattedPhone);

    if (!record) {
      return { success: false, message: 'No active OTP found. Please request a new OTP.' };
    }

    const now = new Date();
    const expiry = new Date(record.expires_at);

    if (now > expiry) {
      return { success: false, message: 'OTP expired. Please request a new OTP.' };
    }

    if (record.attempts >= 5) {
      return { success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    if (record.otp_code !== code.trim()) {
      db.prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(record.id);
      return { success: false, message: 'Invalid OTP code. Please check and try again.' };
    }

    // Mark used
    db.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(record.id);
    db.prepare('UPDATE users SET is_phone_verified = 1 WHERE phone_number = ?').run(formattedPhone);

    return { success: true, message: 'Phone number verified successfully!' };
  }
}

const twilioService = new TwilioService();
module.exports = twilioService;
