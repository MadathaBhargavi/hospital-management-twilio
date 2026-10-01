const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['patient', 'admin']), appointmentController.createAppointment);
router.get('/', authenticate, appointmentController.getAppointments);
router.get('/:id', authenticate, appointmentController.getAppointmentById);
router.put('/:id', authenticate, appointmentController.updateAppointmentStatus);
router.put('/:id/status', authenticate, appointmentController.updateAppointmentStatus);
router.delete('/:id', authenticate, authorize(['admin']), appointmentController.deleteAppointment);

module.exports = router;
