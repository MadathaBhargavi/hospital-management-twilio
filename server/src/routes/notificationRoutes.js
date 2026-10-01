const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/status', notificationController.getTwilioStatus);
router.get('/', authenticate, notificationController.getUserNotifications);
router.post('/test', authenticate, notificationController.testNotification);
router.post('/sms', authenticate, authorize(['admin', 'doctor']), notificationController.sendCustomSMS);
router.post('/whatsapp', authenticate, authorize(['admin', 'doctor']), notificationController.sendCustomWhatsApp);
router.post('/run-reminders', authenticate, authorize(['admin']), notificationController.triggerManualReminders);

module.exports = router;
