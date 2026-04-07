const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController')
const authenticateToken = require('../middlewares/AuthMiddleware')


router.get('/user/:userId', NotificationController.UserNotification)
router.put('/:id/read', NotificationController.ReadNotification)


module.exports = router