const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/profile', authenticate, authorize(['patient']), patientController.getPatientProfile);
router.put('/profile', authenticate, authorize(['patient']), patientController.updatePatientProfile);
router.get('/dashboard', authenticate, authorize(['patient']), patientController.getPatientDashboard);

module.exports = router;
