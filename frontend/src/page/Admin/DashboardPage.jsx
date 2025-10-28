import React from 'react';
import RevenueChart from '../../components/charts/RevenueChart';
import BookingChart from '../../components/charts/BookingChart';

// CSS cơ bản
const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
    },
    card: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    chartContainer: {
        height: '300px'
    }
}

function DashboardPage() {
  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      {/* Thẻ thống kê nhanh */}
      <div style={styles.grid}>
        <div style={styles.card}>
            <h4>Tổng doanh thu (Tháng này)</h4>
            <p className="fs-3 fw-bold">$ 15,000</p>
        </div>
        <div style={styles.card}>
            <h4>Lượt đặt phòng (Tháng này)</h4>
            <p className="fs-3 fw-bold">120</p>
        </div>
        <div style={styles.card}>
            <h4>Người dùng mới</h4>
            <p className="fs-3 fw-bold">35</p>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="row mt-5">
        <div className="col-lg-6 mb-4">
            <div style={styles.card}>
                <h5 className="mb-3">Biểu đồ doanh thu (6 tháng)</h5>
                <div style={styles.chartContainer}>
                    <RevenueChart />
                </div>
            </div>
        </div>
        <div className="col-lg-6 mb-4">
            <div style={styles.card}>
                <h5 className="mb-3">Biểu đồ lượt đặt phòng (6 tháng)</h5>
                <div style={styles.chartContainer}>
                    <BookingChart />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
