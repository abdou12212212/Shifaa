const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true   // يتحقق من صحة شهادة SSL
  },
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

      const defaultAdmin = {
        full_name: 'Anes Khelil',
        email: 'aneskhalil@gmail.com',
        phone_number: '0699444768',
        password: '@Anes Khelil 1414',
        user_type: 'Admin'
      };

      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

      const [userResult] = await connection.query(
        `INSERT INTO Users (full_name, email, phone_number, password_hash, user_type, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          defaultAdmin.full_name,
          defaultAdmin.email,
          defaultAdmin.phone_number,
          hashedPassword,
          defaultAdmin.user_type,
          1
        ]
      );

      const adminUserId = userResult.insertId;

      await connection.query(
        'INSERT INTO Admins (admin_id) VALUES (?)',
        [adminUserId]
      );

      console.log('[DB INIT] Default admin created successfully!');
      console.log('[DB INIT] Phone:', defaultAdmin.phone_number);
      console.log('[DB INIT] Password:', defaultAdmin.password);
      console.log('[DB INIT] Please change the password after first login!');
    } else {
      console.log('[DB INIT] Admin user exists. Checking password...');
      
      const [adminUser] = await connection.query(
        'SELECT user_id, password_hash FROM Users WHERE user_id = ?',
        [admins[0].user_id]
      );
      
      if (adminUser.length > 0 && !adminUser[0].password_hash) {
        console.log('[DB INIT] Admin has no password. Setting default password...');
        
        const defaultPassword = '@Anes Khelil 1414';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        await connection.query(
          'UPDATE Users SET password_hash = ? WHERE user_id = ?',
          [hashedPassword, adminUser[0].user_id]
        );
        
        console.log('[DB INIT] Admin password set successfully!');
        console.log('[DB INIT] Phone: 0699444768');
        console.log('[DB INIT] Password:', defaultPassword);
        console.log('[DB INIT] Please change the password after first login!');
      } else if (adminUser.length > 0 && adminUser[0].password_hash) {
        console.log('[DB INIT] Admin password hash exists. Skipping password update.');
      } else {
        console.log('[DB INIT] Admin user not found in Users table.');
      }
    }
  } catch (error) {
    console.error('[DB INIT] Error creating first admin:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Fix any users without password_hash (created via appointments)
 */
const fixMissingPasswords = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [usersWithoutPassword] = await connection.query(
      'SELECT user_id, phone_number, user_type FROM Users WHERE password_hash IS NULL'
    );
    
    if (usersWithoutPassword.length > 0) {
      console.log(`[DB INIT] Found ${usersWithoutPassword.length} user(s) without password. Setting default passwords...`);
      
      for (const user of usersWithoutPassword) {
        const defaultPassword = user.phone_number.slice(-6);
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        await connection.query(
          'UPDATE Users SET password_hash = ? WHERE user_id = ?',
          [hashedPassword, user.user_id]
        );
        
        console.log(`[DB INIT] Set password for user ${user.user_id} (${user.user_type})`);
      }
      
      console.log('[DB INIT] All missing passwords have been set!');
    }
  } catch (error) {
    console.error('[DB INIT] Error fixing missing passwords:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

// Test database connection and create admin if needed
pool.getConnection()
  .then(connection => {
    console.log('[DB] Database connected successfully');
    connection.release();

    createFirstAdmin();
    fixMissingPasswords();
  })
  .catch(err => {
    console.error('[DB] Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;