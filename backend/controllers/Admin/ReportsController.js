const db = require('../../config/db');

/**
 * Get comprehensive dashboard statistics and reports
 */
exports.getDashboardReports = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // 'week', 'month', 'year'

    // Get date range based on period
    let appointmentDateFilter = '';
    let appointmentGroupBy = '';
    let userDateFilter = '';
    let userGroupBy = '';

    switch (period) {
      case 'week':
        appointmentDateFilter = 'DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        appointmentGroupBy = 'DATE(a.created_at)';
        userDateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        userGroupBy = 'DATE(created_at)';
        break;
      case 'year':
        appointmentDateFilter = 'YEAR(a.created_at) = YEAR(CURDATE())';
        appointmentGroupBy = 'DATE_FORMAT(a.created_at, "%Y-%m")';
        userDateFilter = 'YEAR(created_at) = YEAR(CURDATE())';
        userGroupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
        break;
      case 'month':
      default:
        appointmentDateFilter = 'MONTH(a.created_at) = MONTH(CURDATE()) AND YEAR(a.created_at) = YEAR(CURDATE())';
        appointmentGroupBy = 'DATE(a.created_at)';
        userDateFilter = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
        userGroupBy = 'DATE(created_at)';
        break;
    }

    // 1. Get total counts
    const [totals] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM Patients p JOIN Users u ON p.patient_id = u.user_id WHERE u.is_active = 1) as total_patients,
        (SELECT COUNT(*) FROM Doctors d JOIN Users u ON d.doctor_id = u.user_id WHERE u.is_active = 1) as total_doctors,
        (SELECT COUNT(*) FROM Assistants a JOIN Users u ON a.assistant_id = u.user_id WHERE u.is_active = 1) as total_assistants,
        (SELECT COUNT(*) FROM Appointments WHERE status = 'Completed') as total_completed_appointments,
        (SELECT COUNT(*) FROM Appointments WHERE status = 'Pending Confirmation') as pending_appointments,
        (SELECT SUM(total_cost) FROM Appointments WHERE status = 'Completed') as total_revenue
    `);

    // 2. Get monthly/weekly patient and doctor registration trends
    const [userTrends] = await db.query(`
      SELECT
        ${userGroupBy} as period,
        SUM(CASE WHEN user_type = 'Patient' THEN 1 ELSE 0 END) as patients_count,
        SUM(CASE WHEN user_type = 'Doctor' THEN 1 ELSE 0 END) as doctors_count
      FROM Users
      WHERE ${userDateFilter}
      GROUP BY ${userGroupBy}
      ORDER BY period ASC
    `);

    // 3. Get revenue by day/month
    const [revenueTrends] = await db.query(`
      SELECT
        ${appointmentGroupBy} as period,
        SUM(total_cost) as revenue,
        COUNT(*) as appointments_count
      FROM Appointments a
      WHERE ${appointmentDateFilter} AND status = 'Completed'
      GROUP BY ${appointmentGroupBy}
      ORDER BY period ASC
    `);

    // 4. Get appointment sources (doctor vs self-booked)
    const [appointmentSources] = await db.query(`
      SELECT
        CASE
          WHEN doctor_id IS NOT NULL THEN 'Doctor Referred'
          ELSE 'Self Booked'
        END as source,
        COUNT(*) as count
      FROM Appointments
      WHERE status != 'Cancelled'
      GROUP BY source
    `);

    // 5. Get top tests by frequency
    const [topTests] = await db.query(`
      SELECT
        mt.test_name,
        mt.test_code,
        COUNT(at.test_id) as test_count,
        SUM(mt.price) as total_revenue
      FROM Appointment_Tests at
      JOIN Medical_Tests mt ON at.test_id = mt.test_id
      JOIN Appointments a ON at.appointment_id = a.appointment_id
      WHERE a.status = 'Completed'
      GROUP BY at.test_id, mt.test_name, mt.test_code
      ORDER BY test_count DESC
      LIMIT 10
    `);

    // 6. Get appointment status distribution
    const [statusDistribution] = await db.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM Appointments
      GROUP BY status
    `);

    // 7. Get monthly revenue breakdown
    const [monthlyRevenue] = await db.query(`
      SELECT
        DATE_FORMAT(a.created_at, '%Y-%m') as month,
        SUM(total_cost) as revenue,
        COUNT(*) as appointments,
        AVG(total_cost) as avg_appointment_value
      FROM Appointments a
      WHERE YEAR(a.created_at) = YEAR(CURDATE()) AND status = 'Completed'
      GROUP BY month
      ORDER BY month ASC
    `);

    // 8. Get payment method distribution
    const [paymentMethods] = await db.query(`
      SELECT
        payment_method,
        COUNT(*) as count,
        SUM(total_cost) as total_amount
      FROM Appointments
      WHERE status = 'Completed'
      GROUP BY payment_method
    `);

    // 9. Get urgent vs normal appointments
    const [urgencyDistribution] = await db.query(`
      SELECT
        CASE WHEN is_urgent = 1 THEN 'Urgent' ELSE 'Normal' END as type,
        COUNT(*) as count
      FROM Appointments
      WHERE status != 'Cancelled'
      GROUP BY is_urgent
    `);

    // 10. Get assistant performance
    const [assistantPerformance] = await db.query(`
      SELECT
        u.full_name as assistant_name,
        COUNT(a.appointment_id) as completed_appointments,
        SUM(a.total_cost) as total_revenue
      FROM Assistants ast
      JOIN Users u ON ast.assistant_id = u.user_id
      LEFT JOIN Appointments a ON ast.assistant_id = a.assistant_id AND a.status = 'Completed'
      WHERE u.is_active = 1
      GROUP BY ast.assistant_id, u.full_name
      ORDER BY completed_appointments DESC
    `);

    res.json({
      success: true,
      data: {
        totals: totals[0],
        userTrends,
        revenueTrends,
        appointmentSources,
        topTests,
        statusDistribution,
        monthlyRevenue,
        paymentMethods,
        urgencyDistribution,
        assistantPerformance
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard reports:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب التقارير',
      error: error.message
    });
  }
};

/**
 * Get detailed financial report
 */
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = 'a.status = "Completed"';
    const params = [];

    if (startDate && endDate) {
      dateFilter += ' AND DATE(a.created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Revenue by test
    const [revenueByTest] = await db.query(`
      SELECT
        mt.test_name,
        mt.test_code,
        COUNT(at.test_id) as times_ordered,
        mt.price as unit_price,
        SUM(mt.price) as total_revenue
      FROM Appointment_Tests at
      JOIN Medical_Tests mt ON at.test_id = mt.test_id
      JOIN Appointments a ON at.appointment_id = a.appointment_id
      WHERE ${dateFilter}
      GROUP BY at.test_id, mt.test_name, mt.test_code, mt.price
      ORDER BY total_revenue DESC
    `, params);

    // Daily revenue
    const [dailyRevenue] = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as appointments,
        SUM(total_cost) as revenue,
        AVG(total_cost) as avg_value
      FROM Appointments a
      WHERE ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, params);

    // Revenue summary
    const [summary] = await db.query(`
      SELECT
        SUM(total_cost) as total_revenue,
        AVG(total_cost) as avg_revenue_per_appointment,
        COUNT(*) as total_appointments,
        SUM(CASE WHEN is_urgent = 1 THEN total_cost ELSE 0 END) as urgent_revenue,
        SUM(CASE WHEN payment_method = 'Cash' THEN total_cost ELSE 0 END) as cash_revenue,
        SUM(CASE WHEN payment_method = 'Card' THEN total_cost ELSE 0 END) as card_revenue
      FROM Appointments a
      WHERE ${dateFilter}
    `, params);

    res.json({
      success: true,
      data: {
        summary: summary[0],
        revenueByTest,
        dailyRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching financial report:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب التقرير المالي',
      error: error.message
    });
  }
};

/**
 * Get patient analytics
 */
exports.getPatientAnalytics = async (req, res) => {
  try {
    // Patient demographics
    const [demographics] = await db.query(`
      SELECT
        gender,
        COUNT(*) as count,
        FLOOR(DATEDIFF(CURDATE(), date_of_birth) / 365.25) as age
      FROM Patients p
      JOIN Users u ON p.patient_id = u.user_id
      WHERE u.is_active = 1 AND date_of_birth IS NOT NULL
      GROUP BY gender, age
    `);

    // Most active patients
    const [activePatients] = await db.query(`
      SELECT
        u.full_name,
        u.phone_number,
        COUNT(a.appointment_id) as total_appointments,
        SUM(a.total_cost) as total_spent,
        MAX(a.created_at) as last_visit
      FROM Patients p
      JOIN Users u ON p.patient_id = u.user_id
      LEFT JOIN Appointments a ON p.patient_id = a.patient_id
      WHERE u.is_active = 1
      GROUP BY p.patient_id, u.full_name, u.phone_number
      HAVING total_appointments > 0
      ORDER BY total_appointments DESC
      LIMIT 20
    `);

    // New patients trend
    const [newPatients] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_patients
      FROM Users
      WHERE user_type = 'Patient' AND YEAR(created_at) = YEAR(CURDATE())
      GROUP BY month
      ORDER BY month ASC
    `);

    res.json({
      success: true,
      data: {
        demographics,
        activePatients,
        newPatients
      }
    });

  } catch (error) {
    console.error('Error fetching patient analytics:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تحليلات المرضى',
      error: error.message
    });
  }
};

module.exports = exports;
