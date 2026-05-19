// controllers/patientController.js
const db = require('../../config/db');

// Get all patients with search and filter
const getPatients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'all'; // all, active, inactive

        let whereClause = `WHERE u.user_type = 'Patient'`;
        let queryParams = [];

        // Add search filter
        if (search) {
            whereClause += ` AND (u.full_name LIKE ? OR u.phone_number LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Add status filter
        if (status === 'active') {
            whereClause += ` AND u.is_active = TRUE`;
        } else if (status === 'inactive') {
            whereClause += ` AND u.is_active = FALSE`;
        }

        const [patients] = await db.query(`
            SELECT 
                u.user_id,
                u.full_name,
                u.phone_number,
                p.gender,
                p.date_of_birth,
                u.created_at,
                u.is_active
            FROM Users u
            LEFT JOIN Patients p ON u.user_id = p.patient_id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        // Get total count for pagination
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total FROM Users u
            LEFT JOIN Patients p ON u.user_id = p.patient_id
            ${whereClause}
        `, queryParams);

        const totalPages = Math.ceil(countResult[0].total / limit);

        res.json({
            success: true,
            data: {
                patients,
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

// Get single patient by ID
const getPatientById = async (req, res) => {
    try {
        const { patientId } = req.params;

        const [patient] = await db.query(`
            SELECT 
                u.user_id,
                u.full_name,
                u.phone_number,
                u.profile_picture_url,
                u.created_at,
                u.is_active,
                p.date_of_birth,
                p.gender
            FROM Users u
            LEFT JOIN Patients p ON u.user_id = p.patient_id
            WHERE u.user_id = ? AND u.user_type = 'Patient'
        `, [patientId]);

        if (patient.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Get patient addresses
        const [addresses] = await db.query(`
            SELECT 
                address_id,
                address_line1,
                address_line2,
                city,
                is_default
            FROM Addresses 
            WHERE patient_id = ?
            ORDER BY is_default DESC, address_id ASC
        `, [patientId]);

        // Get patient appointments count
        const [appointmentsCount] = await db.query(`
            SELECT COUNT(*) as total_appointments FROM Appointments 
            WHERE patient_id = ?
        `, [patientId]);

        res.json({
            success: true,
            data: {
                ...patient[0],
                addresses,
                total_appointments: appointmentsCount[0].total_appointments
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new patient
const createPatient = async (req, res) => {
    try {
        const {
            full_name,
            phone_number,
            password,
            date_of_birth,
            gender,
            address_line1,
            address_line2,
            city
        } = req.body;

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

        // Hash password (implement proper password hashing)
        const bcrypt = require('bcrypt');
        const password_hash = await bcrypt.hash(password || "12345678", 10);

        // Start transaction
        await db.query('START TRANSACTION');

        try {
            // Insert user
            const [userResult] = await db.query(`
                INSERT INTO Users (full_name, phone_number, password_hash, user_type)
                VALUES (?, ?, ?, 'Patient')
            `, [full_name, phone_number, password_hash]);

            const userId = userResult.insertId;

            // Insert patient details
            await db.query(`
                INSERT INTO Patients (patient_id, date_of_birth, gender)
                VALUES (?, ?, ?)
            `, [userId, date_of_birth, gender]);

            // Insert address if provided
            if (address_line1) {
                await db.query(`
                    INSERT INTO Addresses (patient_id, address_line1, address_line2, city, is_default)
                    VALUES (?, ?, ?, ?, TRUE)
                `, [userId, address_line1, address_line2, city]);
            }

            await db.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Patient created successfully',
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

// Update patient information
const updatePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const {
            full_name,
            phone_number,
            date_of_birth,
            gender,
            is_active
        } = req.body;

        // Check if phone number exists for other users
        const [existingUser] = await db.query(`
            SELECT user_id FROM Users 
            WHERE phone_number = ? AND user_id != ?
        `, [phone_number, patientId]);

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
            WHERE user_id = ? AND user_type = 'Patient'
        `, [full_name, phone_number, is_active, patientId]);

        // Update patient table
        await db.query(`
            UPDATE Patients 
            SET date_of_birth = ?, gender = ?
            WHERE patient_id = ?
        `, [date_of_birth, gender, patientId]);

        res.json({
            success: true,
            message: 'Patient updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete patient (HARD DELETE - permanently remove from database)
const deletePatient = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check if patient has any appointments (past or future)
        const [appointments] = await db.query(`
            SELECT COUNT(*) as count FROM Appointments 
            WHERE patient_id = ?
        `, [patientId]);

        if (appointments[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete patient with appointment history. Please delete appointments first.'
            });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        try {
            // Delete from Addresses first (foreign key constraint)
            await db.query(`
                DELETE FROM Addresses WHERE patient_id = ?
            `, [patientId]);

            // Delete from Patients table
            await db.query(`
                DELETE FROM Patients WHERE patient_id = ?
            `, [patientId]);

            // Delete from Users table
            await db.query(`
                DELETE FROM Users WHERE user_id = ? AND user_type = 'Patient'
            `, [patientId]);

            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Patient permanently deleted successfully'
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('[DELETE PATIENT] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Permanently delete patient (admin only)
const permanentlyDeletePatient = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check if patient has any appointments
        const [appointments] = await db.query(`
            SELECT COUNT(*) as count FROM Appointments WHERE patient_id = ?
        `, [patientId]);

        if (appointments[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot permanently delete patient with appointment history'
            });
        }

        // Delete user (will cascade to patient and addresses)
        await db.query(`
            DELETE FROM Users WHERE user_id = ? AND user_type = 'Patient'
        `, [patientId]);

        res.json({
            success: true,
            message: 'Patient permanently deleted'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get patient statistics
const getPatientStats = async (req, res) => {
    try {
        // Total patients
        const [totalPatients] = await db.query(`
            SELECT COUNT(*) as total FROM Users WHERE user_type = 'Patient'
        `);

        // Active patients
        const [activePatients] = await db.query(`
            SELECT COUNT(*) as total FROM Users 
            WHERE user_type = 'Patient' AND is_active = TRUE
        `);

        // New patients this month
        const [newPatientsThisMonth] = await db.query(`
            SELECT COUNT(*) as total FROM Users 
            WHERE user_type = 'Patient' 
            AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);

        // Gender distribution
        const [genderStats] = await db.query(`
            SELECT 
                p.gender,
                COUNT(*) as count
            FROM Users u
            JOIN Patients p ON u.user_id = p.patient_id
            WHERE u.is_active = TRUE
            GROUP BY p.gender
        `);

        res.json({
            success: true,
            data: {
                total: totalPatients[0].total,
                active: activePatients[0].total,
                inactive: totalPatients[0].total - activePatients[0].total,
                newThisMonth: newPatientsThisMonth[0].total,
                genderDistribution: genderStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reactivate patient
const reactivatePatient = async (req, res) => {
    try {
        const { patientId } = req.params;

        await db.query(`
            UPDATE Users 
            SET is_active = TRUE 
            WHERE user_id = ? AND user_type = 'Patient'
        `, [patientId]);

        res.json({
            success: true,
            message: 'Patient reactivated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    permanentlyDeletePatient,
    getPatientStats,
    reactivatePatient
};







