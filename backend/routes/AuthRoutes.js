const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// ============= Authentication Routes =============
router.post('/register', AuthController.Register);
router.post('/login', AuthController.Login);
router.post('/forgot-password', AuthController.ForgetPassword);
router.post('/verify-reset-code', AuthController.VerifyResetCode);
router.post('/reset-password', AuthController.ResetPassword);
router.post('/set-password', AuthController.SetPassword);

console.log('[AUTH ROUTES] Routes registered successfully');



/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API endpoints for user authentication and password management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - phoneNumber
 *         - password
 *         - userType
 *       properties:
 *         fullName:
 *           type: string
 *           example: Ahmed Benali
 *         phoneNumber:
 *           type: string
 *           example: 0555123456
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *         userType:
 *           type: string
 *           enum: [Patient, Doctor, Assistant]
 *           example: Patient
 *     LoginRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - password
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: 0555123456
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             fullName:
 *               type: string
 *             userType:
 *               type: string
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: 0555123456
 *     VerifyResetCodeRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - code
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: 0555123456
 *         code:
 *           type: string
 *           example: 123456
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - newPassword
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: 0555123456
 *         newPassword:
 *           type: string
 *           format: password
 *           example: newpassword123
 *     SetPasswordRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - password
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: 0555123456
 *         password:
 *           type: string
 *           format: password
 *           example: mypassword123
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (Patient, Doctor, or Assistant)
 *     description: Creates a new user account and returns a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - missing fields or phone number already exists
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user and receive a JWT token
 *     description: Authenticates user with phone number and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - missing fields
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is deactivated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Initiate forgot password process
 *     description: Sends an OTP code via SMS to the registered phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset code sent successfully (if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *       400:
 *         description: Bad request - missing phone number
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     summary: Verify the OTP reset code
 *     description: Validates the OTP code sent to the user's phone
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyResetCodeRequest'
 *     responses:
 *       200:
 *         description: Code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Code verified. You can now reset your password.
 *       400:
 *         description: Bad request - missing fields
 *       401:
 *         description: Invalid code
 *       410:
 *         description: Code expired
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password after OTP verification
 *     description: Sets a new password for the user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Password has been reset successfully
 *       400:
 *         description: Bad request - missing fields or weak password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/set-password:
 *   post:
 *     summary: Set password for existing user without password
 *     description: For users created via appointment booking (no password set)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - missing fields, weak password, or password already set
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

module.exports = router;