const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middlewares/AuthMiddleware');
const upload = require('../../config/multer')
const Admin1 = require('../../controllers/Admin/Admin1');
const Admin2 = require('../../controllers/Admin/Admin2');
const Admin3 = require('../../controllers/Admin/Admin3');
const Admin4 = require('../../controllers/Admin/Admin4');
const Admin5 = require('../../controllers/Admin/Admin5');
const Admin6 = require('../../controllers/Admin/Admin6');
const ResultController = require('../../controllers/Admin/ResultController');
const ReportsController = require('../../controllers/Admin/ReportsController');

// ============================================================
// ================ SWAGGER DOCUMENTATION ====================
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and operations (Authentication required)
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ============================================================
// ================ DASHBOARD STATISTICS ====================
// ============================================================

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns total counts of patients, doctors, assistants, and revenue
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/dashboard/stats', authenticateAdmin, Admin1.getDashboardStats);

// ============================================================
// ================ REPORTS & ANALYTICS ======================
// ============================================================

/**
 * @swagger
 * /admin/reports/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard reports
 *     description: Returns user trends, revenue trends, top tests, and appointment distribution
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Report period (week, month, or year)
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reports/dashboard', authenticateAdmin, ReportsController.getDashboardReports);

/**
 * @swagger
 * /admin/reports/financial:
 *   get:
 *     summary: Get financial report
 *     description: Returns revenue by test, daily revenue, and financial summary
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Financial report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reports/financial', authenticateAdmin, ReportsController.getFinancialReport);

/**
 * @swagger
 * /admin/reports/patients:
 *   get:
 *     summary: Get patient analytics
 *     description: Returns patient demographics, active patients, and new patients trend
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reports/patients', authenticateAdmin, ReportsController.getPatientAnalytics);

// ============================================================
// ================ APPOINTMENT MANAGEMENT ===================
// ============================================================

/**
 * @swagger
 * /admin/appointments/pending:
 *   get:
 *     summary: Get pending appointments
 *     description: Returns list of appointments pending confirmation
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Pending appointments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/appointments/pending', authenticateAdmin, Admin1.getPendingAppointments);

/**
 * @swagger
 * /admin/appointments:
 *   get:
 *     summary: Get all appointments with filters
 *     description: Returns all appointments with optional search and status filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name, phone, or ref ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, Pending Confirmation, Upcoming, In Progress, Completed, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/appointments', authenticateAdmin, Admin5.getAppointments);

/**
 * @swagger
 * /admin/appointments/stats:
 *   get:
 *     summary: Get appointment statistics
 *     description: Returns counts of appointments by status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/appointments/stats', authenticateAdmin, Admin5.getAppointmentStats);

/**
 * @swagger
 * /admin/appointments/available-assistants:
 *   get:
 *     summary: Get available assistants
 *     description: Returns list of assistants who can be assigned to appointments
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available assistants retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/appointments/available-assistants', authenticateAdmin, Admin5.getAvailableAssistants);

/**
 * @swagger
 * /admin/appointments/{appointmentId}:
 *   get:
 *     summary: Get appointment details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details retrieved successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.get('/appointments/:appointmentId', authenticateAdmin, Admin5.getAppointmentDetails);

/**
 * @swagger
 * /admin/appointments/{appointmentId}/status:
 *   put:
 *     summary: Update appointment status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending Confirmation, Upcoming, In Progress, Completed, Cancelled]
 *               lab_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.put('/appointments/:appointmentId/status', authenticateAdmin, Admin1.updateAppointmentStatus);

/**
 * @swagger
 * /admin/appointments/{appointmentId}/status:
 *   patch:
 *     summary: Update appointment status (alternative method)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending Confirmation, Upcoming, In Progress, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/appointments/:appointmentId/status', authenticateAdmin, Admin5.updateAppointmentStatus);

/**
 * @swagger
 * /admin/appointments/{appointmentId}/assign-assistant:
 *   patch:
 *     summary: Assign assistant to appointment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assistant_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Assistant assigned successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/appointments/:appointmentId/assign-assistant', authenticateAdmin, Admin5.assignAssistant);

/**
 * @swagger
 * /admin/appointments/{appointmentId}:
 *   patch:
 *     summary: Update appointment details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_datetime:
 *                 type: string
 *                 format: date-time
 *               patient_notes:
 *                 type: string
 *               lab_notes:
 *                 type: string
 *               is_urgent:
 *                 type: boolean
 *               payment_method:
 *                 type: string
 *                 enum: [Cash, Card, Not Selected]
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/appointments/:appointmentId', authenticateAdmin, Admin5.updateAppointmentDetails);

/**
 * @swagger
 * /admin/appointments/{appointmentId}:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/appointments/:appointmentId', authenticateAdmin, Admin1.deleteAppointment);

// ============================================================
// ================ PATIENT MANAGEMENT =======================
// ============================================================

/**
 * @swagger
 * /admin/patients:
 *   get:
 *     summary: Get all patients
 *     description: Returns paginated list of patients with search and filter options
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/patients', authenticateAdmin, Admin2.getPatients);

/**
 * @swagger
 * /admin/patients/stats:
 *   get:
 *     summary: Get patient statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/patients/stats', authenticateAdmin, Admin2.getPatientStats);

/**
 * @swagger
 * /admin/patients/{patientId}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient details retrieved successfully
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */
router.get('/patients/:patientId', authenticateAdmin, Admin2.getPatientById);

/**
 * @swagger
 * /admin/patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - phone_number
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/patients', authenticateAdmin, Admin2.createPatient);

/**
 * @swagger
 * /admin/patients/{patientId}:
 *   put:
 *     summary: Update patient information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */
router.put('/patients/:patientId', authenticateAdmin, Admin2.updatePatient);

/**
 * @swagger
 * /admin/patients/{patientId}:
 *   delete:
 *     summary: Soft delete patient (deactivate)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient deactivated successfully
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/patients/:patientId', authenticateAdmin, Admin2.deletePatient);

/**
 * @swagger
 * /admin/patients/{patientId}/permanent:
 *   delete:
 *     summary: Permanently delete patient
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient permanently deleted
 *       400:
 *         description: Cannot delete patient with appointments
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/patients/:patientId/permanent', authenticateAdmin, Admin2.permanentlyDeletePatient);

/**
 * @swagger
 * /admin/patients/{patientId}/reactivate:
 *   put:
 *     summary: Reactivate a deactivated patient
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient reactivated successfully
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */
router.put('/patients/:patientId/reactivate', authenticateAdmin, Admin2.reactivatePatient);

// ============================================================
// ================ DOCTOR MANAGEMENT ========================
// ============================================================

/**
 * @swagger
 * /admin/doctors:
 *   get:
 *     summary: Get all doctors
 *     description: Returns paginated list of doctors with search and filter options
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, verified, unverified, active, inactive]
 *     responses:
 *       200:
 *         description: Doctors retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/doctors', authenticateAdmin, Admin3.getDoctors);

/**
 * @swagger
 * /admin/doctors/unverified:
 *   get:
 *     summary: Get unverified doctors for recruitment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Unverified doctors retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/doctors/unverified', authenticateAdmin, Admin1.getUnverifiedDoctors);

/**
 * @swagger
 * /admin/doctors/stats:
 *   get:
 *     summary: Get doctor statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/doctors/stats', authenticateAdmin, Admin3.getDoctorStats);

/**
 * @swagger
 * /admin/doctors/{doctorId}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor details retrieved successfully
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.get('/doctors/:doctorId', authenticateAdmin, Admin3.getDoctorById);

/**
 * @swagger
 * /admin/doctors:
 *   post:
 *     summary: Create a new doctor account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - phone_number
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *               clinic_address:
 *                 type: string
 *               is_verified:
 *                 type: boolean
 *               is_featured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/doctors', authenticateAdmin, Admin3.createDoctor);

/**
 * @swagger
 * /admin/doctors/{doctorId}:
 *   put:
 *     summary: Update doctor information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               clinic_address:
 *                 type: string
 *               is_verified:
 *                 type: boolean
 *               is_featured:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.put('/doctors/:doctorId', authenticateAdmin, Admin3.updateDoctor);

/**
 * @swagger
 * /admin/doctors/{doctorId}/verify:
 *   put:
 *     summary: Toggle doctor verification status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Verification status toggled successfully
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.put('/doctors/:doctorId/verify', authenticateAdmin, Admin1.verifyDoctor);

/**
 * @swagger
 * /admin/doctors/{doctorId}/feature:
 *   put:
 *     summary: Toggle doctor featured status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Featured status toggled successfully
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.put('/doctors/:doctorId/feature', authenticateAdmin, Admin3.toggleFeaturedStatus);

/**
 * @swagger
 * /admin/doctors/{doctorId}:
 *   delete:
 *     summary: Soft delete doctor (deactivate account)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor deactivated successfully
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/doctors/:doctorId', authenticateAdmin, Admin3.deleteDoctor);

/**
 * @swagger
 * /admin/doctors/{doctorId}/application:
 *   delete:
 *     summary: Delete doctor application (reject unverified doctor)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor application deleted successfully
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/doctors/:doctorId/application', authenticateAdmin, Admin1.deleteDoctorApplication);

/**
 * @swagger
 * /admin/doctors/{doctorId}/permanent:
 *   delete:
 *     summary: Permanently delete doctor
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor permanently deleted
 *       400:
 *         description: Cannot delete doctor with appointments
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/doctors/:doctorId/permanent', authenticateAdmin, Admin3.permanentlyDeleteDoctor);

/**
 * @swagger
 * /admin/doctors/{doctorId}/reactivate:
 *   put:
 *     summary: Reactivate a deactivated doctor
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor reactivated successfully
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 */
router.put('/doctors/:doctorId/reactivate', authenticateAdmin, Admin3.reactivateDoctor);

// ============================================================
// ================ ASSISTANT MANAGEMENT =====================
// ============================================================

/**
 * @swagger
 * /admin/assistants:
 *   get:
 *     summary: Get all assistants
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assistants retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/assistants', authenticateAdmin, Admin4.getAssistants);

/**
 * @swagger
 * /admin/assistants:
 *   post:
 *     summary: Create a new assistant
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - phone_number
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Assistant created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/assistants', authenticateAdmin, Admin4.createAssistant);

/**
 * @swagger
 * /admin/assistants/{assistantId}:
 *   get:
 *     summary: Get assistant details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assistant details retrieved successfully
 *       404:
 *         description: Assistant not found
 *       401:
 *         description: Unauthorized
 */
router.get('/assistants/:assistantId', authenticateAdmin, Admin4.getAssistantDetails);

/**
 * @swagger
 * /admin/assistants/{assistantId}/status:
 *   patch:
 *     summary: Update assistant status (activate/deactivate)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Assistant not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/assistants/:assistantId/status', authenticateAdmin, Admin4.updateAssistantStatus);

/**
 * @swagger
 * /admin/assistants/{assistantId}:
 *   delete:
 *     summary: Delete an assistant
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assistant deleted successfully
 *       400:
 *         description: Cannot delete assistant with appointments
 *       404:
 *         description: Assistant not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/assistants/:assistantId', authenticateAdmin, Admin4.deleteAssistant);

// ============================================================
// ================ TEST & RESULTS MANAGEMENT ================
// ============================================================

/**
 * @swagger
 * /admin/tests:
 *   get:
 *     summary: Get all tests (appointments with test data)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/tests', authenticateAdmin, Admin6.getAppointments);

/**
 * @swagger
 * /admin/tests/{appointmentId}:
 *   get:
 *     summary: Get test details by appointment ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.get('/tests/:appointmentId', authenticateAdmin, Admin6.getAppointmentDetails);

/**
 * @swagger
 * /admin/tests/{appointmentId}:
 *   put:
 *     summary: Update test/appointment details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_datetime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *               payment_method:
 *                 type: string
 *               total_cost:
 *                 type: number
 *               is_urgent:
 *                 type: boolean
 *               patient_notes:
 *                 type: string
 *               lab_notes:
 *                 type: string
 *               assistant_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Test updated successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.put('/tests/:appointmentId', authenticateAdmin, Admin6.updateAppointment);

/**
 * @swagger
 * /admin/tests/data/assistants:
 *   get:
 *     summary: Get assistants data for test assignment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assistants retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/tests/data/assistants', authenticateAdmin, Admin6.getAvailableAssistants);

/**
 * @swagger
 * /admin/tests/upload:
 *   post:
 *     summary: Upload a test result file
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               appointment_id:
 *                 type: integer
 *               test_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
router.post('/tests/upload', authenticateAdmin, upload.single('file'), Admin6.uploadFile);

/**
 * @swagger
 * /admin/tests/results:
 *   post:
 *     summary: Upload test results to database
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointment_id
 *               - result_file_url
 *             properties:
 *               appointment_id:
 *                 type: integer
 *               test_id:
 *                 type: integer
 *               result_file_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Results uploaded successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/tests/results', authenticateAdmin, Admin6.uploadTestResults);

/**
 * @swagger
 * /admin/appointments/{appointmentId}/results:
 *   get:
 *     summary: Get test results for an appointment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *       404:
 *         description: No results found
 *       401:
 *         description: Unauthorized
 */
router.get('/appointments/:appointmentId/results', authenticateAdmin, Admin6.getAppointmentResults);

// ============================================================
// ================ RESULT CREATION & MANAGEMENT =============
// ============================================================

/**
 * @swagger
 * /admin/results/create:
 *   post:
 *     summary: Create a new result with appointment (one-step operation)
 *     description: Creates both an appointment and uploads the result in one operation
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - patient_name
 *               - patient_phone
 *               - test_id
 *               - analysis_date
 *               - result_file_url
 *             properties:
 *               patient_id:
 *                 type: integer
 *               patient_name:
 *                 type: string
 *               patient_phone:
 *                 type: string
 *               doctor_id:
 *                 type: integer
 *               doctor_name:
 *                 type: string
 *               doctor_phone:
 *                 type: string
 *               test_id:
 *                 type: integer
 *               test_name:
 *                 type: string
 *               test_code:
 *                 type: string
 *               analysis_date:
 *                 type: string
 *                 format: date
 *               analysis_price:
 *                 type: number
 *               result_file_url:
 *                 type: string
 *               appointment_ref_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Result and appointment created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/results/create', authenticateAdmin, ResultController.createResult);

/**
 * @swagger
 * /admin/results/{appointmentId}:
 *   put:
 *     summary: Update an existing result
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               analysis_date:
 *                 type: string
 *                 format: date
 *               analysis_price:
 *                 type: number
 *               result_file_url:
 *                 type: string
 *               doctor_name:
 *                 type: string
 *               patient_notes:
 *                 type: string
 *               lab_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Result updated successfully
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.put('/results/:appointmentId', authenticateAdmin, ResultController.updateResult);

/**
 * @swagger
 * /admin/results:
 *   get:
 *     summary: Get all results (completed appointments with uploaded results)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name, phone, or ref ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/results', authenticateAdmin, ResultController.getAllResults);

module.exports = router;