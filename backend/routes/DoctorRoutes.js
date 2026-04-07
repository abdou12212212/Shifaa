const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/DoctorController');
const authenticateToken = require('../middlewares/AuthMiddleware')


router.get('/', DoctorController.VerifiedDoctors)
router.get('/:id', DoctorController.DoctorProfile)
router.put('/:id', DoctorController.DoctorUpdate)
router.get('/:id/appointments', DoctorController.DoctorAppointments)

module.exports = router