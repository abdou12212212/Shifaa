const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/PatientController')
const authenticateToken = require('../middlewares/AuthMiddleware')

router.get('/:id', PatientController.PatientProfile)
router.put('/:id', PatientController.PatientUpdate)
router.get('/:id/addresses', PatientController.PatientAdresses)
router.post('/:id/addresses', PatientController.AddAdresse)
router.post('/location', PatientController.saveLocation);
router.get('/location/:patient_id', PatientController.getLocation);

module.exports = router