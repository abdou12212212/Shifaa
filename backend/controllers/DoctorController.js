const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Make sure this exports a MySQL pool

/**
 * @route GET /api/doctors
 * @desc Get a list of all verified doctors
 * @access Public
 */
const VerifiedDoctors = async (req, res) => {
    try {
        const [rows] = await pool.query(
        `SELECT d.doctor_id, u.full_name, d.is_featured 
        FROM Doctors d 
        JOIN Users u ON d.doctor_id = u.user_id 
        WHERE d.is_verified = TRUE`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error while fetching doctors' });
    }
};

/**
 * @route GET /api/doctors/:id
 * @desc Get profile for a specific doctor
 * @access Public
 */
const DoctorProfile = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(
        `SELECT d.doctor_id, u.full_name, d.clinic_address, d.is_verified
        FROM Doctors d
        JOIN Users u ON d.doctor_id = u.user_id
        WHERE d.doctor_id = ?`,
        [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error while fetching doctor profile' });
    }
};

/**
 * @route PUT /api/doctors/:id
 * @desc Update doctor profile
 * @access Private (Doctor only)
 */
const DoctorUpdate = async (req, res) => {
    const { id } = req.params;
    const { clinic_address } = req.body;

    try {
        await pool.query(
            'UPDATE Doctors SET clinic_address = ? WHERE doctor_id = ?',
            [clinic_address, id]
        );
        res.json({ msg: 'Doctor profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error while updating profile' });
    }
};

/**
 * @route GET /api/doctors/:id/appointments
 * @desc Get all appointments associated with a doctor
 * @access Private (Doctor only)
 */
const DoctorAppointments = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT 
                a.appointment_id, 
                a.status, 
                u.full_name AS patient_name 
            FROM Appointments a
            JOIN Users u ON a.patient_id = u.user_id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_datetime DESC
        `, [id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error while fetching appointments' });
    }
};

module.exports = {
    VerifiedDoctors,
    DoctorProfile,
    DoctorUpdate,
    DoctorAppointments,
}
