const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middlewares/AuthMiddleware');
const upload = require('../../config/multer');
const Admin1 = require('../../controllers/Admin/Admin1');
const Admin2 = require('../../controllers/Admin/Admin2');
const Admin3 = require('../../controllers/Admin/Admin3');
const Admin4 = require('../../controllers/Admin/Admin4');
const Admin5 = require('../../controllers/Admin/Admin5');
const Admin6 = require('../../controllers/Admin/Admin6');
const ResultController = require('../../controllers/Admin/ResultController');
const ReportsController = require('../../controllers/Admin/ReportsController');

/**
 * All routes in this file are protected with Admin authentication
 * The authenticateAdmin middleware verifies JWT token and checks user_type='Admin'
 */

// Dashboard statistics
router.get('/dashboard/stats', authenticateAdmin, Admin1.getDashboardStats);

// Reports and Analytics routes
router.get('/reports/dashboard', authenticateAdmin, ReportsController.getDashboardReports);
router.get('/reports/financial', authenticateAdmin, ReportsController.getFinancialReport);
router.get('/reports/patients', authenticateAdmin, ReportsController.getPatientAnalytics);

// Appointment management (Admin1)
router.get('/appointments/pending', authenticateAdmin, Admin1.getPendingAppointments);
router.put('/appointments/:appointmentId/status', authenticateAdmin, Admin1.updateAppointmentStatus);
router.delete('/appointments/:appointmentId', authenticateAdmin, Admin1.deleteAppointment);

// Doctor recruitment management (Admin1)
router.get('/doctors/unverified', authenticateAdmin, Admin1.getUnverifiedDoctors);
router.put('/doctors/:doctorId/verify', authenticateAdmin, Admin1.verifyDoctor);
router.delete('/doctors/:doctorId', authenticateAdmin, Admin1.deleteDoctorApplication);

// Patient management routes (Admin2)
router.get('/patients', authenticateAdmin, Admin2.getPatients);
router.get('/patients/stats', authenticateAdmin, Admin2.getPatientStats);
router.get('/patients/:patientId', authenticateAdmin, Admin2.getPatientById);
router.post('/patients', authenticateAdmin, Admin2.createPatient);
router.put('/patients/:patientId', authenticateAdmin, Admin2.updatePatient);
router.delete('/patients/:patientId', authenticateAdmin, Admin2.deletePatient);
router.delete('/patients/:patientId/permanent', authenticateAdmin, Admin2.permanentlyDeletePatient);
router.put('/patients/:patientId/reactivate', authenticateAdmin, Admin2.reactivatePatient);

// Doctor management routes (Admin3)
router.get('/doctors', authenticateAdmin, Admin3.getDoctors);
router.get('/doctors/stats', authenticateAdmin, Admin3.getDoctorStats);
router.get('/doctors/:doctorId', authenticateAdmin, Admin3.getDoctorById);
router.post('/doctors', authenticateAdmin, Admin3.createDoctor);
router.put('/doctors/:doctorId', authenticateAdmin, Admin3.updateDoctor);
router.put('/doctors/:doctorId/verify', authenticateAdmin, Admin3.toggleDoctorVerification);
router.put('/doctors/:doctorId/feature', authenticateAdmin, Admin3.toggleFeaturedStatus);
router.delete('/doctors/:doctorId', authenticateAdmin, Admin3.deleteDoctor);
router.delete('/doctors/:doctorId/permanent', authenticateAdmin, Admin3.permanentlyDeleteDoctor);
router.put('/doctors/:doctorId/reactivate', authenticateAdmin, Admin3.reactivateDoctor);

// Assistant management routes (Admin4)
router.get('/assistants', authenticateAdmin, Admin4.getAssistants);
router.post('/assistants', authenticateAdmin, Admin4.createAssistant);
router.get('/assistants/:assistantId', authenticateAdmin, Admin4.getAssistantDetails);
router.patch('/assistants/:assistantId/status', authenticateAdmin, Admin4.updateAssistantStatus);
router.delete('/assistants/:assistantId', authenticateAdmin, Admin4.deleteAssistant);

// Appointment management routes (Admin5)
router.get('/appointments', authenticateAdmin, Admin5.getAppointments);
router.get('/appointments/stats', authenticateAdmin, Admin5.getAppointmentStats);
router.get('/appointments/available-assistants', authenticateAdmin, Admin5.getAvailableAssistants);
router.get('/appointments/:appointmentId', authenticateAdmin, Admin5.getAppointmentDetails);
router.patch('/appointments/:appointmentId/status', authenticateAdmin, Admin5.updateAppointmentStatus);
router.patch('/appointments/:appointmentId/assign-assistant', authenticateAdmin, Admin5.assignAssistant);
router.patch('/appointments/:appointmentId', authenticateAdmin, Admin5.updateAppointmentDetails);

// Test management routes (Admin6)
router.get('/tests', authenticateAdmin, Admin6.getAppointments);
router.get('/tests/:appointmentId', authenticateAdmin, Admin6.getAppointmentDetails);
router.put('/tests/:appointmentId', authenticateAdmin, Admin6.updateAppointment);
router.get('/tests/data/assistants', authenticateAdmin, Admin6.getAvailableAssistants);

// File upload and test results routes
router.post('/tests/upload', authenticateAdmin, upload.single('file'), Admin6.uploadFile);
router.post('/tests/results', authenticateAdmin, Admin6.uploadTestResults);

// Get test results for an appointment
router.get('/appointments/:appointmentId/results', authenticateAdmin, Admin6.getAppointmentResults);

// Result creation and management routes (via ResultFormModal)
router.post('/results/create', authenticateAdmin, ResultController.createResult);
router.put('/results/:appointmentId', authenticateAdmin, ResultController.updateResult);
router.get('/results', authenticateAdmin, ResultController.getAllResults);

module.exports = router;
