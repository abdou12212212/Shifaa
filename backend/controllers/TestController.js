// TestController.js
const pool = require('../config/db');

/**
 * @route GET /api/tests
 * @desc Get a list of all available medical tests
 * @access Public
 */
const AllTest = async (req, res) => {
  console.log('[API REQUEST]', 'GET', '/api/tests', {
    query: req.query
  });

  const { search } = req.query;

  try {
    let query = 'SELECT test_id, test_code, test_name, sample_type, price FROM Medical_Tests WHERE is_active = 1';
    const params = [];

    if (search) {
      query += ' AND (test_name LIKE ? OR test_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      console.log('[API DB QUERY]', 'Searching medical tests', { search });
    } else {
      console.log('[API DB QUERY]', 'Fetching all active medical tests');
    }

    const [tests] = await pool.query(query, params);

    console.log('[API SUCCESS]', 'GET', '/api/tests', {
      testCount: tests.length,
      status: 200
    });

    res.json(tests);
  } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/tests', {
      error: err.message,
      stack: err.stack,
      status: 500
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error while fetching tests' });
  }
};

/**
 * @route GET /api/tests/:id
 * @desc Get details for a specific medical test
 * @access Public
 */
const TestDetails = async (req, res) => {
  console.log('[API REQUEST]', 'GET', '/api/tests/:id', {
    params: req.params,
    query: req.query
  });

  const { id } = req.params;

  if (!id) {
    console.log('[API ERROR]', 'GET', '/api/tests/:id', 'Missing test ID');
    return res.status(400).json({ msg: 'Test ID is required' });
  }

  try {
    console.log('[API DB QUERY]', 'Fetching test details', { testId: id });

    const [[test]] = await pool.query(
      `SELECT test_id, test_code, test_name, price, description, pre_test_instructions, sample_type, container_type, turnaround_time , urgent_test_name , result_turnaround_time
       FROM Medical_Tests WHERE test_id = ?`,
      [id]
    );

    if (!test) {
      console.log('[API ERROR]', 'GET', '/api/tests/:id', 'Test not found', { testId: id });
      return res.status(404).json({ msg: 'Test not found' });
    }

    console.log('[API SUCCESS]', 'GET', '/api/tests/:id', {
      testId: id,
      testCode: test.test_code,
      status: 200
    });

    res.json(test);
  } catch (err) {
    console.log('[API ERROR]', 'GET', '/api/tests/:id', {
      error: err.message,
      stack: err.stack,
      status: 500,
      testId: id
    });
    console.error(err);
    res.status(500).json({ msg: 'Server error while fetching test details' });
  }
};

module.exports = {
  AllTest,
  TestDetails,
};
