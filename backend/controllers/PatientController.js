const pool = require('../config/db');

// GET patient profile
const PatientProfile = async (req, res) => {
  console.log('[API REQUEST]', 'GET', '/api/patients/:id', {
    params: req.params,
    query: req.query,
    user: req.user
  });

    const { id } = req.params;
    
  if (!id) {
    console.log('[API ERROR]', 'GET', '/api/patients/:id', 'Missing patient ID');
    return res.status(400).json({ msg: 'Patient ID is required' });
  }

    try {
    console.log('[API DB QUERY]', 'Fetching patient profile', { patientId: id });
        const [rows] = await pool.query(
            `SELECT u.user_id, u.full_name, u.phone_number, p.date_of_birth, p.gender 
             FROM Users u 
             JOIN Patients p ON u.user_id = p.patient_id 
             WHERE p.patient_id = ?`,
            [id]
        );

    if (rows.length === 0) {
      console.log('[API ERROR]', 'GET', '/api/patients/:id', 'Patient not found', { patientId: id });
      return res.status(404).json({ msg: 'Patient not found' });
    }

    console.log('[API SUCCESS]', 'GET', '/api/patients/:id', {
      patientId: id,
      status: 200
    });

        res.json(rows[0]);
    } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/patients/:id', {
      error: err.message,
      stack: err.stack,
      status: 500,
      patientId: id
    });
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};


// UPDATE patient profile
const PatientUpdate = async (req, res) => {
  console.log('[API REQUEST]', 'PUT', '/api/patients/:id', {
    params: req.params,
    body: req.body,
    query: req.query,
    user: req.user
  });

    const { id } = req.params;
    const { fullName, dateOfBirth, gender } = req.body;

  if (!id) {
    console.log('[API ERROR]', 'PUT', '/api/patients/:id', 'Missing patient ID');
    return res.status(400).json({ msg: 'Patient ID is required' });
  }

  if (!fullName || !dateOfBirth || !gender) {
    console.log('[API ERROR]', 'PUT', '/api/patients/:id', 'Missing required fields', {
      fullName: !!fullName,
      dateOfBirth: !!dateOfBirth,
      gender: !!gender
    });
    return res.status(400).json({ msg: 'All fields are required' });
  }

    try {
    console.log('[API DB QUERY]', 'Updating patient profile', { patientId: id });
        
        await pool.query('UPDATE Users SET full_name = ? WHERE user_id = ?', [fullName, id]);
        await pool.query('UPDATE Patients SET date_of_birth = ?, gender = ? WHERE patient_id = ?', [dateOfBirth, gender, id]);
        
    console.log('[API SUCCESS]', 'PUT', '/api/patients/:id', {
      patientId: id,
      status: 200,
      updates: { fullName, dateOfBirth, gender }
    });

        res.json({ msg: 'Profile updated successfully' });
    } catch (err) {
    console.log('[API ERROR]', 'PUT', '/api/patients/:id', {
      error: err.message,
      stack: err.stack,
      status: 500,
      patientId: id
    });
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};


// GET all addresses for a patient
const PatientAdresses = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT address_id, address_line1, address_line2, city, is_default FROM Addresses WHERE patient_id = ?',
            [id]
        );
        res.json(rows);
  } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/patients/:id/addresses', {
      error: err.message,
      stack: err.stack,
      status: 500,
      patientId: id
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ADD a new address for a patient
const AddAdresse = async (req, res) => {
    const { id } = req.params;
    const { address_line1, address_line2, city, is_default = false } = req.body;

    try {
        await pool.query(
            'INSERT INTO Addresses (patient_id, address_line1, address_line2, city, is_default) VALUES (?, ?, ?, ?, ?)',
            [id, address_line1, address_line2, city, is_default]
        );
        res.status(201).json({ msg: 'Address added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};


const saveLocation = async (req, res) => {
  const { patient_id, latitude, longitude } = req.body;

  try {
    await db.query(
      `INSERT INTO Addresses (patient_id, latitude, longitude) VALUES (?, ?, ?)`,
      [patient_id, latitude, longitude]
    );
    res.status(201).json({ message: 'Location saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

// GET /api/location/:patient_id
const getLocation = async (req, res) => {
  const { patient_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT latitude, longitude FROM Addresses WHERE patient_id = ? ORDER BY address_id DESC LIMIT 1`,
      [patient_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(rows[0]); // { latitude: ..., longitude: ... }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

module.exports = {
    PatientProfile,
    PatientUpdate,
    PatientAdresses,
    AddAdresse,
    getLocation,
    saveLocation,
}
