const mysql = require('mysql2/promise'); // ✅ use /promise version
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Create first admin user if no admin exists
 * This runs automatically when the database connection is established
 */
const createFirstAdmin = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if any admin user exists
    const [admins] = await connection.query(
      'SELECT user_id FROM Users WHERE user_type = ? LIMIT 1',
      ['Admin']
    );

    // If no admin exists, create the default admin
    if (admins.length === 0) {
      console.log('[DB INIT] No admin user found. Creating default admin...');

      // Default admin credentials
      const defaultAdmin = {
        full_name: 'Anes Khelil',
        email: 'aneskhalil@gmail.com',
        phone_number: '0699444768',
        password: '@Anes Khelil 1414', // Default password
        user_type: 'Admin'
      };

      // Hash the password
      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

      // Insert into Users table
      const [userResult] = await connection.query(
        `INSERT INTO Users (full_name, email, phone_number, password_hash, user_type, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          defaultAdmin.full_name,
          defaultAdmin.email,
          defaultAdmin.phone_number,
          hashedPassword,
          defaultAdmin.user_type,
          1 // is_active
        ]
      );

      const adminUserId = userResult.insertId;

      // Insert into Admins table
      await connection.query(
        'INSERT INTO Admins (admin_id) VALUES (?)',
        [adminUserId]
      );

      console.log('[DB INIT] ✅ Default admin created successfully!');
      console.log('[DB INIT] Email:', defaultAdmin.email);
      console.log('[DB INIT] Password:', defaultAdmin.password);
      console.log('[DB INIT] ⚠️  Please change the password after first login!');
    } else {
      console.log('[DB INIT] ✅ Admin user exists. Skipping admin creation.');
    }
  } catch (error) {
    console.error('[DB INIT] ❌ Error creating first admin:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

// Test database connection and create admin if needed
pool.getConnection()
  .then(connection => {
    console.log('[DB] ✅ Database connected successfully');
    connection.release();

    // Create first admin after successful connection
    createFirstAdmin();
  })
  .catch(err => {
    console.error('[DB] ❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
