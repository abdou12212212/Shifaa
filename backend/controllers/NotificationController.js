const pool = require('../config/db');


/**
 * @route GET /api/notifications/user/:userId
 * @desc Get all notifications for a user
 * @access Private
 */
const UserNotification = async (req, res) => {
  console.log('[API REQUEST]', 'GET', '/api/notifications/user/:userId', {
    params: req.params,
    query: req.query,
    user: req.user
  });

  const { userId } = req.params;

  if (!userId) {
    console.log('[API ERROR]', 'GET', '/api/notifications/user/:userId', 'Missing user ID');
    return res.status(400).json({ msg: 'User ID is required' });
  }

  try {
    console.log('[API DB QUERY]', 'Fetching user notifications', { userId });

    const [notifications] = await pool.query(
      `SELECT notification_id, title, message, created_at FROM Notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    console.log('[API SUCCESS]', 'GET', '/api/notifications/user/:userId', {
      userId,
      notificationCount: notifications.length,
      status: 200
    });

    res.json(notifications);
  } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/notifications/user/:userId', {
      error: err.message,
      stack: err.stack,
      status: 500,
      userId
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error while fetching notifications' });
  }
};

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
const ReadNotification = async (req, res) => {
  console.log('[API REQUEST]', 'PUT', '/api/notifications/:id/read', {
    params: req.params,
    query: req.query,
    user: req.user
  });

  const { id } = req.params;

  if (!id) {
    console.log('[API ERROR]', 'PUT', '/api/notifications/:id/read', 'Missing notification ID');
    return res.status(400).json({ msg: 'Notification ID is required' });
  }

  try {
    console.log('[API DB QUERY]', 'Marking notification as read', { notificationId: id });

    await pool.query(
      'UPDATE Notifications SET is_read = 1 WHERE notification_id = ?',
      [id]
    );

    console.log('[API SUCCESS]', 'PUT', '/api/notifications/:id/read', {
      notificationId: id,
      status: 200
    });

    res.json({ msg: 'Notification marked as read.' });
  } catch (err) {
    console.log('[API ERROR]', 'PUT', '/api/notifications/:id/read', {
      error: err.message,
      stack: err.stack,
      status: 500,
      notificationId: id
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error while updating notification' });
  }
};

module.exports = {
  UserNotification,
  ReadNotification,
}