const express = require('express');
const router = express.Router();
const TestController = require('../controllers/TestController');
const authenticateToken = require('../middlewares/AuthMiddleware');

// Auth middleware (can be commented for testing)
// router.use(authenticateToken);

// ============= Test Routes =============
router.get('/', TestController.AllTest);
router.get('/:id', TestController.TestDetails);

console.log('[TEST ROUTES] Routes registered successfully');


/**
 * @swagger
 * tags:
 *   name: Tests
 *   description: API endpoints for managing medical tests
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalTest:
 *       type: object
 *       properties:
 *         test_id:
 *           type: integer
 *         test_code:
 *           type: string
 *           example: CBC01
 *         test_name:
 *           type: string
 *           example: Complete Blood Count
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *           example: 500.00
 *         pre_test_instructions:
 *           type: string
 *         sample_type:
 *           type: string
 *           example: Blood
 *         container_type:
 *           type: string
 *           example: EDTA Tube
 *         turnaround_time:
 *           type: string
 *           example: 4 hours
 *         result_turnaround_time:
 *           type: string
 *           example: 48 hours
 *         urgent_test_name:
 *           type: string
 *         normal_range:
 *           type: string
 *         unit:
 *           type: string
 *         is_active:
 *           type: boolean
 *     TestListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         count:
 *           type: integer
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               test_id:
 *                 type: integer
 *               test_code:
 *                 type: string
 *               test_name:
 *                 type: string
 *               sample_type:
 *                 type: string
 *               price:
 *                 type: number
 *     TestDetailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           $ref: '#/components/schemas/MedicalTest'
 */

/**
 * @swagger
 * /tests:
 *   get:
 *     summary: Get a list of all medical tests
 *     description: Returns all active medical tests with basic information
 *     tags: [Tests]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by test name or test code
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of tests to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of medical tests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestListResponse'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /tests/{id}:
 *   get:
 *     summary: Get details of a specific medical test by ID
 *     description: Returns complete information about a specific medical test
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Medical test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestDetailResponse'
 *       400:
 *         description: Bad request - invalid test ID
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /tests/code/{testCode}:
 *   get:
 *     summary: Get test details by test code
 *     description: Returns test information using the unique test code
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: testCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Test code (e.g., CBC01)
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestDetailResponse'
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */

module.exports = router;