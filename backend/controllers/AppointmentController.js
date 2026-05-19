// ============================================================
// FILE: AppointmentController.js
// ============================================================

const pool = require('../config/db');
const path = require('path');

// ============================================================
// ==================== APPOINTMENT MANAGEMENT ====================
// ============================================================

/**
 * @route POST /api/appointments
 * @desc Create a new appointment with full details
 */
const CreateAppointment = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/appointments', {
    body: req.body,
    file: req.file ? req.file.filename : null
  });

  const {
    doctor_id,
    patient_id,
    patient_name,
    patient_phone,
    appointment_datetime,
    address_line1,
    address_line2,
    city,
    total_cost,
    test_id,
    payment_method,
    is_urgent,
    patient_notes,
    lab_notes
  } = req.body;

  const testImage = req.file ? `/uploads/test-results/${req.file.filename}` : null;

  // Normalize test_id to array
  let testIds = [];
  if (test_id) {
    if (Array.isArray(test_id)) {
      testIds = test_id.filter(id => id && id !== '');
    } else if (test_id !== '' && test_id !== null) {
      testIds = [test_id];
    }
  }

  // Validation
  if (!patient_name || !patient_phone || !appointment_datetime || !address_line1) {
    return res.status(400).json({
      success: false,
      msg: 'Missing required fields. Patient name, phone, appointment date/time, and address are required.'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Handle patient creation/retrieval
    let finalPatientId = patient_id && patient_id !== '' ? parseInt(patient_id) : null;

    if (!finalPatientId) {
      const [existingUsers] = await connection.query(
        `SELECT user_id FROM Users WHERE phone_number = ? AND user_type = 'Patient'`,
        [patient_phone]
      );

      if (existingUsers.length > 0) {
        finalPatientId = existingUsers[0].user_id;
        console.log('[CreateAppointment] Existing patient found:', finalPatientId);
      } else {
        const [userResult] = await connection.query(
          `INSERT INTO Users (full_name, phone_number, user_type, is_active, created_at)
           VALUES (?, ?, 'Patient', TRUE, NOW())`,
          [patient_name, patient_phone]
        );
        finalPatientId = userResult.insertId;

        await connection.query(
          `INSERT INTO Patients (patient_id) VALUES (?)`,
          [finalPatientId]
        );
        console.log('[CreateAppointment] New patient created:', finalPatientId);
      }
    }

    // 2. Create address for this appointment
    const [addressResult] = await connection.query(
      `INSERT INTO Addresses (patient_id, address_line1, address_line2, city, is_default)
       VALUES (?, ?, ?, ?, ?)`,
      [finalPatientId, address_line1, address_line2 || null, city || null, false]
    );
    const addressId = addressResult.insertId;

    // 3. Calculate total cost from selected tests
    let calculatedTotalCost = parseFloat(total_cost) || 0;

    if (testIds.length > 0) {
      const placeholders = testIds.map(() => '?').join(',');
      const [testResults] = await connection.query(
        `SELECT test_id, price FROM Medical_Tests WHERE test_id IN (${placeholders}) AND is_active = TRUE`,
        testIds
      );

      if (testResults.length > 0) {
        calculatedTotalCost = testResults.reduce((sum, test) => {
          return sum + parseFloat(test.price || 0);
        }, 0);
      }
    }

    // 4. Create appointment reference ID
    const refId = `#${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 1000)}`;

    // 5. Convert ISO datetime to MySQL format
    const mysqlDatetime = new Date(appointment_datetime).toISOString().slice(0, 19).replace('T', ' ');

    // 6. Determine initial status based on appointment date
    const appointmentDate = new Date(mysqlDatetime);
    const now = new Date();
    let initialStatus;

    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (appointmentDate < now - oneDayInMs) {
      // Appointment is more than 1 day in the past
      initialStatus = 'Completed';
      console.log('[CreateAppointment] Past appointment (more than 1 day) → Status: Completed');
    } else {
      // All other appointments (future or today) go to "Pending Confirmation" tab
      initialStatus = 'Pending Confirmation';
      console.log('[CreateAppointment] Future/Today appointment → Status: Pending Confirmation');
    }


console.log('[CreateAppointment] DEBUG - Date difference in days:', (appointmentDate - now) / (1000 * 60 * 60 * 24));
console.log('[CreateAppointment] DEBUG - Is past more than 1 day?', appointmentDate < now - oneDayInMs);

    // 7. Insert into Appointments table
    const [appointmentResult] = await connection.query(
      `INSERT INTO Appointments (
        appointment_ref_id,
        patient_id,
        doctor_id,
        address_id,
        appointment_datetime,
        status,
        payment_method,
        total_cost,
        is_urgent,
        patient_notes,
        lab_notes,
        test_image_url,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        refId,
        finalPatientId,
        doctor_id && doctor_id !== '' ? parseInt(doctor_id) : null,
        addressId,
        mysqlDatetime,
        initialStatus,
        payment_method || 'Not Selected',
        calculatedTotalCost,
        is_urgent === 'true' || is_urgent === true || false,
        patient_notes || null,
        lab_notes || null,
        testImage
      ]
    );
    const appointmentId = appointmentResult.insertId;

    // 8. Insert into Appointment_Tests table
    if (testIds.length > 0) {
      const testValues = testIds.map(testId => [appointmentId, parseInt(testId)]);
      await connection.query(
        'INSERT INTO Appointment_Tests (appointment_id, test_id) VALUES ?',
        [testValues]
      );
    }

    await connection.commit();

    // Fetch complete appointment data
    const [newAppointment] = await pool.query(
      `SELECT 
        a.*,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name,
        addr.address_line1,
        addr.address_line2,
        addr.city,
        GROUP_CONCAT(mt.test_name SEPARATOR ', ') as test_names
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE a.appointment_id = ?
       GROUP BY a.appointment_id`,
      [appointmentId]
    );

    res.status(201).json({
      success: true,
      msg: 'Appointment created successfully',
      data: newAppointment[0] || {
        appointmentId,
        appointmentRefId: refId,
        totalCost: calculatedTotalCost,
        status: initialStatus
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('[CreateAppointment Error]', err);
    res.status(500).json({
      success: false,
      msg: 'Server error while creating appointment',
      error: err.message
    });
  } finally {
    connection.release();
  }
};

/**
 * @route GET /api/appointments/:id
 * @desc Get appointment details with tests and results
 */
const AppointmentDetails = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, msg: 'Appointment ID is required' });
  }

  try {
    const [appointments] = await pool.query(
      `SELECT 
        a.*,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        p.date_of_birth,
        p.gender,
        d.full_name as doctor_name,
        doc.specialization as doctor_specialization,
        doc.clinic_address as doctor_clinic,
        asst.full_name as assistant_name,
        addr.address_id,
        addr.address_line1,
        addr.address_line2,
        addr.city,
        addr.state,
        CONCAT(addr.address_line1, ' ', IFNULL(addr.address_line2, ''), ', ', addr.city) as full_address
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Assistants ass ON a.assistant_id = ass.assistant_id
       LEFT JOIN Users asst ON ass.assistant_id = asst.user_id
       JOIN Addresses addr ON a.address_id = addr.address_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ success: false, msg: 'Appointment not found' });
    }

    const appointment = appointments[0];

    const [tests] = await pool.query(
      `SELECT 
        mt.test_id,
        mt.test_code,
        mt.test_name,
        mt.description,
        mt.price,
        mt.sample_type,
        mt.container_type,
        mt.turnaround_time,
        mt.result_turnaround_time,
        mt.pre_test_instructions,
        mt.normal_range,
        mt.unit
       FROM Appointment_Tests at
       JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE at.appointment_id = ?`,
      [id]
    );

    const [results] = await pool.query(
      `SELECT 
        tr.result_id,
        tr.test_id,
        tr.result_file_url,
        tr.result_data,
        tr.result_value,
        tr.is_normal,
        tr.notes as result_notes,
        tr.uploaded_at,
        mt.test_name,
        mt.test_code
       FROM Test_Results tr
       LEFT JOIN Medical_Tests mt ON tr.test_id = mt.test_id
       WHERE tr.appointment_id = ?`,
      [id]
    );

    const [history] = await pool.query(
      `SELECT 
        ah.history_id,
        ah.old_status,
        ah.new_status,
        ah.changed_at,
        ah.notes,
        changer.full_name as changed_by_name
       FROM Appointment_History ah
       LEFT JOIN Users changer ON ah.changed_by = changer.user_id
       WHERE ah.appointment_id = ?
       ORDER BY ah.changed_at DESC`,
      [id]
    );

    const now = new Date();
    const appointmentDate = new Date(appointment.appointment_datetime);
    let category = 'programmed';
    
    if (results.length > 0) {
      category = 'results';
    } else if (appointmentDate < now) {
      category = 'old';
    } else if ((appointmentDate - now) < 24 * 60 * 60 * 1000) {
      category = 'coming';
    }

    res.json({
      success: true,
      data: {
        ...appointment,
        category,
        tests,
        results,
        history,
        testsCount: tests.length,
        resultsCount: results.length
      }
    });
  } catch (err) {
    console.error('[AppointmentDetails Error]', err);
    res.status(500).json({ success: false, msg: 'Server error while fetching appointment' });
  }
};

/**
 * @route PUT /api/appointments/:id/cancel
 * @desc Cancel an appointment
 */
const CancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, msg: 'Appointment ID is required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [oldAppointment] = await connection.query(
      'SELECT status, patient_id FROM Appointments WHERE appointment_id = ?',
      [id]
    );

    if (oldAppointment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Appointment not found' });
    }

    await connection.query(
      'UPDATE Appointments SET status = ? WHERE appointment_id = ?',
      ['Cancelled', id]
    );

    await connection.query(
      `INSERT INTO Appointment_History (appointment_id, old_status, new_status, notes, changed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, oldAppointment[0].status, 'Cancelled', reason || 'Cancelled by user']
    );

    await connection.query(
      `INSERT INTO Notifications (user_id, title, message, type, created_at)
       VALUES (?, ?, ?, 'Appointment', NOW())`,
      [
        oldAppointment[0].patient_id,
        'Appointment Cancelled',
        `Your appointment has been cancelled${reason ? ` because: ${reason}` : ''}. You can book a new appointment anytime.`
      ]
    );

    await connection.commit();

    res.json({ success: true, msg: 'Appointment cancelled successfully.' });
  } catch (err) {
    await connection.rollback();
    console.error('[CancelAppointment Error]', err);
    res.status(500).json({ success: false, msg: 'Server error while cancelling appointment' });
  } finally {
    connection.release();
  }
};

// ============================================================
// ================ APPOINTMENT FILTERS =================
// ============================================================

/**
 * @route GET /api/appointments/status/programmed
 * @desc Get programmed appointments (Pending Confirmation - future dates)
 */
const GetProgrammedAppointments = async (req, res) => {
  try {
    const now = new Date();
    const nowFormatted = now.toISOString().slice(0, 19).replace('T', ' ');

    const [appointments] = await pool.query(
      `SELECT 
        a.appointment_id,
        a.appointment_ref_id,
        a.appointment_datetime,
        a.status,
        a.total_cost,
        a.payment_method,
        a.is_urgent,
        a.created_at,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name,
        addr.address_line1,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE a.status = 'Pending Confirmation'
         AND a.appointment_datetime > ?
       GROUP BY a.appointment_id
       ORDER BY a.appointment_datetime ASC`,
      [nowFormatted]
    );

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    console.error('[GetProgrammedAppointments Error]', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * @route GET /api/appointments/status/coming
 * @desc Get upcoming appointments ONLY (future appointments that are not completed/cancelled)
 */
const GetComingAppointments = async (req, res) => {
  try {
    const now = new Date();
    const nowFormatted = now.toISOString().slice(0, 19).replace('T', ' ');

    console.log('[GetComingAppointments] Current time:', nowFormatted);

    const [appointments] = await pool.query(
      `SELECT 
        a.appointment_id,
        a.appointment_ref_id,
        a.appointment_datetime,
        a.status,
        a.total_cost,
        a.payment_method,
        a.is_urgent,
        a.created_at,
        a.patient_notes,
        a.lab_notes,
        a.assistant_id,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name,
        ass.full_name as assistant_name,
        addr.address_line1,
        addr.address_line2,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Assistants ast ON a.assistant_id = ast.assistant_id
       LEFT JOIN Users ass ON ast.assistant_id = ass.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE a.status IN ('Upcoming', 'In Progress')
         AND a.appointment_datetime > ?
         AND a.status NOT IN ('Completed', 'Cancelled', 'Pending Confirmation')
       GROUP BY a.appointment_id
       ORDER BY a.appointment_datetime ASC`,
      [nowFormatted]
    );

    console.log(`[GetComingAppointments] Found ${appointments.length} upcoming appointments`);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    console.error('[GetComingAppointments Error]', err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

/**
 * @route GET /api/appointments/status/old
 * @desc Get past appointments (completed and cancelled - regardless of date)
 */
const GetOldAppointments = async (req, res) => {
  try {
    const [appointments] = await pool.query(
      `SELECT 
        a.appointment_id,
        a.appointment_ref_id,
        a.appointment_datetime,
        a.status,
        a.total_cost,
        a.payment_method,
        a.is_urgent,
        a.created_at,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name,
        addr.address_line1,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names,
        (SELECT COUNT(*) FROM Test_Results WHERE appointment_id = a.appointment_id) as has_results
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE a.status IN ('Completed', 'Cancelled')
       GROUP BY a.appointment_id
       ORDER BY a.appointment_datetime DESC`,
      []
    );

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    console.error('[GetOldAppointments Error]', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
/**
 * @route GET /api/appointments/doctor/:doctorId
 * @desc Get appointments by doctor ID with full details
 */
const GetDoctorAppointments = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const [appointments] = await pool.query(
      `SELECT 
        a.*,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        addr.address_line1,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names,
        (SELECT COUNT(*) FROM Test_Results WHERE appointment_id = a.appointment_id) as has_results
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE a.doctor_id = ?
       GROUP BY a.appointment_id
       ORDER BY a.appointment_datetime DESC`,
      [doctorId]
    );

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'Pending Confirmation' THEN 1 ELSE 0 END) as pending
       FROM Appointments WHERE doctor_id = ?`,
      [doctorId]
    );

    res.json({
      success: true,
      count: appointments.length,
      stats: stats[0],
      data: appointments
    });
  } catch (err) {
    console.error('[GetDoctorAppointments Error]', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * @route GET /api/appointments/patient/:patientId
 * @desc Get appointments by patient ID with full details
 */
const GetPatientAppointments = async (req, res) => {
  const { patientId } = req.params;

  try {
    const [appointments] = await pool.query(
      `SELECT 
        a.*,
        d.full_name as doctor_name,
        doc.specialization as doctor_specialization,
        addr.address_line1,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names,
        (SELECT COUNT(*) FROM Test_Results WHERE appointment_id = a.appointment_id) as has_results,
        (SELECT result_file_url FROM Test_Results WHERE appointment_id = a.appointment_id LIMIT 1) as result_file
       FROM Appointments a
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE a.patient_id = ?
       GROUP BY a.appointment_id
       ORDER BY a.appointment_datetime DESC`,
      [patientId]
    );

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'Pending Confirmation' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Completed' THEN total_cost ELSE 0 END) as total_spent
       FROM Appointments WHERE patient_id = ?`,
      [patientId]
    );

    res.json({
      success: true,
      count: appointments.length,
      stats: stats[0],
      data: appointments
    });
  } catch (err) {
    console.error('[GetPatientAppointments Error]', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * @route GET /api/appointments/date-range
 * @desc Get appointments within date range
 */
const GetAppointmentsByDateRange = async (req, res) => {
  const { startDate, endDate, status } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ 
      success: false, 
      msg: 'Start date and end date are required' 
    });
  }

  try {
    let statusFilter = '';
    let queryParams = [startDate, endDate];
    
    if (status && status !== 'all') {
      statusFilter = ' AND a.status = ?';
      queryParams.push(status);
    }

    const [appointments] = await pool.query(
      `SELECT 
        a.*,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name,
        addr.address_line1,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       WHERE DATE(a.appointment_datetime) BETWEEN ? AND ?
         ${statusFilter}
       GROUP BY a.appointment_id
       ORDER BY a.appointment_datetime ASC`,
      queryParams
    );

    const [summary] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(total_cost) as total_revenue,
        AVG(total_cost) as avg_cost,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed
       FROM Appointments a
       WHERE DATE(a.appointment_datetime) BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    res.json({
      success: true,
      count: appointments.length,
      summary: summary[0],
      data: appointments
    });
  } catch (err) {
    console.error('[GetAppointmentsByDateRange Error]', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * @route GET /api/appointments/stats/all
 * @desc Get all appointments statistics
 */
const GetAllAppointmentsStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending Confirmation' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Upcoming' THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'Completed' THEN total_cost ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'Completed' THEN total_cost ELSE NULL END) as avg_revenue
       FROM Appointments`
    );

    const [monthlyStats] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(total_cost) as revenue
       FROM Appointments
       WHERE status = 'Completed'
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`
    );

    res.json({
      success: true,
      data: {
        ...stats[0],
        monthlyStats
      }
    });
  } catch (err) {
    console.error('[GetAllAppointmentsStats Error]', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

// ============================================================
// ==================== RESULTS MANAGEMENT ====================
// ============================================================

/**
 * @route GET /api/appointments/status/results
 * @desc Get appointments with test results (completed with results)
 */
const GetAppointmentsWithResults = async (req, res) => {
  try {
    const [appointments] = await pool.query(
      `SELECT DISTINCT 
        a.appointment_id,
        a.appointment_ref_id,
        a.appointment_datetime,
        a.status,
        a.total_cost,
        a.payment_method,
        a.is_urgent,
        a.created_at,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name,
        addr.address_line1,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names,
        COUNT(DISTINCT tr.result_id) as results_count,
        MAX(tr.uploaded_at) as last_result_date
       FROM Appointments a
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       LEFT JOIN Addresses addr ON a.address_id = addr.address_id
       LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
       INNER JOIN Test_Results tr ON a.appointment_id = tr.appointment_id
       WHERE a.status = 'Completed'
       GROUP BY a.appointment_id
       ORDER BY tr.uploaded_at DESC`
    );

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    console.error('[GetAppointmentsWithResults Error]', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/**
 * @route POST /api/appointments/:id/results
 * @desc Add test results to an appointment
 */
const AddResults = async (req, res) => {
  console.log('[AddResults] ========== START ==========');
  console.log('[AddResults] req.params:', req.params);
  console.log('[AddResults] req.body:', req.body);
  console.log('[AddResults] req.file:', req.file);
  
  const { id } = req.params;
  const { test_id, result_value, is_normal, notes } = req.body;
  
  // ✅ الملف يأتي من multer كـ req.file
  const resultFile = req.file ? `/uploads/test-results/${req.file.filename}` : null;

  // التحقق من وجود البيانات المطلوبة
  if (!id) {
    console.log('[AddResults] ERROR: No appointment ID');
    return res.status(400).json({ success: false, msg: 'Appointment ID is required' });
  }

  if (!test_id) {
    console.log('[AddResults] ERROR: No test_id, body:', req.body);
    return res.status(400).json({ 
      success: false, 
      msg: 'Test ID is required',
      receivedBody: req.body 
    });
  }

  if (!resultFile) {
    console.log('[AddResults] ERROR: No file, req.file:', req.file);
    return res.status(400).json({ 
      success: false, 
      msg: 'Result file is required',
      fileReceived: !!req.file
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log('[AddResults] Inserting result for appointment:', id, 'test:', test_id);

    // إدراج النتيجة في قاعدة البيانات
    const [resultInsert] = await connection.query(
      `INSERT INTO Test_Results (appointment_id, test_id, result_file_url, result_value, is_normal, notes, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, test_id, resultFile, result_value || null, is_normal || null, notes || null]
    );

    console.log('[AddResults] Result inserted, ID:', resultInsert.insertId);

    // التحقق من اكتمال جميع التحاليل
    const [tests] = await connection.query(
      `SELECT COUNT(*) as total_tests FROM Appointment_Tests WHERE appointment_id = ?`,
      [id]
    );

    const [results] = await connection.query(
      `SELECT COUNT(*) as completed_tests FROM Test_Results WHERE appointment_id = ?`,
      [id]
    );

    let newStatus = null;
    let allCompleted = false;
    
    if (results[0].completed_tests === tests[0].total_tests && tests[0].total_tests > 0) {
      await connection.query(
        `UPDATE Appointments SET status = ? WHERE appointment_id = ?`,
        ['Completed', id]
      );
      newStatus = 'Completed';
      allCompleted = true;
      console.log('[AddResults] All tests completed, status updated to Completed');
    }

    const [appointment] = await connection.query(
      'SELECT patient_id FROM Appointments WHERE appointment_id = ?',
      [id]
    );
    
    if (appointment.length > 0) {
      await connection.query(
        `INSERT INTO Notifications (user_id, title, message, type, created_at)
         VALUES (?, ?, ?, 'Result', NOW())`,
        [
          appointment[0].patient_id,
          'نتائج التحاليل متاحة',
          'تم إضافة نتائج تحاليلك. يمكنك عرضها في حسابك.'
        ]
      );
    }

    await connection.commit();

    console.log('[AddResults] ========== SUCCESS ==========');

    res.status(201).json({ 
      success: true, 
      msg: allCompleted ? 'تم رفع جميع النتائج. تم تغيير حالة الموعد إلى مكتمل.' : 'تم رفع النتيجة بنجاح',
      data: {
        resultId: resultInsert.insertId,
        fileUrl: resultFile,
        appointmentStatus: newStatus
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('[AddResults] ERROR:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server error while uploading result', 
      error: err.message 
    });
  } finally {
    connection.release();
  }
};

/**
 * @route GET /api/appointments/:id/results/:resultId
 * @desc Get specific result details
 */
const GetResultDetails = async (req, res) => {
  const { id, resultId } = req.params;

  if (!id || !resultId) {
    return res.status(400).json({ success: false, msg: 'Appointment ID and Result ID are required' });
  }

  try {
    const [results] = await pool.query(
      `SELECT 
        tr.*,
        mt.test_name,
        mt.test_code,
        mt.normal_range,
        mt.unit,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name
       FROM Test_Results tr
       JOIN Medical_Tests mt ON tr.test_id = mt.test_id
       JOIN Appointments a ON tr.appointment_id = a.appointment_id
       JOIN Patients p ON a.patient_id = p.patient_id
       JOIN Users u ON p.patient_id = u.user_id
       LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
       LEFT JOIN Users d ON doc.doctor_id = d.user_id
       WHERE tr.appointment_id = ? AND tr.result_id = ?`,
      [id, resultId]
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, msg: 'Result not found' });
    }

    res.json({
      success: true,
      data: results[0]
    });
  } catch (err) {
    console.error('[GetResultDetails Error]', err);
    res.status(500).json({ success: false, msg: 'Server error while fetching result' });
  }
};

/**
 * @route DELETE /api/appointments/:id/results/:resultId
 * @desc Delete a test result
 */
const DeleteResult = async (req, res) => {
  const { id, resultId } = req.params;

  if (!id || !resultId) {
    return res.status(400).json({ success: false, msg: 'Appointment ID and Result ID are required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'SELECT test_id FROM Test_Results WHERE result_id = ? AND appointment_id = ?',
      [resultId, id]
    );

    if (result.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Result not found' });
    }

    await connection.query(
      'DELETE FROM Test_Results WHERE result_id = ?',
      [resultId]
    );

    // Update appointment status if needed
    const [remainingResults] = await connection.query(
      'SELECT COUNT(*) as count FROM Test_Results WHERE appointment_id = ?',
      [id]
    );

    if (remainingResults[0].count === 0) {
      await connection.query(
        'UPDATE Appointments SET status = ? WHERE appointment_id = ?',
        ['Completed', id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      msg: 'Result deleted successfully'
    });
  } catch (err) {
    await connection.rollback();
    console.error('[DeleteResult Error]', err);
    res.status(500).json({ success: false, msg: 'Server error while deleting result' });
  } finally {
    connection.release();
  }
};

// ============================================================
// ==================== EXPORT MODULES ====================
// ============================================================

module.exports = {
  // Appointment Management
  CreateAppointment,
  AppointmentDetails,
  CancelAppointment,
  
  // Appointment Filters
  GetProgrammedAppointments,
  GetComingAppointments,
  GetOldAppointments,
  GetDoctorAppointments,
  GetPatientAppointments,
  GetAppointmentsByDateRange,
  GetAllAppointmentsStats,
  
  // Results Management
  GetAppointmentsWithResults,
  AddResults,
  GetResultDetails,
  DeleteResult
};

