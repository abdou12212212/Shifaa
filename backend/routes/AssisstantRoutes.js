const express = require('express');
const router = express.Router();
const AssistantController = require('../controllers/AssistantController')
const authenticateToken = require('../middlewares/AuthMiddleware')


router.get('/:id', AssistantController.AssistantProfile)
router.get('/:id/appointments', AssistantController.AssistantAppointments)


module.exports = router