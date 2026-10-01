const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', doctorController.getAllDoctors);
router.get('/dashboard/metrics', authenticate, authorize(['doctor', 'admin']), doctorController.getDoctorDashboard);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/slots', doctorController.getDoctorAvailableSlots);
router.put('/profile', authenticate, authorize(['doctor']), doctorController.updateDoctorProfile);

module.exports = router;
