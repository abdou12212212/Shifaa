const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController');
const authenticateToken = require('../middlewares/AuthMiddleware');
const upload = require('../config/multer');

console.log('[APPOINTMENT ROUTES] Initializing routes...');
console.log('[APPOINTMENT ROUTES] Controller methods:', {
  CreateAppointment: typeof AppointmentController?.CreateAppointment,
  AppointmentDetails: typeof AppointmentController?.AppointmentDetails,
  CancelAppointment: typeof AppointmentController?.CancelAppointment,
  AddResults: typeof AppointmentController?.AddResults,
  GetProgrammedAppointments: typeof AppointmentController?.GetProgrammedAppointments,
  GetComingAppointments: typeof AppointmentController?.GetComingAppointments,
  GetOldAppointments: typeof AppointmentController?.GetOldAppointments,
  GetAppointmentsWithResults: typeof AppointmentController?.GetAppointmentsWithResults,
  GetDoctorAppointments: typeof AppointmentController?.GetDoctorAppointments,
  GetPatientAppointments: typeof AppointmentController?.GetPatientAppointments,
  GetAppointmentsByDateRange: typeof AppointmentController?.GetAppointmentsByDateRange
});

// Auth middleware (can be commented for testing)
// router.use(authenticateToken);

// ============= Basic Routes =============
router.post('/', upload.single('testImage'), AppointmentController.CreateAppointment);
router.get('/:id', AppointmentController.AppointmentDetails);
router.put('/:id/cancel', AppointmentController.CancelAppointment);
router.post('/:id/results', upload.single('resultFile'), AppointmentController.AddResults);

// ============= Appointment Filter Routes =============
router.get('/status/programmed', AppointmentController.GetProgrammedAppointments);
router.get('/status/coming', AppointmentController.GetComingAppointments);
router.get('/status/old', AppointmentController.GetOldAppointments);
router.get('/status/results', AppointmentController.GetAppointmentsWithResults);

// ============= Additional Routes =============
router.get('/doctor/:doctorId', AppointmentController.GetDoctorAppointments);
router.get('/patient/:patientId', AppointmentController.GetPatientAppointments);
router.get('/date-range', AppointmentController.GetAppointmentsByDateRange);

// Health check route
router.get('/test/health', (req, res) => {
  res.json({
    success: true,
    message: 'Appointment routes are working!',
    timestamp: new Date().toISOString()
  });
});

console.log('[APPOINTMENT ROUTES] Routes registered successfully');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: API endpoints for managing appointments
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         appointment_id:
 *           type: integer
 *         appointment_ref_id:
 *           type: string
 *         patient_id:
 *           type: integer
 *         doctor_id:
 *           type: integer
 *         appointment_datetime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [Pending Confirmation, Upcoming, In Progress, Completed, Cancelled]
 *         total_cost:
 *           type: number
 *         payment_method:
 *           type: string
 *           enum: [Cash, Card, Not Selected]
 *         is_urgent:
 *           type: boolean
 *     Test:
 *       type: object
 *       properties:
 *         test_id:
 *           type: integer
 *         test_code:
 *           type: string
 *         test_name:
 *           type: string
 *         price:
 *           type: number
 *     Result:
 *       type: object
 *       properties:
 *         result_id:
 *           type: integer
 *         result_file_url:
 *           type: string
 *         uploaded_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /appointment:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               doctor_id:
 *                 type: integer
 *               patient_id:
 *                 type: integer
 *               patient_name:
 *                 type: string
 *               patient_phone:
 *                 type: string
 *               appointment_datetime:
 *                 type: string
 *                 format: date-time
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *               test_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *               testImage:
 *                 type: string
 *                 format: binary
 *               payment_method:
 *                 type: string
 *                 enum: [Cash, Card, Not Selected]
 *               is_urgent:
 *                 type: boolean
 *               patient_notes:
 *                 type: string
 *               total_cost:
 *                 type: number
 *             required:
 *               - patient_name
 *               - patient_phone
 *               - appointment_datetime
 *               - address_line1
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/{id}:
 *   get:
 *     summary: Get appointment details by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/{id}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/{id}/results:
 *   post:
 *     summary: Add test results to an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               test_id:
 *                 type: integer
 *               resultData:
 *                 type: string
 *               result_value:
 *                 type: string
 *               is_normal:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               resultFile:
 *                 type: string
 *                 format: binary
 *             required:
 *               - test_id
 *     responses:
 *       201:
 *         description: Results added successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/status/programmed:
 *   get:
 *     summary: Get programmed appointments (Pending Confirmation)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of programmed appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/status/coming:
 *   get:
 *     summary: Get upcoming appointments (next 24 hours)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/status/old:
 *   get:
 *     summary: Get past appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/status/results:
 *   get:
 *     summary: Get appointments with test results
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments with results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Appointment'
 *                       - type: object
 *                         properties:
 *                           results_count:
 *                             type: integer
 *                           last_result_date:
 *                             type: string
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/doctor/{doctorId}:
 *   get:
 *     summary: Get appointments by doctor ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: List of doctor's appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 stats:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/patient/{patientId}:
 *   get:
 *     summary: Get appointments by patient ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: List of patient's appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 stats:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/date-range:
 *   get:
 *     summary: Get appointments within date range
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, Pending Confirmation, Upcoming, In Progress, Completed, Cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Appointments within date range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 summary:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Missing startDate or endDate
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /appointment/test/health:
 *   get:
 *     summary: Health check for appointment routes
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Routes are working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

module.exports = router;