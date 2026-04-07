const db = require('../../config/db');

// Get all appointments with pagination, search, and filtering
const getAppointments = async (req, res) => {
    try {
        const { 
            search = '', 
            status = 'all',
            date_from = '',
            date_to = '',
            assistant_id = '',
            doctor_id = ''
        } = req.query;

        let whereClause = "WHERE 1=1";
        let queryParams = [];

        if (search) {
            whereClause += " AND (u.full_name LIKE ? OR u.phone_number LIKE ? OR ap.appointment_ref_id LIKE ?)";
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status !== 'all') {
            whereClause += " AND ap.status = ?";
            queryParams.push(status);
        }

        if (date_from) {
            whereClause += " AND DATE(ap.appointment_datetime) >= ?";
            queryParams.push(date_from);
        }

        if (date_to) {
            whereClause += " AND DATE(ap.appointment_datetime) <= ?";
            queryParams.push(date_to);
        }

        if (assistant_id) {
            whereClause += " AND ap.assistant_id = ?";
            queryParams.push(assistant_id);
        }

        if (doctor_id) {
            whereClause += " AND ap.doctor_id = ?";
            queryParams.push(doctor_id);
        }

        const sql = `
            SELECT
                ap.appointment_id,
                ap.appointment_ref_id,
                ap.appointment_datetime,
                ap.status,
                ap.total_cost,
                ap.payment_method,
                ap.is_urgent,
                ap.patient_notes,
                ap.lab_notes,
                ap.created_at,
                u.full_name as patient_name,
                u.phone_number as patient_phone,
                addr.address_line1,
                addr.address_line2,
                addr.city,
                asst_user.full_name as assistant_name,
                asst_user.phone_number as assistant_phone,
                doc_user.full_name as doctor_name,
                doc_user.phone_number as doctor_phone,
                GROUP_CONCAT(mt.test_name SEPARATOR ', ') as test_names,
                GROUP_CONCAT(mt.test_code SEPARATOR ', ') as test_codes
            FROM Appointments ap
            INNER JOIN Patients p ON ap.patient_id = p.patient_id
            INNER JOIN Users u ON p.patient_id = u.user_id
            INNER JOIN Addresses addr ON ap.address_id = addr.address_id
            LEFT JOIN Users asst_user ON ap.assistant_id = asst_user.user_id
            LEFT JOIN Users doc_user ON ap.doctor_id = doc_user.user_id
            LEFT JOIN Appointment_Tests at ON ap.appointment_id = at.appointment_id
            LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
            ${whereClause}
            GROUP BY ap.appointment_id
            ORDER BY ap.appointment_datetime DESC
        `;

        const [appointments] = await db.execute(sql, queryParams);

        res.json({
            success: true,
            data: {
                appointments
            }
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات المواعيد'
        });
    }
};


// Get appointment details by ID
const getAppointmentDetails = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const [appointment] = await db.execute(`
            SELECT 
                ap.*,
                u.full_name as patient_name,
                u.phone_number as patient_phone,
                p.date_of_birth,
                p.gender,
                addr.address_line1,
                addr.address_line2,
                addr.city,
                asst_user.full_name as assistant_name,
                asst_user.phone_number as assistant_phone,
                doc_user.full_name as doctor_name,
                doc_user.phone_number as doctor_phone
            FROM Appointments ap
            INNER JOIN Patients p ON ap.patient_id = p.patient_id
            INNER JOIN Users u ON p.patient_id = u.user_id
            INNER JOIN Addresses addr ON ap.address_id = addr.address_id
            LEFT JOIN Users asst_user ON ap.assistant_id = asst_user.user_id
            LEFT JOIN Users doc_user ON ap.doctor_id = doc_user.user_id
            WHERE ap.appointment_id = ?
        `, [appointmentId]);
        
        if (appointment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الموعد غير موجود'
            });
        }
        
        // Get tests for this appointment
        const [tests] = await db.execute(`
            SELECT
                mt.test_id,
                mt.test_name,
                mt.test_code,
                mt.price,
                mt.sample_type,
                mt.turnaround_time
            FROM Appointment_Tests at
            INNER JOIN Medical_Tests mt ON at.test_id = mt.test_id
            WHERE at.appointment_id = ?
        `, [appointmentId]);

        // Get appointment result file (single file for entire appointment)
        const [result] = await db.execute(`
            SELECT
                result_id,
                result_file_url,
                uploaded_at
            FROM Test_Results
            WHERE appointment_id = ?
            LIMIT 1
        `, [appointmentId]);

        // Add test_codes as comma-separated string for AppointmentModal
        const appointmentData = {
            ...appointment[0],
            test_codes: tests.map(t => t.test_code).join(', ')
        };

        res.json({
            success: true,
            data: {
                appointment: appointmentData,
                tests,
                result: result[0] || null
            }
        });
        
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل الموعد'
        });
    }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, lab_notes } = req.body;
        
        const validStatuses = ['Pending Confirmation', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة الموعد غير صحيحة'
            });
        }
        
        let updateQuery = 'UPDATE Appointments SET status = ?';
        let queryParams = [status];
        
        if (lab_notes) {
            updateQuery += ', lab_notes = ?';
            queryParams.push(lab_notes);
        }
        
        updateQuery += ' WHERE appointment_id = ?';
        queryParams.push(appointmentId);
        
        const [result] = await db.execute(updateQuery, queryParams);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'الموعد غير موجود'
            });
        }
        
        res.json({
            success: true,
            message: 'تم تحديث حالة الموعد بنجاح'
        });
        
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث حالة الموعد'
        });
    }
};

// Assign assistant to appointment
const assignAssistant = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { assistant_id } = req.body;
        
        // Verify assistant exists
        const [assistant] = await db.execute(
            'SELECT user_id FROM Users WHERE user_id = ? AND user_type = "Assistant" AND is_active = 1',
            [assistant_id]
        );
        
        if (assistant.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'المساعد غير موجود أو غير فعال'
            });
        }
        
        const [result] = await db.execute(
            'UPDATE Appointments SET assistant_id = ? WHERE appointment_id = ?',
            [assistant_id, appointmentId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'الموعد غير موجود'
            });
        }
        
        res.json({
            success: true,
            message: 'تم تعيين المساعد بنجاح'
        });
        
    } catch (error) {
        console.error('Error assigning assistant:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تعيين المساعد'
        });
    }
};

// Update appointment details
const updateAppointmentDetails = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const {
            appointment_datetime,
            patient_notes,
            lab_notes,
            is_urgent,
            payment_method
        } = req.body;
        
        let updateFields = [];
        let queryParams = [];
        
        if (appointment_datetime) {
            updateFields.push('appointment_datetime = ?');
            queryParams.push(appointment_datetime);
        }
        
        if (patient_notes !== undefined) {
            updateFields.push('patient_notes = ?');
            queryParams.push(patient_notes);
        }
        
        if (lab_notes !== undefined) {
            updateFields.push('lab_notes = ?');
            queryParams.push(lab_notes);
        }
        
        if (is_urgent !== undefined) {
            updateFields.push('is_urgent = ?');
            queryParams.push(is_urgent);
        }
        
        if (payment_method) {
            updateFields.push('payment_method = ?');
            queryParams.push(payment_method);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث'
            });
        }
        
        const updateQuery = `UPDATE Appointments SET ${updateFields.join(', ')} WHERE appointment_id = ?`;
        queryParams.push(appointmentId);
        
        const [result] = await db.execute(updateQuery, queryParams);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'الموعد غير موجود'
            });
        }
        
        res.json({
            success: true,
            message: 'تم تحديث بيانات الموعد بنجاح'
        });
        
    } catch (error) {
        console.error('Error updating appointment details:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث بيانات الموعد'
        });
    }
};

// Get available assistants for assignment
const getAvailableAssistants = async (req, res) => {
    try {
        const [assistants] = await db.execute(`
            SELECT 
                u.user_id,
                u.full_name,
                u.phone_number,
                COUNT(ap.appointment_id) as active_appointments
            FROM Users u
            INNER JOIN Assistants a ON u.user_id = a.assistant_id
            LEFT JOIN Appointments ap ON u.user_id = ap.assistant_id AND ap.status IN ('Upcoming', 'In Progress')
            WHERE u.user_type = 'Assistant' AND u.is_active = 1
            GROUP BY u.user_id, u.full_name, u.phone_number
            ORDER BY active_appointments ASC, u.full_name ASC
        `);
        
        res.json({
            success: true,
            data: assistants
        });
        
    } catch (error) {
        console.error('Error fetching available assistants:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات المساعدين'
        });
    }
};

// Get appointment statistics
const getAppointmentStats = async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'Pending Confirmation' THEN 1 END) as pending_appointments,
                COUNT(CASE WHEN status = 'Upcoming' THEN 1 END) as upcoming_appointments,
                COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_appointments,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_appointments,
                COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_appointments,
                COUNT(CASE WHEN DATE(appointment_datetime) = CURDATE() THEN 1 END) as today_appointments,
                SUM(CASE WHEN status = 'Completed' THEN total_cost ELSE 0 END) as total_revenue
            FROM Appointments
            WHERE DATE(appointment_datetime) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `);
        
        res.json({
            success: true,
            data: stats[0]
        });
        
    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات المواعيد'
        });
    }
};

module.exports = {
    getAppointments,
    getAppointmentDetails,
    updateAppointmentStatus,
    assignAssistant,
    updateAppointmentDetails,
    getAvailableAssistants,
    getAppointmentStats
};

