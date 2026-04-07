const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController')
const authenticateToken = require('../middlewares/AuthMiddleware')

router.post('/', AppointmentController.CreateAppointment)
router.get('/:id', AppointmentController.AppointmentDetails)
router.put('/:id/cancel', AppointmentController.CancelAppointment)
router.post('/:id/results', AppointmentController.Results)

module.exports = router