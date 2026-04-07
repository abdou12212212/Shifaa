const db = require('../../config/db');

/**
 * Create a new result with appointment
 * This creates both an appointment and uploads the result in one operation
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

    console.log('[API REQUEST]', 'POST', '/api/admin/results/create');
    console.log('[REQUEST BODY]', JSON.stringify(req.body, null, 2));
    console.log('[VALIDATION CHECK]', {
      patient_id: !!patient_id,
      patient_name: !!patient_name,
      patient_phone: !!patient_phone,
      test_id: !!test_id,
      analysis_date: !!analysis_date,
      result_file_url: !!result_file_url
    });

    // Validate required fields
    const missingFields = [];
    if (!patient_id) missingFields.push('patient_id');
    if (!patient_name) missingFields.push('patient_name');
    if (!patient_phone) missingFields.push('patient_phone');
    if (!test_id) missingFields.push('test_id');
    if (!analysis_date) missingFields.push('analysis_date');
    if (!result_file_url) missingFields.push('result_file_url');

    if (missingFields.length > 0) {
      console.log('[VALIDATION ERROR] Missing fields:', missingFields);
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `البيانات المطلوبة ناقصة: ${missingFields.join(', ')}`
      });
    }

    // 1. Create address for this result/appointment
    const [addressResult] = await connection.query(
      `INSERT INTO Addresses (patient_id, address_line1, city, is_default)
       VALUES (?, ?, ?, ?)`,
      [patient_id, 'Created from result form', 'N/A', false]
    );
    const addressId = addressResult.insertId;

    // 2. Get test price if not provided
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

    // 3. Create appointment reference ID
    const refId = appointment_ref_id || `#${Date.now().toString().slice(-10)}`;

    // 4. Convert analysis_date to datetime format
    const appointmentDatetime = new Date(analysis_date).toISOString().slice(0, 19).replace('T', ' ');

    // 5. Create appointment with "Completed" status since result is already uploaded
    const [appointmentResult] = await connection.query(
      `INSERT INTO Appointments (
        patient_id,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        patient_id,
        addressId,
        appointmentDatetime,
        refId,
        'Completed', // Set as completed since we're uploading result
        totalCost,
        'Cash', // Default payment method
        false,
        ``,
        doctor_name ? `Doctor: ${doctor_name}` : null
      ]
    );
    const appointmentId = appointmentResult.insertId;

    // 6. Insert into Appointment_Tests table
    await connection.query(
      'INSERT INTO Appointment_Tests (appointment_id, test_id) VALUES (?, ?)',
      [appointmentId, test_id]
    );

    // 7. Insert the test result
    await connection.query(
      'INSERT INTO Test_Results (appointment_id, test_id, result_file_url, uploaded_at) VALUES (?, ?, ?, NOW())',
      [appointmentId, test_id, result_file_url]
    );

    await connection.commit();

    console.log('[API SUCCESS]', 'POST', '/api/admin/results/create', {
      appointmentId,
      refId,
      status: 201
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة النتيجة بنجاح',
      data: {
        appointment_id: appointmentId,
        appointment_ref_id: refId,
        test_id,
        result_file_url
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('[API ERROR]', 'POST', '/api/admin/results/create', {
      error: error.message,
      stack: error.stack,
      status: 500
    });
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة النتيجة'
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
      result_file_url,
      doctor_name,
      patient_notes,
      lab_notes
    } = req.body;

    console.log('[API REQUEST]', 'PUT', `/api/admin/results/${appointmentId}`);
    console.log('[REQUEST BODY]', JSON.stringify(req.body, null, 2));

    // Validate appointment exists
    const [appointments] = await connection.query(
      'SELECT appointment_id FROM Appointments WHERE appointment_id = ?',
      [appointmentId]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
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
    if (result_file_url) {
      await connection.query(
        'UPDATE Test_Results SET result_file_url = ?, uploaded_at = NOW() WHERE appointment_id = ?',
        [result_file_url, appointmentId]
      );
    }

    await connection.commit();

    console.log('[API SUCCESS]', 'PUT', `/api/admin/results/${appointmentId}`, { status: 200 });

    res.json({
      success: true,
      message: 'تم تحديث النتيجة بنجاح'
    });

  } catch (error) {
    await connection.rollback();
    console.error('[API ERROR]', 'PUT', `/api/admin/results/${appointmentId}`, {
      error: error.message,
      stack: error.stack,
      status: 500
    });
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث النتيجة'
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all results (completed appointments with uploaded results)
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
        p.patient_id,
        mt.test_id,
        mt.test_name,
        mt.test_code,
        tr.result_id,
        tr.result_file_url,
        tr.uploaded_at
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Users u ON p.patient_id = u.user_id
      JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
      JOIN Medical_Tests mt ON at.test_id = mt.test_id
      LEFT JOIN Test_Results tr ON a.appointment_id = tr.appointment_id AND mt.test_id = tr.test_id
      WHERE a.status = 'Completed'
    `;

    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.phone_number LIKE ? OR a.appointment_ref_id LIKE ? OR mt.test_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY a.appointment_datetime DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [results] = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT a.appointment_id) as total
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Users u ON p.patient_id = u.user_id
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
      message: 'فشل في جلب النتائج'
    });
  }
};

