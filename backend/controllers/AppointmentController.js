const pool = require('../config/db');

/**
 * @route POST /api/appointments
 * @desc Create a new appointment
 * @access Private (Admin/Staff)
 */
const CreateAppointment = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/appointments', {
    body: req.body,
    query: req.query,
    params: req.params
  });

  const {
    patient_id,
    patient_name,
    patient_phone,
    doctor_id,
    doctor_name,
    doctor_phone,
    appointment_datetime,
    address_line1,
    address_line2,
    city,
    total_cost,
    test_id, // Can be single ID or array of IDs
    assistant_id,
    payment_method,
    is_urgent,
    patient_notes,
    lab_notes,
    appointment_ref_id,
  } = req.body;

  // Normalize test_id to array
  const testIds = test_id
    ? (Array.isArray(test_id) ? test_id : [test_id])
    : [];

  // Validation
  if (!patient_name || !patient_phone || !appointment_datetime || !address_line1) {
    console.log('[API ERROR]', 'POST', '/api/appointments', 'Missing required fields', {
      patient_name: !!patient_name,
      patient_phone: !!patient_phone,
      appointment_datetime: !!appointment_datetime,
      address_line1: !!address_line1
    });
    return res.status(400).json({
      success: false,
      msg: 'Missing required fields. Patient name, phone, appointment date/time, and address are required.'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Handle patient creation/retrieval
    let patientId = patient_id;

    if (!patientId) {
      // Check if patient exists by phone number
      const [existingPatients] = await connection.query(
        'SELECT patient_id FROM Patients WHERE phone_number = ?',
        [patient_phone]
      );

      if (existingPatients.length > 0) {
        patientId = existingPatients[0].patient_id;
      } else {
        // Create new patient (assuming you have a Users table)
        // For now, we'll just use the patient_id if provided or skip patient creation
        console.log('[API INFO]', 'Patient ID not provided and patient not found', { patient_phone });
      }
    }

    // 2. Create address for this appointment
    const [addressResult] = await connection.query(
      `INSERT INTO Addresses (patient_id, address_line1, address_line2, city, is_default)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId || null, address_line1, address_line2 || null, city || null, false]
    );
    const addressId = addressResult.insertId;

    // 3. Calculate total cost from selected tests
    let calculatedTotalCost = parseFloat(total_cost) || 0;

    if (testIds.length > 0) {
      // Get prices for all selected tests
      const placeholders = testIds.map(() => '?').join(',');
      const [testResults] = await connection.query(
        `SELECT test_id, price FROM Medical_Tests WHERE test_id IN (${placeholders})`,
        testIds
      );

      // Sum up all test prices
      if (testResults.length > 0) {
        calculatedTotalCost = testResults.reduce((sum, test) => {
          return sum + parseFloat(test.price || 0);
        }, 0);
      }
    }

    // 4. Create appointment reference ID
    const refId = appointment_ref_id || `#${Date.now().toString().slice(-10)}`;

    // 5. Convert ISO datetime to MySQL format (YYYY-MM-DD HH:MM:SS)
    const mysqlDatetime = new Date(appointment_datetime)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    // 6. Insert into Appointments table with all fields
    const [appointmentResult] = await connection.query(
      `INSERT INTO Appointments (
        appointment_ref_id,
        patient_id,
        doctor_id,
        assistant_id,
        address_id,
        appointment_datetime,
        status,
        payment_method,
        total_cost,
        is_urgent,
        patient_notes,
        lab_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        refId,
        patientId || null,
        doctor_id || null,
        assistant_id || null,
        addressId,
        mysqlDatetime,
        'Pending Confirmation', // Default status for new appointments
        payment_method || 'Not Selected',
        calculatedTotalCost,
        is_urgent || false,
        patient_notes || null,
        lab_notes || null
      ]
    );
    const appointmentId = appointmentResult.insertId;

    // 7. Insert into Appointment_Tests table for all selected tests
    if (testIds.length > 0) {
      // Insert multiple test records
      const testValues = testIds.map(testId => [appointmentId, testId]);
      await connection.query(
        'INSERT INTO Appointment_Tests (appointment_id, test_id) VALUES ?',
        [testValues]
      );
    }

    await connection.commit();

    console.log('[API SUCCESS]', 'POST', '/api/appointments', {
      appointmentId,
      appointmentRefId: refId,
      totalCost: calculatedTotalCost,
      addressId,
      status: 201
    });

    res.status(201).json({
      success: true,
      msg: 'Appointment created successfully',
      data: {
        appointmentId,
        appointmentRefId: refId,
        totalCost: calculatedTotalCost
      }
    });
  } catch (err) {
    await connection.rollback();

    console.log('[API ERROR]', 'POST', '/api/appointments', {
      error: err.message,
      stack: err.stack,
      status: 500
    });
    console.error(err);
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
 * @desc Get details of a specific appointment
 * @access Private
 */
const AppointmentDetails = async (req, res) => {
  console.log('[API REQUEST]', 'GET', '/api/appointments/:id', {
    params: req.params,
    query: req.query
  });

  const { id } = req.params;

  if (!id) {
    console.log('[API ERROR]', 'GET', '/api/appointments/:id', 'Missing appointment ID');
    return res.status(400).json({ msg: 'Appointment ID is required' });
  }

  try {
    console.log('[API DB QUERY]', 'Fetching appointment details', { appointmentId: id });
    const [[appointment]] = await pool.query(
      `SELECT a.*, CONCAT(ad.address_line1, ', ', ad.address_line2, ', ', ad.city) AS address
       FROM Appointments a
       JOIN Addresses ad ON a.address_id = ad.address_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    const [tests] = await pool.query(
      `SELECT t.test_code, t.test_name FROM Appointment_Tests at
      JOIN Medical_Tests t ON at.test_id = t.test_id WHERE at.appointment_id = ?`,
      [id]
    );


    if (!appointment) {
      console.log('[API ERROR]', 'GET', '/api/appointments/:id', 'Appointment not found', { appointmentId: id });
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    console.log('[API SUCCESS]', 'GET', '/api/appointments/:id', {
      appointmentId: id,
      testCount: tests.length,
      status: 200
    });

    res.json({ ...appointment, tests });
  } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/appointments/:id', {
      error: err.message,
      stack: err.stack,
      status: 500,
      appointmentId: id
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error while fetching appointment' });
  }
};

/**
 * @route PUT /api/appointments/:id/cancel
 * @desc Cancel an appointment
 * @access Private
 */
const CancelAppointment = async (req, res) => {
  console.log('[API REQUEST]', 'PUT', '/api/appointments/:id/cancel', {
    params: req.params,
    query: req.query
  });

  const { id } = req.params;

  if (!id) {
    console.log('[API ERROR]', 'PUT', '/api/appointments/:id/cancel', 'Missing appointment ID');
    return res.status(400).json({ msg: 'Appointment ID is required' });
  }

  try {
    const [result] = await pool.query('UPDATE Appointments SET status = ? WHERE appointment_id = ?', ['Cancelled', id]);
    
    if (result.affectedRows === 0) {
      console.log('[API ERROR]', 'PUT', '/api/appointments/:id/cancel', 'Appointment not found', { appointmentId: id });
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    console.log('[API SUCCESS]', 'PUT', '/api/appointments/:id/cancel', {
      appointmentId: id,
      status: 200
    });

    res.json({ msg: 'Appointment cancelled successfully.' });
  } catch (err) {
    console.log('[API ERROR]', 'PUT', '/api/appointments/:id/cancel', {
      error: err.message,
      stack: err.stack,
      status: 500,
      appointmentId: id
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error while cancelling appointment' });
  }
};

/**
 * @route POST /api/appointments/:id/results
 * @desc Upload a test result PDF for an appointment
 * @access Private (Admin/Doctor)
 */
const Results = async (req, res) => {
  console.log('[API REQUEST]', 'POST', '/api/appointments/:id/results', {
    params: req.params,
    body: req.body,
    query: req.query
  });

  const { id } = req.params;
  const { testId, resultFileUrl } = req.body;

  if (!id) {
    console.log('[API ERROR]', 'POST', '/api/appointments/:id/results', 'Missing appointment ID');
    return res.status(400).json({ msg: 'Appointment ID is required' });
  }

  if (!testId || !resultFileUrl) {
    console.log('[API ERROR]', 'POST', '/api/appointments/:id/results', 'Missing required fields', {
      testId: !!testId,
      resultFileUrl: !!resultFileUrl
    });
    return res.status(400).json({ msg: 'Test ID and file URL are required' });
  }

  try {
    await pool.query(
      'INSERT INTO Test_Results (appointment_id, test_id, result_file_url) VALUES (?, ?, ?)',
      [id, testId, resultFileUrl]
    );
    res.status(201).json({ msg: 'Result uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error while uploading result' });
  }
};

module.exports = {
  CreateAppointment,
  AppointmentDetails,
  CancelAppointment,
  Results,
}
