const db = require('../config/database');
const twilioService = require('../services/twilioService');
const { runRemindersCheck } = require('../services/reminderScheduler');

// GET /api/notifications
async function getUserNotifications(req, res, next) {
  try {
    let notifications = [];

    if (req.user.role === 'admin') {
      notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
    } else {
      notifications = db.prepare(`
        SELECT * FROM notifications
        WHERE user_id = ? OR recipient_phone = ?
        ORDER BY created_at DESC LIMIT 30
      `).all(req.user.id, req.user.phone_number);
    }

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/test (Available for authenticated users in diagnostic banner)
async function testNotification(req, res, next) {
  try {
    const { phone_number, message, channel = 'sms' } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Target phone number is required.' });
    }

    const testMsg = message || 'Test notification from MediCare Hospital Management System. Twilio alerts are active!';
    const recipientName = req.user ? req.user.full_name : 'Test Recipient';
    const userId = req.user ? req.user.id : null;

    let result;
    if (channel === 'whatsapp') {
      result = await twilioService.sendWhatsApp({
        to: phone_number,
        message: testMsg,
        triggerEvent: 'system',
        userId,
        recipientName
      });
    } else {
      result = await twilioService.sendSMS({
        to: phone_number,
        message: testMsg,
        triggerEvent: 'system',
        userId,
        recipientName
      });
    }

    res.json({
      success: Boolean(result.success),
      result,
      twilioConfigured: twilioService.isConfigured,
      channel
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/sms
async function sendCustomSMS(req, res, next) {
  try {
    const { to, message, trigger_event = 'system', recipient_name } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Recipient number (to) and message are required.' });
    }

    const result = await twilioService.sendSMS({
      to,
      message,
      triggerEvent: trigger_event,
      userId: req.user ? req.user.id : null,
      recipientName: recipient_name
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/whatsapp
async function sendCustomWhatsApp(req, res, next) {
  try {
    const { to, message, trigger_event = 'system', recipient_name } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Recipient number (to) and message are required.' });
    }

    const result = await twilioService.sendWhatsApp({
      to,
      message,
      triggerEvent: trigger_event,
      userId: req.user ? req.user.id : null,
      recipientName: recipient_name
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/run-reminders
async function triggerManualReminders(req, res, next) {
  try {
    const result = await runRemindersCheck();
    res.json({
      success: true,
      message: `Appointment reminder scanner executed. Found and processed ${result.processed} appointments.`,
      result
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications/status
async function getTwilioStatus(req, res, next) {
  try {
    const status = twilioService.getStatus();
    res.json({
      success: true,
      status
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUserNotifications,
  testNotification,
  sendCustomSMS,
  sendCustomWhatsApp,
  triggerManualReminders,
  getTwilioStatus
};
