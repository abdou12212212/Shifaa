// controllers/assistantController.js
const db = require('../../config/db');
const bcrypt = require('bcrypt');

// Get all assistants with pagination and search
const getAssistants = async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.user_id,
                u.full_name,
                u.phone_number,
                u.is_active,
                u.created_at,
                u.profile_picture_url,
                COUNT(ap.appointment_id) as total_appointments
            FROM Users u
            INNER JOIN Assistants a ON u.user_id = a.assistant_id
            LEFT JOIN Appointments ap ON a.assistant_id = ap.assistant_id
            WHERE u.user_type = 'Assistant'
            GROUP BY u.user_id
            ORDER BY u.created_at DESC
        `;

        const [rows] = await db.execute(sql);

        res.json({
            success: true,
            data: { assistants: rows }
        });
    } catch (error) {
        console.error('Error fetching assistants:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب بيانات المساعدين'
        });
    }
};




// Create new assistant
const createAssistant = async (req, res) => {
    let connection;

    try {
        const { full_name, phone_number, password } = req.body;

        console.log('[CREATE ASSISTANT] Starting - Request from user:', req.user?.id);
        console.log('[CREATE ASSISTANT] Body:', { full_name, phone_number, password: '***' });

        // Validation
        if (!full_name || !phone_number || !password) {
            console.log('[CREATE ASSISTANT] Validation failed - missing fields');
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }

        // Check if phone number already exists
        console.log('[CREATE ASSISTANT] Checking if phone exists:', phone_number);
        const [existingUser] = await db.query(
            'SELECT user_id FROM Users WHERE phone_number = ?',
            [phone_number]
        );

        if (existingUser.length > 0) {
            console.log('[CREATE ASSISTANT] Phone number already exists:', phone_number);
            return res.status(400).json({
                success: false,
                message: 'رقم الهاتف مسجل مسبقاً'
            });
        }

        // Hash password
        console.log('[CREATE ASSISTANT] Hashing password...');
        const password_hash = await bcrypt.hash(password, 10);
        console.log('[CREATE ASSISTANT] Password hashed successfully');

        // Get connection for transaction
        console.log('[CREATE ASSISTANT] Getting database connection...');
        connection = await db.getConnection();
        console.log('[CREATE ASSISTANT] Connection obtained, starting transaction...');
        await connection.beginTransaction();

        try {
            // Insert into Users table
            console.log('[CREATE ASSISTANT] Inserting into Users table...');
            const [userResult] = await connection.query(
                `INSERT INTO Users (full_name, phone_number, password_hash, user_type)
                 VALUES (?, ?, ?, 'Assistant')`,
                [full_name, phone_number, password_hash]
            );

            const userId = userResult.insertId;
            console.log('[CREATE ASSISTANT] User created with ID:', userId);

            // Insert into Assistants table
            console.log('[CREATE ASSISTANT] Inserting into Assistants table...');
            await connection.query(
                'INSERT INTO Assistants (assistant_id) VALUES (?)',
                [userId]
            );
            console.log('[CREATE ASSISTANT] Assistant record created');

            console.log('[CREATE ASSISTANT] Committing transaction...');
            await connection.commit();
            console.log('[CREATE ASSISTANT] Transaction committed successfully');

            res.status(201).json({
                success: true,
                message: 'تم إنشاء حساب المساعد بنجاح',
                data: {
                    user_id: userId,
                    full_name,
                    phone_number
                }
            });

        } catch (error) {
            console.error('[CREATE ASSISTANT] Transaction error:', error.message);
            console.error('[CREATE ASSISTANT] Error stack:', error.stack);
            console.error('[CREATE ASSISTANT] SQL Error Code:', error.code);
            console.error('[CREATE ASSISTANT] SQL Error:', error.sqlMessage);
            await connection.rollback();
            console.log('[CREATE ASSISTANT] Transaction rolled back');
            throw error;
        } finally {
            if (connection) {
                connection.release();
                console.log('[CREATE ASSISTANT] Connection released');
            }
        }

    } catch (error) {
        console.error('[CREATE ASSISTANT] Fatal error:', error.message);
        console.error('[CREATE ASSISTANT] Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء حساب المساعد',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                sqlMessage: error.sqlMessage
            } : undefined
        });
    }
};

// Update assistant status (activate/deactivate)
const updateAssistantStatus = async (req, res) => {
    try {
        const { assistantId } = req.params;
        const { is_active } = req.body;
        
        const [result] = await db.execute(
            'UPDATE Users SET is_active = ? WHERE user_id = ? AND user_type = "Assistant"',
            [is_active, assistantId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'المساعد غير موجود'
            });
        }
        
        res.json({
            success: true,
            message: is_active ? 'تم تفعيل المساعد بنجاح' : 'تم إلغاء تفعيل المساعد بنجاح'
        });
        
    } catch (error) {
        console.error('Error updating assistant status:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث حالة المساعد'
        });
    }
};

// Delete assistant
const deleteAssistant = async (req, res) => {
    try {
        const { assistantId } = req.params;
        
        // Check if assistant has any appointments
        const [appointments] = await db.execute(
            'SELECT COUNT(*) as count FROM Appointments WHERE assistant_id = ?',
            [assistantId]
        );
        
        if (appointments[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف المساعد لوجود مواعيد مرتبطة به'
            });
        }
        
        // Delete assistant (CASCADE will handle Assistants table)
        const [result] = await db.execute(
            'DELETE FROM Users WHERE user_id = ? AND user_type = "Assistant"',
            [assistantId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'المساعد غير موجود'
            });
        }
        
        res.json({
            success: true,
            message: 'تم حذف المساعد بنجاح'
        });
        
    } catch (error) {
        console.error('Error deleting assistant:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف المساعد'
        });
    }
};

// Get assistant details
const getAssistantDetails = async (req, res) => {
    try {
        const { assistantId } = req.params;
        
        const [assistant] = await db.execute(`
            SELECT 
                u.user_id,
                u.full_name,
                u.phone_number,
                u.is_active,
                u.created_at,
                u.profile_picture_url,
                COUNT(ap.appointment_id) as total_appointments,
                COUNT(CASE WHEN ap.status = 'Completed' THEN 1 END) as completed_appointments,
                COUNT(CASE WHEN ap.status = 'In Progress' THEN 1 END) as in_progress_appointments
            FROM Users u 
            INNER JOIN Assistants a ON u.user_id = a.assistant_id 
            LEFT JOIN Appointments ap ON a.assistant_id = ap.assistant_id
            WHERE u.user_id = ? AND u.user_type = 'Assistant'
            GROUP BY u.user_id, u.full_name, u.phone_number, u.is_active, u.created_at, u.profile_picture_url
        `, [assistantId]);
        
        if (assistant.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المساعد غير موجود'
            });
        }
        
        // Get recent appointments
        const [recentAppointments] = await db.execute(`
            SELECT 
                ap.appointment_id,
                ap.appointment_ref_id,
                ap.appointment_datetime,
                ap.status,
                u.full_name as patient_name,
                addr.address_line1,
                addr.city
            FROM Appointments ap
            INNER JOIN Patients p ON ap.patient_id = p.patient_id
            INNER JOIN Users u ON p.patient_id = u.user_id
            INNER JOIN Addresses addr ON ap.address_id = addr.address_id
            WHERE ap.assistant_id = ?
            ORDER BY ap.appointment_datetime DESC
            LIMIT 10
        `, [assistantId]);
        
        res.json({
            success: true,
            data: {
                assistant: assistant[0],
                recentAppointments
            }
        });
        
    } catch (error) {
        console.error('Error fetching assistant details:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل المساعد'
        });
    }
};

module.exports = {
    getAssistants,
    createAssistant,
    updateAssistantStatus,
    deleteAssistant,
    getAssistantDetails
};

