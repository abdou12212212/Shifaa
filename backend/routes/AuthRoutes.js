const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController')

router.post('/register', AuthController.Register)
router.post('/login',  AuthController.Login)
router.post('/forgot-password', AuthController.ForgetPassword)
router.post('/verify-reset-code', AuthController.VerifyResetCode);
router.post('/reset-password', AuthController.ResetPassword); 


module.exports = router