// controllers/Admin/Admin1.js
const db = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard/stats
 * @access Admin only
 */
const getDashboardStats = async (req, res) => {
    const context = 'ADMIN_DASHBOARD_STATS';

    try {
        logger.logRequest('GET', '/api/admin/dashboard/stats', req.user?.id);

        // Get patients count
        const [patientsCount] = await db.query(`
            SELECT COUNT(*) as count FROM Users WHERE user_type = 'Patient' AND is_active = TRUE
        `);

        // Get verified doctors count
        const [doctorsCount] = await db.query(`
            SELECT COUNT(*) as count FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.is_verified = TRUE AND u.is_active = TRUE
        `);

        // Get assistants count
        const [assistantsCount] = await db.query(`
            SELECT COUNT(*) as count FROM Assistants a
            JOIN Users u ON a.assistant_id = u.user_id
            WHERE u.is_active = TRUE
        `);

        // Get total portfolio/revenue (from completed appointments)
        const [portfolioResult] = await db.query(`
            SELECT COALESCE(SUM(total_cost), 0) as total FROM Appointments
            WHERE status = 'Completed'
        `);

        const responseData = {
            patients: patientsCount[0].count,
            doctors: doctorsCount[0].count,
            assistants: assistantsCount[0].count,
            portfolio: portfolioResult[0].total
        };

        logger.logResponse('GET', '/api/admin/dashboard/stats', 200, responseData);

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        logger.logApiError('GET', '/api/admin/dashboard/stats', error, 500, {
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get pending appointments for confirmation
 * @route GET /api/admin/appointments/pending
 * @access Admin only
 */
const getPendingAppointments = async (req, res) => {
    const context = 'ADMIN_PENDING_APPOINTMENTS';

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        logger.logRequest('GET', '/api/admin/appointments/pending', req.user?.id, req.query);

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 100) {
            logger.warn(context, 'Invalid pagination parameters', { page, limit });
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }

        const [appointments] = await db.query(`
            SELECT
                a.appointment_id,
                a.appointment_ref_id as phone_number,
                u.full_name as name,
                addr.address_line1,
                addr.address_line2,
                a.status,
                a.appointment_datetime,
                a.total_cost
            FROM Appointments a
            JOIN Patients p ON a.patient_id = p.patient_id
            JOIN Users u ON p.patient_id = u.user_id
            JOIN Addresses addr ON a.address_id = addr.address_id
            WHERE a.status = 'Pending Confirmation'
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Get total count for pagination
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total FROM Appointments
            WHERE status = 'Pending Confirmation'
        `);

        const totalPages = Math.ceil(countResult[0].total / limit);

        const responseData = {
            appointments,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: countResult[0].total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        logger.logResponse('GET', '/api/admin/appointments/pending', 200, {
            count: appointments.length,
            page
        });

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        logger.logApiError('GET', '/api/admin/appointments/pending', error, 500, {
            userId: req.user?.id,
            query: req.query
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending appointments',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get unverified doctors for recruitment
 * @route GET /api/admin/doctors/unverified
 * @access Admin only
 */
const getUnverifiedDoctors = async (req, res) => {
    const context = 'ADMIN_UNVERIFIED_DOCTORS';

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        logger.logRequest('GET', '/api/admin/doctors/unverified', req.user?.id, req.query);

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 100) {
            logger.warn(context, 'Invalid pagination parameters', { page, limit });
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }

        const [doctors] = await db.query(`
            SELECT
                d.doctor_id,
                u.full_name as name,
                u.phone_number,
                d.clinic_address as address,
                d.is_verified as status,
                u.created_at
            FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.is_verified = FALSE AND u.is_active = TRUE
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Get total count for pagination
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.is_verified = FALSE AND u.is_active = TRUE
        `);

        const totalPages = Math.ceil(countResult[0].total / limit);

        const responseData = {
            doctors,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: countResult[0].total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        logger.logResponse('GET', '/api/admin/doctors/unverified', 200, {
            count: doctors.length,
            page
        });

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        logger.logApiError('GET', '/api/admin/doctors/unverified', error, 500, {
            userId: req.user?.id,
            query: req.query
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unverified doctors',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Confirm/Update appointment status
 * @route PUT /api/admin/appointments/:appointmentId/status
 * @access Admin only
 */
const updateAppointmentStatus = async (req, res) => {
    const context = 'ADMIN_UPDATE_APPOINTMENT_STATUS';

    try {
        const { appointmentId } = req.params;
        const { status, lab_notes } = req.body;

        logger.logRequest('PUT', `/api/admin/appointments/${appointmentId}/status`, req.user?.id, null, req.body);

        // Validate appointment ID
        if (!appointmentId || isNaN(appointmentId)) {
            logger.warn(context, 'Invalid appointment ID', { appointmentId });
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment ID'
            });
        }

        // Validate status
        const validStatuses = ['Pending Confirmation', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'];
        if (!status || !validStatuses.includes(status)) {
            logger.warn(context, 'Invalid status', { status, appointmentId });
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // Update appointment status
        const [updateResult] = await db.query(`
            UPDATE Appointments
            SET status = ?, lab_notes = ?
            WHERE appointment_id = ?
        `, [status, lab_notes || null, appointmentId]);

        if (updateResult.affectedRows === 0) {
            logger.warn(context, 'Appointment not found', { appointmentId });
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Create notification for patient
        const [appointment] = await db.query(`
            SELECT patient_id FROM Appointments WHERE appointment_id = ?
        `, [appointmentId]);

        if (appointment.length > 0) {
            const notificationTitle = status === 'Upcoming' ? 'موعدك مؤكد' : `تم تحديث حالة موعدك إلى ${status}`;
            const notificationMessage = status === 'Upcoming' ?
                'تم تأكيد موعدك بنجاح. سيتم التواصل معك قريباً.' :
                `تم تحديث حالة موعدك إلى ${status}`;

            await db.query(`
                INSERT INTO Notifications (user_id, title, message)
                VALUES (?, ?, ?)
            `, [appointment[0].patient_id, notificationTitle, notificationMessage]);

            logger.info(context, 'Notification sent to patient', {
                patientId: appointment[0].patient_id,
                appointmentId
            });
        }

        logger.logResponse('PUT', `/api/admin/appointments/${appointmentId}/status`, 200, {
            appointmentId,
            status
        });

        res.json({
            success: true,
            message: 'Appointment status updated successfully'
        });
    } catch (error) {
        logger.logApiError('PUT', `/api/admin/appointments/${req.params.appointmentId}/status`, error, 500, {
            userId: req.user?.id,
            appointmentId: req.params.appointmentId,
            body: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify doctor
 * @route PUT /api/admin/doctors/:doctorId/verify
 * @access Admin only
 */
const verifyDoctor = async (req, res) => {
    const context = 'ADMIN_VERIFY_DOCTOR';

    try {
        const { doctorId } = req.params;
        const { verify } = req.body;

        logger.logRequest('PUT', `/api/admin/doctors/${doctorId}/verify`, req.user?.id, null, req.body);

        // Validate doctor ID
        if (!doctorId || isNaN(doctorId)) {
            logger.warn(context, 'Invalid doctor ID', { doctorId });
            return res.status(400).json({
                success: false,
                message: 'Invalid doctor ID'
            });
        }

        // Validate verify parameter
        if (typeof verify !== 'boolean') {
            logger.warn(context, 'Invalid verify parameter', { verify });
            return res.status(400).json({
                success: false,
                message: 'Verify parameter must be a boolean'
            });
        }

        // Check if doctor exists
        const [doctorExists] = await db.query(`
            SELECT doctor_id FROM Doctors WHERE doctor_id = ?
        `, [doctorId]);

        if (doctorExists.length === 0) {
            logger.warn(context, 'Doctor not found', { doctorId });
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Update doctor verification status
        await db.query(`
            UPDATE Doctors
            SET is_verified = ?
            WHERE doctor_id = ?
        `, [verify, doctorId]);

        // Create notification for doctor
        const notificationTitle = verify ? 'تم قبول طلبك' : 'تم رفض طلبك';
        const notificationMessage = verify ?
            'مرحباً بك في منصة شفاء. يمكنك الآن استقبال المرضى.' :
            'نأسف، لم يتم قبول طلب الانضمام. يرجى التواصل مع الإدارة للمزيد من التفاصيل.';

        await db.query(`
            INSERT INTO Notifications (user_id, title, message)
            VALUES (?, ?, ?)
        `, [doctorId, notificationTitle, notificationMessage]);

        logger.info(context, `Doctor ${verify ? 'verified' : 'rejected'}`, {
            doctorId,
            adminId: req.user?.id
        });

        logger.logResponse('PUT', `/api/admin/doctors/${doctorId}/verify`, 200, {
            doctorId,
            verified: verify
        });

        res.json({
            success: true,
            message: verify ? 'Doctor verified successfully' : 'Doctor application rejected'
        });
    } catch (error) {
        logger.logApiError('PUT', `/api/admin/doctors/${req.params.doctorId}/verify`, error, 500, {
            userId: req.user?.id,
            doctorId: req.params.doctorId,
            body: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update doctor verification status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete appointment
 * @route DELETE /api/admin/appointments/:appointmentId
 * @access Admin only
 */
const deleteAppointment = async (req, res) => {
    const context = 'ADMIN_DELETE_APPOINTMENT';

    try {
        const { appointmentId } = req.params;

        logger.logRequest('DELETE', `/api/admin/appointments/${appointmentId}`, req.user?.id);

        // Validate appointment ID
        if (!appointmentId || isNaN(appointmentId)) {
            logger.warn(context, 'Invalid appointment ID', { appointmentId });
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment ID'
            });
        }

        // Get patient_id for notification before deletion
        const [appointment] = await db.query(`
            SELECT patient_id FROM Appointments WHERE appointment_id = ?
        `, [appointmentId]);

        if (appointment.length === 0) {
            logger.warn(context, 'Appointment not found', { appointmentId });
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Delete appointment
        await db.query(`
            DELETE FROM Appointments WHERE appointment_id = ?
        `, [appointmentId]);

        // Create notification for patient
        await db.query(`
            INSERT INTO Notifications (user_id, title, message)
            VALUES (?, ?, ?)
        `, [
            appointment[0].patient_id,
            'تم إلغاء موعدك',
            'تم إلغاء موعدك من قبل الإدارة. يرجى التواصل معنا للمزيد من التفاصيل.'
        ]);

        logger.info(context, 'Appointment deleted', {
            appointmentId,
            patientId: appointment[0].patient_id,
            adminId: req.user?.id
        });

        logger.logResponse('DELETE', `/api/admin/appointments/${appointmentId}`, 200);

        res.json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        logger.logApiError('DELETE', `/api/admin/appointments/${req.params.appointmentId}`, error, 500, {
            userId: req.user?.id,
            appointmentId: req.params.appointmentId
        });
        res.status(500).json({
            success: false,
            message: 'Failed to delete appointment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete doctor application
 * @route DELETE /api/admin/doctors/:doctorId
 * @access Admin only
 */
const deleteDoctorApplication = async (req, res) => {
    const context = 'ADMIN_DELETE_DOCTOR';

    try {
        const { doctorId } = req.params;

        logger.logRequest('DELETE', `/api/admin/doctors/${doctorId}`, req.user?.id);

        // Validate doctor ID
        if (!doctorId || isNaN(doctorId)) {
            logger.warn(context, 'Invalid doctor ID', { doctorId });
            return res.status(400).json({
                success: false,
                message: 'Invalid doctor ID'
            });
        }

        // Check if doctor exists
        const [doctorExists] = await db.query(`
            SELECT user_id FROM Users WHERE user_id = ? AND user_type = 'Doctor'
        `, [doctorId]);

        if (doctorExists.length === 0) {
            logger.warn(context, 'Doctor not found', { doctorId });
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Create notification before deletion
        await db.query(`
            INSERT INTO Notifications (user_id, title, message)
            VALUES (?, ?, ?)
        `, [
            doctorId,
            'تم حذف طلبك',
            'تم حذف طلب الانضمام الخاص بك من قبل الإدارة.'
        ]);

        // Delete user (will cascade to doctor record)
        await db.query(`
            DELETE FROM Users WHERE user_id = ?
        `, [doctorId]);

        logger.info(context, 'Doctor application deleted', {
            doctorId,
            adminId: req.user?.id
        });

        logger.logResponse('DELETE', `/api/admin/doctors/${doctorId}`, 200);

        res.json({
            success: true,
            message: 'Doctor application deleted successfully'
        });
    } catch (error) {
        logger.logApiError('DELETE', `/api/admin/doctors/${req.params.doctorId}`, error, 500, {
            userId: req.user?.id,
            doctorId: req.params.doctorId
        });
        res.status(500).json({
            success: false,
            message: 'Failed to delete doctor application',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getDashboardStats,
    getPendingAppointments,
    getUnverifiedDoctors,
    updateAppointmentStatus,
    verifyDoctor,
    deleteAppointment,
    deleteDoctorApplication
};
