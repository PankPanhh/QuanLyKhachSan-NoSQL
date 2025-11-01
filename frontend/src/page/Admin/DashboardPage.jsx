import React from 'react';
import RevenueChart from '../../components/charts/RevenueChart';
import BookingChart from '../../components/charts/BookingChart';
import SatisfactionChart from '../../components/charts/SatisfactionChart'; // Import file mới
import { FaWallet, FaGlobe, FaUserPlus, FaShoppingCart, FaArrowRight } from 'react-icons/fa';

// CSS đã cập nhật cho Giao diện Dark Mode
const styles = {
  card: {
    backgroundColor: '#111c44',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #1f2a4f',
    color: '#ffffff',
    height: '100%',
  },
  // Card thống kê (hàng 1)
  statCard: {
    backgroundColor: '#111c44',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #1f2a4f',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '1.5rem',
  },
  statTitle: {
    color: '#a0aec0',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    marginBottom: '0.25rem'
  },
  statValue: {
    color: '#ffffff',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0
  },
  // Card Welcome (con sứa)
  welcomeCard: {
    padding: '2rem',
    // Sử dụng ảnh jellyfish từ Pexels
    backgroundImage: 'url("https://images.pexels.com/photos/1001752/pexels-photo-1001752.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  welcomeOverlay: { // Lớp phủ mờ
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 28, 68, 0.7)', // #111c44 với 70% opacity
    zIndex: 1,
  },
  welcomeContent: {
    position: 'relative',
    zIndex: 2,
  },
  recordButton: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '1rem',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  // Card Biểu đồ
  chartTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: '1.5rem'
  },
  chartContainer: {
    height: '350px' // Tăng chiều cao biểu đồ
  },
  chartContainerSmall: {
    height: '250px' // Chiều cao cho biểu đồ tròn
  },
  // Card Referral
  referralItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
  },
  referralLabel: {
    color: '#a0aec0',
    fontSize: '0.9rem',
  },
  referralValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  safetyScore: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#0f1734',
    borderRadius: '8px',
    textAlign: 'center',
  }
}

function DashboardPage() {
  return (
    <div>
      {/* Hàng 1: Thẻ thống kê */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
            <div style={styles.statCard}>
                <div>
                  <h4 style={styles.statTitle}>Today's Money</h4>
                  <p style={styles.statValue}>$ 15,000</p>
                </div>
                <div style={styles.statIcon}><FaWallet /></div>
            </div>
        </div>
        <div className="col-lg-3 col-md-6">
            <div style={styles.statCard}>
                <div>
                  <h4 style={styles.statTitle}>Today's Users</h4>
                  <p style={styles.statValue}>2,300</p>
                </div>
                <div style={styles.statIcon}><FaGlobe /></div>
            </div>
        </div>
        <div className="col-lg-3 col-md-6">
            <div style={styles.statCard}>
                <div>
                  <h4 style={styles.statTitle}>New Clients</h4>
                  <p style={styles.statValue}>+3,462</p>
                </div>
                <div style={styles.statIcon}><FaUserPlus /></div>
            </div>
        </div>
        <div className="col-lg-3 col-md-6">
            <div style={styles.statCard}>
                <div>
                  <h4 style={styles.statTitle}>Total Sales</h4>
                  <p style={styles.statValue}>$ 103,430</p>
                </div>
                <div style={styles.statIcon}><FaShoppingCart /></div>
            </div>
        </div>
      </div>

      {/* Hàng 2: Welcome, Satisfaction, Referral */}
      <div className="row g-4 mb-4">
        <div className="col-lg-5">
          <div style={{ ...styles.card, ...styles.welcomeCard }}>
            <div style={styles.welcomeOverlay}></div>
            <div style={styles.welcomeContent}>
              <h5 style={{color: '#a0aec0'}}>Welcome back,</h5>
              <h2 style={{color: 'white', fontWeight: 'bold'}}>Mark Johnson</h2>
              <p style={{color: '#a0aec0', maxWidth: '80%'}}>Glad to see you again! Ask me anything.</p>
              <div style={styles.recordButton}>
                Tap to record <FaArrowRight style={{marginLeft: '0.5rem'}} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div style={{ ...styles.card, paddingBottom: '0' }}>
            <h5 style={styles.chartTitle}>Satisfaction Rate</h5>
            <p style={{color: '#a0aec0', marginTop: '-1rem'}}>From all projects</p>
            <div style={styles.chartContainerSmall}>
              <SatisfactionChart />
            </div>
          </div>
        </div>
        <div className="col-lg-3">
          <div style={styles.card}>
            <h5 style={styles.chartTitle}>Referral Tracking</h5>
            <div style={styles.referralItem}>
              <span style={styles.referralLabel}>Invited</span>
              <span style={styles.referralValue}>145 people</span>
            </div>
            <hr style={{borderColor: '#1f2a4f'}}/>
            <div style={styles.referralItem}>
              <span style={styles.referralLabel}>Bonus</span>
              <span style={styles.referralValue}>1,465</span>
            </div>
            <div style={styles.safetyScore}>
              <span style={styles.referralLabel}>Safety</span>
              <p style={{...styles.referralValue, fontSize: '2rem', color: '#3b82f6', margin: '0.5rem 0 0 0'}}>9.3</p>
              <span style={styles.referralLabel}>Total Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hàng 3: Biểu đồ */}
      <div className="row g-4">
        <div className="col-lg-8">
            <div style={styles.card}>
                <h5 style={styles.chartTitle}>Sales Overview</h5>
                <p style={{color: '#a0aec0', marginTop: '-1rem'}}>+5% more in 2021</p>
                <div style={styles.chartContainer}>
                    <RevenueChart />
                </div>
            </div>
        </div>
        <div className="col-lg-4">
            <div style={styles.card}>
                <h5 style={styles.chartTitle}>Active Users</h5>
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