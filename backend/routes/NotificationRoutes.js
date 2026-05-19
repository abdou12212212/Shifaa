const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const authenticateToken = require('../middlewares/AuthMiddleware');

// Auth middleware (can be commented for testing)
// router.use(authenticateToken);

// ============= Notification Routes =============
router.get('/user/:userId', NotificationController.UserNotification);
router.put('/:id/read', NotificationController.ReadNotification);

console.log('[NOTIFICATION ROUTES] Routes registered successfully');


/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API endpoints for managing user notifications
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         notification_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         type:
 *           type: string
 *           enum: [Appointment, Result, Payment, System]
 *         is_read:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *     UnreadCount:
 *       type: object
 *       properties:
 *         unread_count:
 *           type: integer
 */

/**
 * @swagger
 * /notifications/user/{userId}:
 *   get:
 *     summary: Get notifications for a specific user by user ID
 *     description: Returns all notifications for a user, with options to filter by read/unread status
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: only_unread
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, returns only unread notifications
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of notifications to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: User notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 unread_count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - invalid user ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a specific notification as read by notification ID
 *     description: Updates the is_read status of a notification to true
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
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
 *         description: Bad request - invalid notification ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /notifications/user/{userId}/read-all:
 *   put:
 *     summary: Mark all notifications as read for a user
 *     description: Marks all unread notifications for a specific user as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updated_count:
 *                   type: integer
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a specific notification
 *     description: Removes a notification from the database
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */

module.exports = router;