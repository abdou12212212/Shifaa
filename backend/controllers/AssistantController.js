const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';



/**
 * @route GET /api/assistants/:id
 * @desc Get assistant profile
 * @access Private (Assistant only)
 */
const AssistantProfile = async (req, res) => {
  console.log('[API REQUEST]', 'GET', '/api/assistants/:id', {
    params: req.params,
    query: req.query,
    user: {
      id: req.user.id,
      userType: req.user.userType
    }
  });

  const { id } = req.params;

  if (req.user.id != id || req.user.userType !== 'Assistant') {
    console.log('[API ERROR]', 'GET', '/api/assistants/:id', 'Access denied', {
      requestedId: id,
      userId: req.user.id,
      userType: req.user.userType
    });
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.full_name, u.phone_number
       FROM Users u
       INNER JOIN Assistants a ON u.user_id = a.assistant_id
       WHERE u.user_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      console.log('[API ERROR]', 'GET', '/api/assistants/:id', 'Assistant not found', { assistantId: id });
      return res.status(404).json({ msg: 'Assistant not found' });
    }

    console.log('[API SUCCESS]', 'GET', '/api/assistants/:id', {
      assistantId: id,
      status: 200
    });

    res.json(rows[0]);
  } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/assistants/:id', {
      error: err.message,
      stack: err.stack,
      status: 500,
      assistantId: id
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * @route GET /api/assistants/:id/appointments
 * @desc Get all appointments assigned to an assistant
 * @access Private (Assistant only)
 */
const AssistantAppointments = async (req, res) => {
  console.log('[API REQUEST]', 'GET', '/api/assistants/:id/appointments', {
    params: req.params,
    query: req.query,
    user: {
      id: req.user.id,
      userType: req.user.userType
    }
  });

  const { id } = req.params;

  if (req.user.id != id || req.user.userType !== 'Assistant') {
    console.log('[API ERROR]', 'GET', '/api/assistants/:id/appointments', 'Access denied', {
      requestedId: id,
      userId: req.user.id,
      userType: req.user.userType
    });
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const [appointments] = await pool.query(
      `SELECT ap.appointment_id, p.full_name AS patient_name, ap.address, ap.appointment_datetime, ap.status
       FROM Appointments ap
       JOIN Users p ON ap.patient_id = p.user_id
       WHERE ap.assistant_id = ?
       ORDER BY ap.appointment_datetime DESC`,
      [id]
    );

    console.log('[API SUCCESS]', 'GET', '/api/assistants/:id/appointments', {
      assistantId: id,
      appointmentCount: appointments.length,
      status: 200
    });

    res.json(appointments);
  } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/assistants/:id/appointments', {
      error: err.message,
      stack: err.stack,
      status: 500,
      assistantId: id
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  AssistantAppointments,
  AssistantProfile
};
