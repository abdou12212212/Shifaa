const express = require('express');
const router = express.Router();
const AssistantController = require('../controllers/AssistantController');
const authenticateToken = require('../middlewares/AuthMiddleware');

// Auth middleware (can be commented for testing)
// router.use(authenticateToken);

// ============= Assistant Routes =============
router.get('/:id', AssistantController.AssistantProfile);
router.get('/:id/appointments', AssistantController.AssistantAppointments);

console.log('[ASSISTANT ROUTES] Routes registered successfully');



/**
 * @swagger
 * tags:
 *   name: Assistant
 *   description: API endpoints for assistant profile and appointments management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Assistant:
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
 *         profile_picture_url:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *     AssistantAppointment:
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
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         total_cost:
 *           type: number
 */

/**
 * @swagger
 * /assistant/{id}:
 *   get:
 *     summary: Get assistant profile by ID
 *     description: Returns assistant details including name, phone, email, and status
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assistant ID
 *     responses:
 *       200:
 *         description: Assistant profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assistant'
 *       400:
 *         description: Bad request - Invalid ID
 *       404:
 *         description: Assistant not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /assistant/{id}/appointments:
 *   get:
 *     summary: Get appointments associated with the assistant by ID
 *     description: Returns list of appointments assigned to the assistant
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assistant ID
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
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Assistant appointments retrieved successfully
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
 *                     $ref: '#/components/schemas/AssistantAppointment'
 *       400:
 *         description: Bad request - Invalid ID
 *       404:
 *         description: Assistant not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */





module.exports = router;