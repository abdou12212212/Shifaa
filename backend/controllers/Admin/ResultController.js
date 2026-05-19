const db = require('../../config/db');

/**
 * Create a new result with appointment
 * If appointment exists, update it to Completed and add result
 * If not, create new appointment with Completed status
 */
exports.createResult = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      patient_id,
      patient_name,
      patient_phone,
      doctor_id,
      doctor_name,
      doctor_phone,
      test_id,
      test_name,
      test_code,
      analysis_date,
      analysis_price,
      result_file_url,
      appointment_ref_id
    } = req.body;

    const resultFileUrl = req.file ? `/uploads/test-results/${req.file.filename}` : result_file_url;

    console.log('[API REQUEST]', 'POST', '/api/admin/results/create');
    console.log('[REQUEST BODY]', JSON.stringify(req.body, null, 2));

    // Validate required fields
    const missingFields = [];
    if (!patient_id) missingFields.push('patient_id');
    if (!patient_name) missingFields.push('patient_name');
    if (!patient_phone) missingFields.push('patient_phone');
    if (!test_id) missingFields.push('test_id');
    if (!analysis_date) missingFields.push('analysis_date');
    if (!resultFileUrl) missingFields.push('result_file_url');

    if (missingFields.length > 0) {
      console.log('[VALIDATION ERROR] Missing fields:', missingFields);
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // 1. Handle patient creation/retrieval
    let finalPatientId = patient_id;
    
    if (!finalPatientId) {
      const [existingUsers] = await connection.query(
        `SELECT user_id FROM Users WHERE phone_number = ? AND user_type = 'Patient'`,
        [patient_phone]
      );

      if (existingUsers.length > 0) {
        finalPatientId = existingUsers[0].user_id;
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
      }
    }

    // 2. Check if appointment already exists for this patient and test (in Coming tab)
    const [existingAppointments] = await connection.query(
      `SELECT a.appointment_id, a.status 
       FROM Appointments a
       JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
       WHERE a.patient_id = ? AND at.test_id = ? 
         AND a.status IN ('Upcoming', 'In Progress', 'Pending Confirmation')
       ORDER BY a.appointment_datetime DESC LIMIT 1`,
      [finalPatientId, test_id]
    );

    let appointmentId;
    let movedFromComing = false;

    if (existingAppointments.length > 0) {
      // Appointment exists in Coming tab - update it to Completed
      appointmentId = existingAppointments[0].appointment_id;
      movedFromComing = true;
      
      console.log('[API INFO] Existing appointment found in Coming:', { 
        appointmentId, 
        oldStatus: existingAppointments[0].status 
      });
      
      // Update appointment status to Completed (moves from Coming to Old/Results)
      await connection.query(
        `UPDATE Appointments SET status = 'Completed' WHERE appointment_id = ?`,
        [appointmentId]
      );
    } else {
      // No existing appointment - create new one with Completed status
      console.log('[API INFO] No existing appointment found. Creating new one.');
      
      // Create address for this result/appointment
      const [addressResult] = await connection.query(
        `INSERT INTO Addresses (patient_id, address_line1, city, is_default)
         VALUES (?, ?, ?, ?)`,
        [finalPatientId, 'Created from result form', 'N/A', false]
      );
      const addressId = addressResult.insertId;

      // Get test price if not provided
      let totalCost = parseFloat(analysis_price) || 0;
      if (!totalCost && test_id) {
        const [testData] = await connection.query(
          'SELECT price FROM Medical_Tests WHERE test_id = ?',
          [test_id]
        );
        if (testData.length > 0) {
          totalCost = parseFloat(testData[0].price);
        }
      }

      // Create appointment reference ID
      const refId = appointment_ref_id || `#${Date.now().toString().slice(-10)}`;

      // Convert analysis_date to datetime format
      const appointmentDatetime = new Date(analysis_date).toISOString().slice(0, 19).replace('T', ' ');

      // Create appointment with "Completed" status (goes directly to Old/Results)
      const [appointmentResult] = await connection.query(
        `INSERT INTO Appointments (
          patient_id,
          doctor_id,
          address_id,
          appointment_datetime,
          appointment_ref_id,
          status,
          total_cost,
          payment_method,
          is_urgent,
          patient_notes,
          lab_notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          finalPatientId,
          doctor_id || null,
          addressId,
          appointmentDatetime,
          refId,
          'Completed',
          totalCost,
          'Cash',
          false,
          patient_name ? `Patient: ${patient_name}` : null,
          doctor_name ? `Doctor: ${doctor_name}` : null
        ]
      );
      appointmentId = appointmentResult.insertId;

      // Insert into Appointment_Tests table
      await connection.query(
        'INSERT INTO Appointment_Tests (appointment_id, test_id) VALUES (?, ?)',
        [appointmentId, test_id]
      );
    }

    // 3. Check if result already exists for this appointment and test
    const [existingResult] = await connection.query(
      'SELECT result_id FROM Test_Results WHERE appointment_id = ? AND test_id = ?',
      [appointmentId, test_id]
    );

    if (existingResult.length > 0) {
      // Update existing result
      await connection.query(
        `UPDATE Test_Results 
         SET result_file_url = ?, uploaded_at = NOW() 
         WHERE appointment_id = ? AND test_id = ?`,
        [resultFileUrl, appointmentId, test_id]
      );
      console.log('[API INFO] Updated existing result for appointment:', appointmentId);
    } else {
      // Insert new test result
      await connection.query(
        `INSERT INTO Test_Results (appointment_id, test_id, result_file_url, uploaded_at) 
         VALUES (?, ?, ?, NOW())`,
        [appointmentId, test_id, resultFileUrl]
      );
      console.log('[API INFO] Inserted new result for appointment:', appointmentId);
    }

    await connection.commit();

    const message = movedFromComing 
      ? 'Result added successfully. Appointment moved from Coming to Completed.'
      : 'Result added successfully.';

    console.log('[API SUCCESS]', 'POST', '/api/admin/results/create', {
      appointmentId,
      movedFromComing,
      status: 201
    });

    res.status(201).json({
      success: true,
      message: message,
      data: {
        appointment_id: appointmentId,
        appointment_ref_id: appointment_ref_id || `#${Date.now().toString().slice(-10)}`,
        test_id,
        result_file_url: resultFileUrl,
        moved_from_coming: movedFromComing
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('[API ERROR]', 'POST', '/api/admin/results/create', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to add result',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Update an existing result
 */
exports.updateResult = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { appointmentId } = req.params;
    const {
      analysis_date,
      analysis_price,
      doctor_name,
      patient_notes,
      lab_notes
    } = req.body;
    
    const resultFileUrl = req.file ? `/uploads/test-results/${req.file.filename}` : null;

    console.log('[API REQUEST]', 'PUT', `/api/admin/results/${appointmentId}`);

    // Validate appointment exists and check its status
    const [appointments] = await connection.query(
      'SELECT appointment_id, status FROM Appointments WHERE appointment_id = ?',
      [appointmentId]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    let movedFromComing = false;

    // If appointment was in Coming tab, move it to Completed
    if (appointments[0].status === 'Upcoming' || 
        appointments[0].status === 'In Progress' || 
        appointments[0].status === 'Pending Confirmation') {
      await connection.query(
        'UPDATE Appointments SET status = "Completed" WHERE appointment_id = ?',
        [appointmentId]
      );
      movedFromComing = true;
      console.log('[API INFO] Appointment moved from Coming to Completed');
    }

    // Update appointment datetime if analysis_date provided
    let appointmentDatetime = null;
    if (analysis_date) {
      const date = new Date(analysis_date);
      appointmentDatetime = date.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Build dynamic update query for appointments
    const appointmentUpdates = [];
    const appointmentValues = [];

    if (appointmentDatetime) {
      appointmentUpdates.push('appointment_datetime = ?');
      appointmentValues.push(appointmentDatetime);
    }
    if (analysis_price !== undefined) {
      appointmentUpdates.push('total_cost = ?');
      appointmentValues.push(parseFloat(analysis_price));
    }
    if (patient_notes !== undefined) {
      appointmentUpdates.push('patient_notes = ?');
      appointmentValues.push(patient_notes);
    }
    if (lab_notes !== undefined || doctor_name !== undefined) {
      const newLabNotes = lab_notes || (doctor_name ? `Doctor: ${doctor_name}` : '');
      appointmentUpdates.push('lab_notes = ?');
      appointmentValues.push(newLabNotes);
    }

    if (appointmentUpdates.length > 0) {
      appointmentValues.push(appointmentId);
      const updateQuery = `UPDATE Appointments SET ${appointmentUpdates.join(', ')} WHERE appointment_id = ?`;
      await connection.query(updateQuery, appointmentValues);
    }

    // Update result file if provided
    if (resultFileUrl) {
      await connection.query(
        'UPDATE Test_Results SET result_file_url = ?, uploaded_at = NOW() WHERE appointment_id = ?',
        [resultFileUrl, appointmentId]
      );
    }

    await connection.commit();

    const message = movedFromComing
      ? 'Result updated successfully. Appointment moved from Coming to Completed.'
      : 'Result updated successfully.';

    res.json({
      success: true,
      message: message
    });

  } catch (error) {
    await connection.rollback();
    console.error('[API ERROR]', 'PUT', `/api/admin/results/${appointmentId}`, {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update result'
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all results (completed appointments with uploaded results)
 * Only returns appointments with status = 'Completed'
 */
exports.getAllResults = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        a.appointment_id,
        a.appointment_ref_id,
        a.appointment_datetime,
        a.status,
        a.total_cost,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        d.full_name as doctor_name,
        mt.test_id,
        mt.test_name,
        mt.test_code,
        tr.result_id,
        tr.result_file_url,
        tr.uploaded_at
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Users u ON p.patient_id = u.user_id
      LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
      LEFT JOIN Users d ON doc.doctor_id = d.user_id
      JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
      JOIN Medical_Tests mt ON at.test_id = mt.test_id
      INNER JOIN Test_Results tr ON a.appointment_id = tr.appointment_id AND mt.test_id = tr.test_id
      WHERE a.status = 'Completed'
    `;

    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.phone_number LIKE ? OR a.appointment_ref_id LIKE ? OR mt.test_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` GROUP BY a.appointment_id ORDER BY a.appointment_datetime DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [results] = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT a.appointment_id) as total
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Users u ON p.patient_id = u.user_id
      INNER JOIN Test_Results tr ON a.appointment_id = tr.appointment_id
      WHERE a.status = 'Completed'
    `;

    const countParams = [];
    if (search) {
      countQuery += ` AND (u.full_name LIKE ? OR u.phone_number LIKE ? OR a.appointment_ref_id LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results'
    });
  }
};