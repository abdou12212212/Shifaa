// controllers/doctorController.js
const db = require('../../config/db');
const bcrypt = require('bcrypt');

// Get all doctors with search, filter and verification status
const getDoctors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'all'; // all, verified, unverified, active, inactive

        let whereClause = `WHERE u.user_type = 'Doctor'`;
        let queryParams = [];

        // Add search filter
        if (search) {
            whereClause += ` AND (u.full_name LIKE ? OR u.phone_number LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Add status filter
        switch (status) {
            case 'verified':
                whereClause += ` AND d.is_verified = TRUE AND u.is_active = TRUE`;
                break;
            case 'unverified':
                whereClause += ` AND d.is_verified = FALSE`;
                break;
            case 'active':
                whereClause += ` AND u.is_active = TRUE`;
                break;
            case 'inactive':
                whereClause += ` AND u.is_active = FALSE`;
                break;
        }

        const [doctors] = await db.query(`
            SELECT 
                u.user_id,
                u.full_name,
                u.phone_number,
                u.profile_picture_url,
                u.created_at,
                u.is_active,
                d.clinic_address,
                d.is_verified,
                d.is_featured,
                -- Count total patients treated
                (SELECT COUNT(DISTINCT a.patient_id) 
                 FROM Appointments a 
                 WHERE a.doctor_id = d.doctor_id AND a.status = 'Completed') as total_patients
            FROM Users u
            JOIN Doctors d ON u.user_id = d.doctor_id
            ${whereClause}
            ORDER BY d.is_verified DESC, u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        // Get total count for pagination
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total FROM Users u
            JOIN Doctors d ON u.user_id = d.doctor_id
            ${whereClause}
        `, queryParams);

        const totalPages = Math.ceil(countResult[0].total / limit);

        res.json({
            success: true,
            data: {
                doctors,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: countResult[0].total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single doctor by ID
const getDoctorById = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const [doctor] = await db.query(`
            SELECT 
                u.user_id,
                u.full_name,
                u.phone_number,
                u.profile_picture_url,
                u.created_at,
                u.is_active,
                d.clinic_address,
                d.is_verified,
                d.is_featured
            FROM Users u
            JOIN Doctors d ON u.user_id = d.doctor_id
            WHERE u.user_id = ? AND u.user_type = 'Doctor'
        `, [doctorId]);

        if (doctor.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Get doctor statistics
        const [appointmentStats] = await db.query(`
            SELECT 
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_appointments,
                COUNT(DISTINCT patient_id) as unique_patients,
                COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_cost END), 0) as total_revenue
            FROM Appointments 
            WHERE doctor_id = ?
        `, [doctorId]);

        res.json({
            success: true,
            data: {
                ...doctor[0],
                statistics: appointmentStats[0]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new doctor account
const createDoctor = async (req, res) => {
    try {
        const {
            full_name,
            phone_number,
            password,
            clinic_address,
            is_verified = false,
            is_featured = false
        } = req.body;

        // Validate required fields
        if (!full_name || !phone_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, phone number, and password are required'
            });
        }

        // Check if phone number already exists
        const [existingUser] = await db.query(`
            SELECT user_id FROM Users WHERE phone_number = ?
        `, [phone_number]);

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number already exists' 
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Start transaction
        await db.query('START TRANSACTION');

        try {
            // Insert user
            const [userResult] = await db.query(`
                INSERT INTO Users (full_name, phone_number, password_hash, user_type)
                VALUES (?, ?, ?, 'Doctor')
            `, [full_name, phone_number, password_hash]);

            const userId = userResult.insertId;

            // Insert doctor details
            await db.query(`
                INSERT INTO Doctors (doctor_id, clinic_address, is_verified, is_featured)
                VALUES (?, ?, ?, ?)
            `, [userId, clinic_address, is_verified, is_featured]);

            await db.query('COMMIT');

            // Send welcome notification
            await db.query(`
                INSERT INTO Notifications (user_id, title, message) 
                VALUES (?, ?, ?)
            `, [
                userId, 
                'مرحباً بك في شفاء', 
                'تم إنشاء حسابك بنجاح. مرحباً بك في منصة شفاء الطبية.'
            ]);

            res.status(201).json({
                success: true,
                message: 'Doctor account created successfully',
                data: { user_id: userId }
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update doctor information
const updateDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const {
            full_name,
            phone_number,
            clinic_address,
            is_verified,
            is_featured,
            is_active
        } = req.body;

        // Check if phone number exists for other users
        const [existingUser] = await db.query(`
            SELECT user_id FROM Users 
            WHERE phone_number = ? AND user_id != ?
        `, [phone_number, doctorId]);

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number already exists for another user' 
            });
        }

        // Update user table
        await db.query(`
            UPDATE Users 
            SET full_name = ?, phone_number = ?, is_active = ?
            WHERE user_id = ? AND user_type = 'Doctor'
        `, [full_name, phone_number, is_active, doctorId]);

        // Update doctor table
        await db.query(`
            UPDATE Doctors 
            SET clinic_address = ?, is_verified = ?, is_featured = ?
            WHERE doctor_id = ?
        `, [clinic_address, is_verified, is_featured, doctorId]);

        // Send notification if verification status changed
        if (typeof is_verified === 'boolean') {
            const notificationTitle = is_verified ? 'تم تأكيد حسابك' : 'تم إلغاء تأكيد حسابك';
            const notificationMessage = is_verified ? 
                'تهانينا! تم تأكيد حسابك كطبيب. يمكنك الآن استقبال المرضى.' : 
                'تم إلغاء تأكيد حسابك. يرجى التواصل مع الإدارة.';

            await db.query(`
                INSERT INTO Notifications (user_id, title, message) 
                VALUES (?, ?, ?)
            `, [doctorId, notificationTitle, notificationMessage]);
        }

        res.json({
            success: true,
            message: 'Doctor information updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle doctor verification status
const toggleDoctorVerification = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Get current verification status
        const [currentStatus] = await db.query(`
            SELECT is_verified FROM Doctors WHERE doctor_id = ?
        `, [doctorId]);

        if (currentStatus.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const newStatus = !currentStatus[0].is_verified;

        // Update verification status
        await db.query(`
            UPDATE Doctors SET is_verified = ? WHERE doctor_id = ?
        `, [newStatus, doctorId]);

        // Send notification
        const notificationTitle = newStatus ? 'تم تأكيد حسابك' : 'تم إلغاء تأكيد حسابك';
        const notificationMessage = newStatus ? 
            'تهانينا! تم تأكيد حسابك كطبيب معتمد في منصة شفاء.' : 
            'تم إلغاء تأكيد حسابك. يرجى التواصل مع الإدارة.';

        await db.query(`
            INSERT INTO Notifications (user_id, title, message) 
            VALUES (?, ?, ?)
        `, [doctorId, notificationTitle, notificationMessage]);

        res.json({
            success: true,
            message: `Doctor ${newStatus ? 'verified' : 'unverified'} successfully`,
            data: { is_verified: newStatus }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle featured status
const toggleFeaturedStatus = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Get current featured status
        const [currentStatus] = await db.query(`
            SELECT is_featured FROM Doctors WHERE doctor_id = ?
        `, [doctorId]);

        if (currentStatus.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const newStatus = !currentStatus[0].is_featured;

        await db.query(`
            UPDATE Doctors SET is_featured = ? WHERE doctor_id = ?
        `, [newStatus, doctorId]);

        res.json({
            success: true,
            message: `Doctor ${newStatus ? 'featured' : 'unfeatured'} successfully`,
            data: { is_featured: newStatus }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete doctor (soft delete)
const deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Check if doctor has active appointments
        const [activeAppointments] = await db.query(`
            SELECT COUNT(*) as count FROM Appointments 
            WHERE doctor_id = ? AND status IN ('Pending Confirmation', 'Upcoming', 'In Progress')
        `, [doctorId]);

        if (activeAppointments[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete doctor with active appointments'
            });
        }

        // Soft delete by setting is_active to false
        await db.query(`
            UPDATE Users 
            SET is_active = FALSE 
            WHERE user_id = ? AND user_type = 'Doctor'
        `, [doctorId]);

        // Send notification
        await db.query(`
            INSERT INTO Notifications (user_id, title, message) 
            VALUES (?, ?, ?)
        `, [
            doctorId, 
            'تم إلغاء تفعيل حسابك', 
            'تم إلغاء تفعيل حسابك من قبل الإدارة. يرجى التواصل معنا للمزيد من التفاصيل.'
        ]);

        res.json({
            success: true,
            message: 'Doctor account deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Permanently delete doctor (admin only)
const permanentlyDeleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Check if doctor has any appointments
        const [appointments] = await db.query(`
            SELECT COUNT(*) as count FROM Appointments WHERE doctor_id = ?
        `, [doctorId]);

        if (appointments[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot permanently delete doctor with appointment history'
            });
        }

        // Delete user (will cascade to doctor record)
        await db.query(`
            DELETE FROM Users WHERE user_id = ? AND user_type = 'Doctor'
        `, [doctorId]);

        res.json({
            success: true,
            message: 'Doctor permanently deleted'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reactivate doctor
const reactivateDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        await db.query(`
            UPDATE Users 
            SET is_active = TRUE 
            WHERE user_id = ? AND user_type = 'Doctor'
        `, [doctorId]);

        // Send notification
        await db.query(`
            INSERT INTO Notifications (user_id, title, message) 
            VALUES (?, ?, ?)
        `, [
            doctorId, 
            'تم إعادة تفعيل حسابك', 
            'مرحباً بك مرة أخرى! تم إعادة تفعيل حسابك في منصة شفاء.'
        ]);

        res.json({
            success: true,
            message: 'Doctor account reactivated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get doctor statistics
const getDoctorStats = async (req, res) => {
    try {
        // Total doctors
        const [totalDoctors] = await db.query(`
            SELECT COUNT(*) as total FROM Users WHERE user_type = 'Doctor'
        `);

        // Verified doctors
        const [verifiedDoctors] = await db.query(`
            SELECT COUNT(*) as total FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.is_verified = TRUE AND u.is_active = TRUE
        `);

        // Featured doctors
        const [featuredDoctors] = await db.query(`
            SELECT COUNT(*) as total FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.is_featured = TRUE AND u.is_active = TRUE
        `);

        // New doctors this month
        const [newDoctorsThisMonth] = await db.query(`
            SELECT COUNT(*) as total FROM Users 
            WHERE user_type = 'Doctor' 
            AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);

        res.json({
            success: true,
            data: {
                total: totalDoctors[0].total,
                verified: verifiedDoctors[0].total,
                unverified: totalDoctors[0].total - verifiedDoctors[0].total,
                featured: featuredDoctors[0].total,
                newThisMonth: newDoctorsThisMonth[0].total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    toggleDoctorVerification,
    toggleFeaturedStatus,
    deleteDoctor,
    permanentlyDeleteDoctor,
    reactivateDoctor,
    getDoctorStats
};

