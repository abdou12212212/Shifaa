import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { useDashboardReports } from '../hooks/useReports';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Reports() {
  const [period, setPeriod] = useState('month');
  const { data: reportsData, isLoading, isError, error, refetch } = useDashboardReports(period);

  // Process data for charts
  const chartData = useMemo(() => {
    if (!reportsData?.data) return null;

    const { userTrends, revenueTrends, appointmentSources, topTests, statusDistribution, paymentMethods } = reportsData.data;

    // 1. User Trends Chart (Line Chart)
    const userTrendsLabels = userTrends.map(item => {
      const date = new Date(item.period);
      return date.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' });
    });

    const userTrendsData = {
      labels: userTrendsLabels,
      datasets: [
        {
          label: 'مرضى جدد',
          data: userTrends.map(item => item.patients_count),
          backgroundColor: 'rgba(0,191,166,0.3)',
          borderColor: '#00BFA6',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'أطباء جدد',
          data: userTrends.map(item => item.doctors_count),
          backgroundColor: 'rgba(255,82,82,0.3)',
          borderColor: '#FF5252',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    // 2. Revenue Trends Chart (Bar Chart)
    const revenueTrendsLabels = revenueTrends.map(item => {
      const date = new Date(item.period);
      return date.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' });
    });

    const revenueTrendsData = {
      labels: revenueTrendsLabels,
      datasets: [
        {
          label: 'الدخل (دج)',
          data: revenueTrends.map(item => parseFloat(item.revenue) || 0),
          backgroundColor: '#0097A7',
        },
      ],
    };

    // 3. Appointment Sources Chart (Doughnut)
    const appointmentSourcesData = {
      labels: appointmentSources.map(item => item.source === 'Doctor Referred' ? 'من طرف الطبيب' : 'حجز ذاتي'),
      datasets: [
        {
          data: appointmentSources.map(item => item.count),
          backgroundColor: ['#F44336', '#3F51B5'],
        },
      ],
    };

    // 4. Top Tests Chart (Horizontal Bar)
    const topTestsData = {
      labels: topTests.slice(0, 5).map(item => item.test_name),
      datasets: [
        {
          label: 'عدد الطلبات',
          data: topTests.slice(0, 5).map(item => item.test_count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
          ],
        },
      ],
    };

    // 5. Appointment Status Distribution (Pie)
    const statusColors = {
      'Completed': '#4CAF50',
      'Pending Confirmation': '#FFC107',
      'Upcoming': '#2196F3',
      'In Progress': '#FF9800',
      'Cancelled': '#F44336'
    };

    const statusLabels = {
      'Completed': 'مكتمل',
      'Pending Confirmation': 'في الانتظار',
      'Upcoming': 'قادم',
      'In Progress': 'قيد التنفيذ',
      'Cancelled': 'ملغى'
    };

    const statusDistributionData = {
      labels: statusDistribution.map(item => statusLabels[item.status] || item.status),
      datasets: [
        {
          data: statusDistribution.map(item => item.count),
          backgroundColor: statusDistribution.map(item => statusColors[item.status] || '#999'),
        },
      ],
    };

    // 6. Payment Methods Chart (Doughnut)
    const paymentMethodsData = {
      labels: paymentMethods.map(item =>
        item.payment_method === 'Cash' ? 'نقداً' :
        item.payment_method === 'Card' ? 'بطاقة' : 'غير محدد'
      ),
      datasets: [
        {
          data: paymentMethods.map(item => item.count),
          backgroundColor: ['#4CAF50', '#2196F3', '#9E9E9E'],
        },
      ],
    };

    return {
      userTrendsData,
      revenueTrendsData,
      appointmentSourcesData,
      topTestsData,
      statusDistributionData,
      paymentMethodsData
    };
  }, [reportsData]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y', // Horizontal bar
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '1.2rem',
        color: '#00BFA6'
      }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p>جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        gap: '1rem'
      }}>
        <p style={{ color: '#F44336', fontSize: '1.1rem' }}>
          خطأ في تحميل التقارير: {error?.message || 'حدث خطأ غير متوقع'}
        </p>
        <button
          onClick={() => refetch()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#00BFA6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#999'
      }}>
        لا توجد بيانات لعرضها
      </div>
    );
  }

  const { totals } = reportsData.data;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }} dir="rtl">
      {/* Header with Period Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>التقارير والإحصائيات</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: period === p ? '#00BFA6' : '#f0f0f0',
                color: period === p ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: period === p ? 'bold' : 'normal'
              }}
            >
              {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'سنة'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#E8F5E9',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>إجمالي المرضى</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
            {totals?.total_patients || 0}
          </p>
        </div>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#E3F2FD',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>إجمالي الأطباء</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
            {totals?.total_doctors || 0}
          </p>
        </div>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#FFF3E0',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>المواعيد المكتملة</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF9800' }}>
            {totals?.total_completed_appointments || 0}
          </p>
        </div>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#F3E5F5',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>إجمالي الإيرادات</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9C27B0' }}>
            {parseFloat(totals?.total_revenue || 0).toLocaleString('ar-DZ')} دج
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* User Trends - Line Chart */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>
            اتجاهات المستخدمين الجدد
          </h2>
          <div style={{ height: '300px' }}>
            <Line data={chartData.userTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Trends - Bar Chart */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>
            اتجاهات الإيرادات
          </h2>
          <div style={{ height: '300px' }}>
            <Bar data={chartData.revenueTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Appointment Sources - Doughnut */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>
            مصادر المواعيد
          </h2>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Doughnut data={chartData.appointmentSourcesData} options={chartOptions} />
          </div>
        </div>

        {/* Top Tests - Horizontal Bar */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>
            أكثر التحاليل طلباً
          </h2>
          <div style={{ height: '300px' }}>
            <Bar data={chartData.topTestsData} options={barOptions} />
          </div>
        </div>

        {/* Status Distribution - Pie */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>
            توزيع حالات المواعيد
          </h2>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Pie data={chartData.statusDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Payment Methods - Doughnut */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>
            طرق الدفع
          </h2>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Doughnut data={chartData.paymentMethodsData} options={chartOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Reports;
