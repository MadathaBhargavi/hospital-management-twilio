const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate, authorize(['admin']));

router.get('/analytics', adminController.getAdminAnalytics);
router.get('/doctors', adminController.getAdminDoctors);
router.post('/doctors', adminController.createDoctor);
router.get('/patients', adminController.getAdminPatients);
router.get('/departments', adminController.getAdminDepartments);
router.post('/departments', adminController.createDepartment);
router.get('/communications', adminController.getCommunicationLogs);
router.post('/test-twilio', adminController.testTwilioSMS);

module.exports = router;
