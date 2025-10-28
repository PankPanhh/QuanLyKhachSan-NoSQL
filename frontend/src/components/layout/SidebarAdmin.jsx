import React from 'react';
import { Link } from 'react-router-dom';
// Thêm icon nếu muốn
import { FaTachometerAlt, FaHotel, FaBook, FaUsers } from 'react-icons/fa';

// CSS cơ bản (nên chuyển ra file CSS riêng)
const styles = {
  sidebar: {
    padding: '1rem',
  },
  logo: {
    padding: '1rem',
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#fff',
    borderBottom: '1px solid #4a627a'
  },
  nav: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    marginTop: '1rem',
  },
  navItem: {
    margin: '0.5rem 0',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    color: '#ecf0f1',
    textDecoration: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.2s',
  },
  navIcon: {
    marginRight: '0.75rem',
  }
};

// Hàm xử lý hover (thêm vào navLink)
const handleMouseOver = (e) => e.currentTarget.style.backgroundColor = '#34495e';
const handleMouseOut = (e) => e.currentTarget.style.backgroundColor = 'transparent';


function SidebarAdmin() {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <Link to="/admin" style={{color: 'white', textDecoration: 'none'}}>Mellow Admin</Link>
      </div>
      <ul style={styles.nav}>
        <li style={styles.navItem}>
          <Link 
            to="/admin/dashboard" 
            style={styles.navLink} 
            onMouseOver={handleMouseOver} 
            onMouseOut={handleMouseOut}
          >
            <FaTachometerAlt style={styles.navIcon} /> Dashboard
          </Link>
        </li>
        <li style={styles.navItem}>
          <Link 
            to="/admin/rooms" 
            style={styles.navLink}
            onMouseOver={handleMouseOver} 
            onMouseOut={handleMouseOut}
          >
            <FaHotel style={styles.navIcon} /> Quản lý Phòng
          </Link>
        </li>
        <li style={styles.navItem}>
          <Link 
            to="/admin/bookings" 
            style={styles.navLink}
            onMouseOver={handleMouseOver} 
            onMouseOut={handleMouseOut}
          >
            <FaBook style={styles.navIcon} /> Quản lý Đặt phòng
          </Link>
        </li>
        <li style={styles.navItem}>
          <Link 
            to="/admin/users" 
            style={styles.navLink}
            onMouseOver={handleMouseOver} 
            onMouseOut={handleMouseOut}
          >
            <FaUsers style={styles.navIcon} /> Quản lý Người dùng
          </Link>
        </li>
        {/* ... Thêm các link khác (Services, Promotions, Reports) ... */}
      </ul>
    </div>
  );
}

export default SidebarAdmin;
