const db = require('../../config/db');

// Get all appointments with filters
exports.getAppointments = async (req, res) => {
  try {
    const { status, search, date } = req.query;
    
    let query = `
      SELECT 
        a.appointment_id,
        a.appointment_ref_id,
        a.appointment_datetime,
        a.status,
        a.payment_method,
        a.total_cost,
        a.is_urgent,
        a.patient_notes,
        a.lab_notes,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        addr.address_line1,
        addr.address_line2,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names,
        GROUP_CONCAT(DISTINCT mt.test_code SEPARATOR ', ') as test_codes,
        GROUP_CONCAT(DISTINCT mt.test_id) as test_ids,
        ass_user.full_name as assistant_name,
        ass_user.phone_number as assistant_phone
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Users u ON p.patient_id = u.user_id
      JOIN Addresses addr ON a.address_id = addr.address_id
      LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
      LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
      LEFT JOIN Assistants ass ON a.assistant_id = ass.assistant_id
      LEFT JOIN Users ass_user ON ass.assistant_id = ass_user.user_id
      WHERE 1=1
    `;

    let params = [];

    if (status && status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.phone_number LIKE ? OR a.appointment_ref_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (date) {
      query += ' AND DATE(a.appointment_datetime) = ?';
      params.push(date);
    }

    query += ' GROUP BY a.appointment_id ORDER BY a.appointment_datetime DESC';

    const [appointments] = await db.execute(query, params);
    
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب المواعيد'
    });
  }
};

// Get single appointment details for editing
exports.getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const query = `
      SELECT 
        a.*,
        u.full_name as patient_name,
        u.phone_number as patient_phone,
        p.date_of_birth,
        p.gender,
        addr.address_line1,
        addr.address_line2,
        addr.city,
        GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names,
        GROUP_CONCAT(DISTINCT mt.test_code SEPARATOR ', ') as test_codes,
        GROUP_CONCAT(DISTINCT mt.test_id) as test_ids,
        ass_user.full_name as assistant_name,
        ass_user.phone_number as assistant_phone
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.patient_id
      JOIN Users u ON p.patient_id = u.user_id
      JOIN Addresses addr ON a.address_id = addr.address_id
      LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
      LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
      LEFT JOIN Assistants ass ON a.assistant_id = ass.assistant_id
      LEFT JOIN Users ass_user ON ass.assistant_id = ass_user.user_id
      WHERE a.appointment_id = ?
      GROUP BY a.appointment_id
    `;

    const [appointment] = await db.execute(query, [appointmentId]);
    
    if (appointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    res.json({
      success: true,
      data: appointment[0]
    });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تفاصيل الموعد'
    });
  }
};

// Update appointment details
exports.updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const {
      appointment_datetime,
      status,
      payment_method,
      total_cost,
      is_urgent,
      patient_notes,
      lab_notes,
      assistant_id
    } = req.body;

    let formattedDatetime = appointment_datetime;
    if (appointment_datetime) {
      const date = new Date(appointment_datetime);
      formattedDatetime = date.toISOString().slice(0, 19).replace('T', ' ');
    }

    const query = `
      UPDATE Appointments SET
        appointment_datetime = ?,
        status = ?,
        payment_method = ?,
        total_cost = ?,
        is_urgent = ?,
        patient_notes = ?,
        lab_notes = ?,
        assistant_id = ?
      WHERE appointment_id = ?
    `;

    await db.execute(query, [
      formattedDatetime,
      status,
      payment_method,
      total_cost,
      is_urgent || false,
      patient_notes,
      lab_notes,
      assistant_id || null,
      appointmentId
    ]);

    res.json({
      success: true,
      message: 'تم تحديث الموعد بنجاح'
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث الموعد'
    });
  }
};

// Get available assistants for assignment
exports.getAvailableAssistants = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        u.full_name,
        u.phone_number
      FROM Users u
      JOIN Assistants a ON u.user_id = a.assistant_id
      WHERE u.is_active = TRUE
      ORDER BY u.full_name ASC
    `;

    const [assistants] = await db.execute(query);
    
    res.json({
      success: true,
      data: assistants
    });
  } catch (error) {
    console.error('Error fetching assistants:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب المساعدين'
    });
  }
};

// Get test results for an appointment
exports.getAppointmentResults = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const query = `
      SELECT
        tr.result_id,
        tr.result_file_url,
        tr.uploaded_at,
        mt.test_id,
        mt.test_name,
        mt.test_code
      FROM Test_Results tr
      JOIN Medical_Tests mt ON tr.test_id = mt.test_id
      WHERE tr.appointment_id = ?
      ORDER BY tr.uploaded_at DESC
    `;

    const [results] = await db.execute(query, [appointmentId]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching appointment results:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب نتائج التحاليل'
    });
  }
};

// Upload file endpoint
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع أي ملف'
      });
    }

    const fileUrl = `/uploads/test-results/${req.file.filename}`;

    res.json({
      success: true,
      message: 'تم رفع الملف بنجاح',
      data: {
        filename: req.file.filename,
        fileUrl: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في رفع الملف'
    });
  }
};

// ============= الدالة المصححة: uploadTestResults =============
exports.uploadTestResults = async (req, res) => {
  try {
    const { appointment_id, test_id, result_file_url, test_ids } = req.body;

    // التحقق من البيانات المطلوبة
    if (!appointment_id) {
      return res.status(400).json({
        success: false,
        message: 'معرّف الموعد مطلوب'
      });
    }

    if (!result_file_url) {
      return res.status(400).json({
        success: false,
        message: 'رابط ملف النتيجة مطلوب'
      });
    }

    // استخدام test_id مفرد أو test_ids متعدد
    let testIdToUse = test_id || test_ids;
    
    // إذا كان test_ids عبارة عن array, نأخذ أول عنصر
    if (Array.isArray(testIdToUse) && testIdToUse.length > 0) {
      testIdToUse = testIdToUse[0];
    }

    // التحقق من وجود test_id
    if (!testIdToUse || testIdToUse === 'null' || testIdToUse === 'undefined') {
      // محاولة الحصول على test_id من Appointment_Tests
      const [tests] = await db.execute(
        'SELECT test_id FROM Appointment_Tests WHERE appointment_id = ? LIMIT 1',
        [appointment_id]
      );
      
      if (tests.length > 0) {
        testIdToUse = tests[0].test_id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'معرّف التحليل مطلوب. يرجى تحديد التحليل المراد رفع نتيجته.'
        });
      }
    }

    // التحقق من وجود نتيجة مسبقاً
    const [existing] = await db.execute(
      'SELECT result_id FROM Test_Results WHERE appointment_id = ? AND test_id = ?',
      [appointment_id, testIdToUse]
    );

    if (existing.length > 0) {
      // تحديث النتيجة الموجودة
      await db.execute(
        `UPDATE Test_Results 
         SET result_file_url = ?, uploaded_at = CURRENT_TIMESTAMP 
         WHERE appointment_id = ? AND test_id = ?`,
        [result_file_url, appointment_id, testIdToUse]
      );
    } else {
      // إدراج نتيجة جديدة
      await db.execute(
        `INSERT INTO Test_Results (appointment_id, test_id, result_file_url, uploaded_at) 
         VALUES (?, ?, ?, NOW())`,
        [appointment_id, testIdToUse, result_file_url]
      );
    }

    // التحقق من اكتمال جميع نتائج التحاليل للموعد
    const [allTests] = await db.execute(
      `SELECT COUNT(*) as total FROM Appointment_Tests WHERE appointment_id = ?`,
      [appointment_id]
    );

    const [completedResults] = await db.execute(
      `SELECT COUNT(*) as completed FROM Test_Results WHERE appointment_id = ?`,
      [appointment_id]
    );

    // إذا تم رفع جميع النتائج، تحديث حالة الموعد إلى "Completed"
    if (allTests[0].total === completedResults[0].completed && allTests[0].total > 0) {
      await db.execute(
        'UPDATE Appointments SET status = "Completed" WHERE appointment_id = ?',
        [appointment_id]
      );
    }

    res.json({
      success: true,
      message: 'تم رفع نتائج التحاليل بنجاح'
    });

  } catch (error) {
    console.error('Error uploading test results:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في رفع نتائج التحاليل',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// دالة إضافية لرفع نتيجة مع test_id محدد بوضوح
exports.uploadResultWithTestId = async (req, res) => {
  try {
    const { appointment_id, test_id, result_file_url } = req.body;

    // التحقق من البيانات المطلوبة
    if (!appointment_id) {
      return res.status(400).json({
        success: false,
        message: 'معرّف الموعد مطلوب'
      });
    }

    if (!test_id) {
      return res.status(400).json({
        success: false,
        message: 'معرّف التحليل مطلوب'
      });
    }

    if (!result_file_url) {
      return res.status(400).json({
        success: false,
        message: 'رابط ملف النتيجة مطلوب'
      });
    }

    // التحقق من وجود نتيجة مسبقاً
    const [existing] = await db.execute(
      'SELECT result_id FROM Test_Results WHERE appointment_id = ? AND test_id = ?',
      [appointment_id, test_id]
    );

    if (existing.length > 0) {
      await db.execute(
        `UPDATE Test_Results 
         SET result_file_url = ?, uploaded_at = CURRENT_TIMESTAMP 
         WHERE appointment_id = ? AND test_id = ?`,
        [result_file_url, appointment_id, test_id]
      );
    } else {
      await db.execute(
        `INSERT INTO Test_Results (appointment_id, test_id, result_file_url, uploaded_at) 
         VALUES (?, ?, ?, NOW())`,
        [appointment_id, test_id, result_file_url]
      );
    }

    res.json({
      success: true,
      message: 'تم رفع نتيجة التحليل بنجاح'
    });

  } catch (error) {
    console.error('Error uploading result with test ID:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في رفع نتيجة التحليل'
    });
  }
};

module.exports = exports;