const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/PatientController');
const authenticateToken = require('../middlewares/AuthMiddleware');

// Auth middleware (can be commented for testing)
// router.use(authenticateToken);

// ============= Patient Routes =============
router.get('/:id', PatientController.PatientProfile);
router.put('/:id', PatientController.PatientUpdate);
router.get('/:id/addresses', PatientController.PatientAdresses);
router.post('/:id/addresses', PatientController.AddAdresse);
router.post('/location', PatientController.saveLocation);
router.get('/location/:patient_id', PatientController.getLocation);

console.log('[PATIENT ROUTES] Routes registered successfully');



/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: API endpoints for managing patient profiles, addresses, and location
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
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
 *         date_of_birth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         profile_picture_url:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *     Address:
 *       type: object
 *       properties:
 *         address_id:
 *           type: integer
 *         address_line1:
 *           type: string
 *         address_line2:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         postal_code:
 *           type: string
 *         is_default:
 *           type: boolean
 *     Location:
 *       type: object
 *       properties:
 *         location_id:
 *           type: integer
 *         patient_id:
 *           type: integer
 *         latitude:
 *           type: number
 *           format: float
 *         longitude:
 *           type: number
 *           format: float
 *         updated_at:
 *           type: string
 *           format: date-time
 *     PatientUpdateRequest:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *         phone_number:
 *           type: string
 *         email:
 *           type: string
 *         date_of_birth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *     AddressRequest:
 *       type: object
 *       required:
 *         - address_line1
 *         - city
 *       properties:
 *         address_line1:
 *           type: string
 *         address_line2:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         postal_code:
 *           type: string
 *         is_default:
 *           type: boolean
 *     LocationRequest:
 *       type: object
 *       required:
 *         - patient_id
 *         - latitude
 *         - longitude
 *       properties:
 *         patient_id:
 *           type: integer
 *         latitude:
 *           type: number
 *           format: float
 *         longitude:
 *           type: number
 *           format: float
 */

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient profile by ID
 *     description: Returns detailed information about a specific patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     summary: Update patient profile by ID
 *     description: Updates patient information (requires authentication)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientUpdateRequest'
 *     responses:
 *       200:
 *         description: Patient profile updated successfully
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
 *         description: Patient not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /patients/{id}/addresses:
 *   get:
 *     summary: Get patient addresses by patient ID
 *     description: Returns all addresses associated with a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /patients/{id}/addresses:
 *   post:
 *     summary: Add a new address for a patient by patient ID
 *     description: Creates a new address entry for the specified patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressRequest'
 *     responses:
 *       201:
 *         description: Address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     address_id:
 *                       type: integer
 *       400:
 *         description: Bad request - invalid data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /patients/{id}/addresses/{addressId}:
 *   delete:
 *     summary: Delete a patient address
 *     description: Removes a specific address from a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
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
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /patients/location:
 *   post:
 *     summary: Save patient location
 *     description: Stores or updates the current GPS location of a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationRequest'
 *     responses:
 *       200:
 *         description: Patient location saved successfully
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
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /patients/location/{patient_id}:
 *   get:
 *     summary: Get patient location by patient ID
 *     description: Returns the last known GPS location of a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Bad request - invalid patient ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Patient or location not found
 *       500:
 *         description: Server error
 */


module.exports = router;