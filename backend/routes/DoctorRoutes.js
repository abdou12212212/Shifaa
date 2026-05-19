const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/DoctorController');
const authenticateToken = require('../middlewares/AuthMiddleware');

// Auth middleware (can be commented for testing)
// router.use(authenticateToken);

// ============= Doctor Routes =============
router.get('/', DoctorController.VerifiedDoctors);
router.get('/:id', DoctorController.DoctorProfile);
router.put('/:id', DoctorController.DoctorUpdate);
router.get('/:id/appointments', DoctorController.DoctorAppointments);

console.log('[DOCTOR ROUTES] Routes registered successfully');



/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: API endpoints for managing doctor profiles and appointments
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *         full_name:
 *           type: string
 *         phone_number:
 *           type: string
 *         email:
 *           type: string
 *         specialization:
 *           type: string
 *         clinic_address:
 *           type: string
 *         profile_picture_url:
 *           type: string
 *         is_verified:
 *           type: boolean
 *         is_featured:
 *           type: boolean
 *         years_of_experience:
 *           type: integer
 *         consultation_fee:
 *           type: number
 *         created_at:
 *           type: string
 *           format: date-time
 *     DoctorUpdateRequest:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *         phone_number:
 *           type: string
 *         email:
 *           type: string
 *         specialization:
 *           type: string
 *         clinic_address:
 *           type: string
 *         years_of_experience:
 *           type: integer
 *         consultation_fee:
 *           type: number
 *     DoctorAppointment:
 *       type: object
 *       properties:
 *         appointment_id:
 *           type: integer
 *         appointment_ref_id:
 *           type: string
 *         appointment_datetime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [Pending Confirmation, Upcoming, In Progress, Completed, Cancelled]
 *         patient_name:
 *           type: string
 *         patient_phone:
 *           type: string
 *         test_names:
 *           type: string
 *         total_cost:
 *           type: number
 */

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get a list of verified doctors
 *     description: Returns all doctors with is_verified = true
 *     tags: [Doctors]
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
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by specialization
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured doctors only
 *     responses:
 *       200:
 *         description: List of verified doctors retrieved successfully
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
 *                     $ref: '#/components/schemas/Doctor'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Get doctor profile by ID
 *     description: Returns detailed information about a specific doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /doctors/{id}:
 *   put:
 *     summary: Update doctor profile by ID
 *     description: Updates doctor information (requires authentication)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorUpdateRequest'
 *     responses:
 *       200:
 *         description: Doctor profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - invalid data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /doctors/{id}/appointments:
 *   get:
 *     summary: Get appointments associated with the doctor by ID
 *     description: Returns all appointments for a specific doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, Pending Confirmation, Upcoming, In Progress, Completed, Cancelled]
 *         description: Filter by appointment status
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
 *         description: Doctor appointments retrieved successfully
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
 *                     $ref: '#/components/schemas/DoctorAppointment'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */

module.exports = router;