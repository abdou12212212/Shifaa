// controllers/Admin/Admin3.js
const db = require('../../config/db');
const bcrypt = require('bcrypt');

// Get all doctors with search, filter and verification status
const getDoctors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'all';

        let whereClause = `WHERE u.user_type = 'Doctor'`;
        let queryParams = [];

        if (search) {
            whereClause += ` AND (u.full_name LIKE ? OR u.phone_number LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

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
                (SELECT COUNT(DISTINCT a.patient_id) 
                 FROM Appointments a 
                 WHERE a.doctor_id = d.doctor_id AND a.status = 'Completed') as total_patients
            FROM Users u
            JOIN Doctors d ON u.user_id = d.doctor_id
            ${whereClause}
            ORDER BY d.is_verified DESC, u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

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
        console.error('[getDoctors] Error:', error);
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
        console.error('[getDoctorById] Error:', error);
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

        if (!full_name || !phone_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, phone number, and password are required'
            });
        }

        const [existingUser] = await db.query(`
            SELECT user_id FROM Users WHERE phone_number = ?
        `, [phone_number]);

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number already exists' 
            });
        }

        const password_hash = await bcrypt.hash(password, 10);

        await db.query('START TRANSACTION');

        try {
            const [userResult] = await db.query(`
                INSERT INTO Users (full_name, phone_number, password_hash, user_type)
                VALUES (?, ?, ?, 'Doctor')
            `, [full_name, phone_number, password_hash]);

            const userId = userResult.insertId;

            await db.query(`
                INSERT INTO Doctors (doctor_id, clinic_address, is_verified, is_featured)
                VALUES (?, ?, ?, ?)
            `, [userId, clinic_address, is_verified, is_featured]);

            await db.query('COMMIT');

            await db.query(`
                INSERT INTO Notifications (user_id, title, message) 
                VALUES (?, ?, ?)
            `, [
                userId, 
                'Welcome to Shiifa', 
                'Your doctor account has been created successfully.'
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
        console.error('[createDoctor] Error:', error);
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

        await db.query(`
            UPDATE Users 
            SET full_name = ?, phone_number = ?, is_active = ?
            WHERE user_id = ? AND user_type = 'Doctor'
        `, [full_name, phone_number, is_active, doctorId]);

        await db.query(`
            UPDATE Doctors 
            SET clinic_address = ?, is_verified = ?, is_featured = ?
            WHERE doctor_id = ?
        `, [clinic_address, is_verified, is_featured, doctorId]);

        if (typeof is_verified === 'boolean') {
            const notificationTitle = is_verified ? 'Account Verified' : 'Account Unverified';
            const notificationMessage = is_verified ? 
                'Congratulations! Your doctor account has been verified.' : 
                'Your doctor account has been unverified. Please contact support.';

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
        console.error('[updateDoctor] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle doctor verification status
const toggleDoctorVerification = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const [currentStatus] = await db.query(`
            SELECT is_verified FROM Doctors WHERE doctor_id = ?
        `, [doctorId]);

        if (currentStatus.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const newStatus = !currentStatus[0].is_verified;

        await db.query(`
            UPDATE Doctors SET is_verified = ? WHERE doctor_id = ?
        `, [newStatus, doctorId]);

        const notificationTitle = newStatus ? 'Account Verified' : 'Account Unverified';
        const notificationMessage = newStatus ? 
            'Congratulations! Your doctor account has been verified on Shiifa platform.' : 
            'Your doctor account has been unverified. Please contact support.';

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
        console.error('[toggleDoctorVerification] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle featured status
const toggleFeaturedStatus = async (req, res) => {
    try {
        const { doctorId } = req.params;

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
        console.error('[toggleFeaturedStatus] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete doctor (permanent delete - hard delete)
const deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        console.log('[DELETE DOCTOR] Starting - Doctor ID:', doctorId);

        // Check if doctor exists
        const [doctor] = await db.query(`
            SELECT d.doctor_id, u.is_active 
            FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.doctor_id = ?
        `, [doctorId]);

        if (doctor.length === 0) {
            console.log('[DELETE DOCTOR] Doctor not found');
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Check if doctor has ANY appointments (past or future)
        const [appointments] = await db.query(`
            SELECT COUNT(*) as count FROM Appointments WHERE doctor_id = ?
        `, [doctorId]);

        if (appointments[0].count > 0) {
            console.log('[DELETE DOCTOR] Doctor has appointments:', appointments[0].count);
            return res.status(400).json({
                success: false,
                message: `Cannot delete doctor with ${appointments[0].count} appointment(s). Please delete or reassign appointments first.`
            });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        try {
            // Delete from Doctors table first (will cascade? depends on foreign key)
            await db.query(`
                DELETE FROM Doctors WHERE doctor_id = ?
            `, [doctorId]);

            // Delete from Users table (this will cascade to other related tables)
            await db.query(`
                DELETE FROM Users WHERE user_id = ? AND user_type = 'Doctor'
            `, [doctorId]);

            await db.query('COMMIT');

            console.log('[DELETE DOCTOR] Success - Doctor permanently deleted:', doctorId);

            res.json({
                success: true,
                message: 'Doctor permanently deleted successfully'
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('[DELETE DOCTOR] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete doctor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Permanently delete doctor (admin only - no appointments allowed)
const permanentlyDeleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        console.log('[PERMANENT DELETE DOCTOR] Starting - Doctor ID:', doctorId);

        // Check if doctor exists
        const [doctor] = await db.query(`
            SELECT doctor_id FROM Doctors WHERE doctor_id = ?
        `, [doctorId]);

        if (doctor.length === 0) {
            console.log('[PERMANENT DELETE DOCTOR] Doctor not found');
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Check if doctor has ANY appointments (past or future)
        const [appointments] = await db.query(`
            SELECT COUNT(*) as count FROM Appointments WHERE doctor_id = ?
        `, [doctorId]);

        if (appointments[0].count > 0) {
            console.log('[PERMANENT DELETE DOCTOR] Doctor has appointments:', appointments[0].count);
            return res.status(400).json({
                success: false,
                message: `Cannot permanently delete doctor with ${appointments[0].count} appointment(s).`
            });
        }

        // Delete user (will cascade to doctor record)
        await db.query(`
            DELETE FROM Users WHERE user_id = ? AND user_type = 'Doctor'
        `, [doctorId]);

        console.log('[PERMANENT DELETE DOCTOR] Success - Doctor permanently deleted:', doctorId);

        res.json({
            success: true,
            message: 'Doctor permanently deleted successfully'
        });
    } catch (error) {
        console.error('[PERMANENT DELETE DOCTOR] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to permanently delete doctor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Reactivate doctor
const reactivateDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        console.log('[REACTIVATE DOCTOR] Starting - Doctor ID:', doctorId);

        // Check if doctor exists
        const [doctor] = await db.query(`
            SELECT user_id FROM Users WHERE user_id = ? AND user_type = 'Doctor'
        `, [doctorId]);

        if (doctor.length === 0) {
            console.log('[REACTIVATE DOCTOR] Doctor not found');
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        await db.query(`
            UPDATE Users SET is_active = TRUE WHERE user_id = ?
        `, [doctorId]);

        await db.query(`
            INSERT INTO Notifications (user_id, title, message, type, created_at)
            VALUES (?, ?, ?, 'System', NOW())
        `, [
            doctorId,
            'Account Reactivated',
            'Welcome back! Your doctor account has been reactivated.'
        ]);

        console.log('[REACTIVATE DOCTOR] Success - Doctor reactivated:', doctorId);

        res.json({
            success: true,
            message: 'Doctor account reactivated successfully'
        });
    } catch (error) {
        console.error('[REACTIVATE DOCTOR] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reactivate doctor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get doctor statistics
const getDoctorStats = async (req, res) => {
    try {
        const [totalDoctors] = await db.query(`
            SELECT COUNT(*) as total FROM Users WHERE user_type = 'Doctor'
        `);

        const [verifiedDoctors] = await db.query(`
            SELECT COUNT(*) as total FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.is_verified = TRUE AND u.is_active = TRUE
        `);

        const [featuredDoctors] = await db.query(`
            SELECT COUNT(*) as total FROM Doctors d
            JOIN Users u ON d.doctor_id = u.user_id
            WHERE d.is_featured = TRUE AND u.is_active = TRUE
        `);

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
        console.error('[getDoctorStats] Error:', error);
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