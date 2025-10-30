import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaUserCircle, FaSignOutAlt, FaSearch, FaBell, FaCog } from 'react-icons/fa';

// CSS cập nhật cho Giao diện Dark Mode
const styles = {
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    color: '#ffffff',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  breadcrumb: {
    color: '#a0aec0',
    fontSize: '0.9rem',
  },
  breadcrumbPage: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0f1734', // Nền ô search (nền chính)
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    marginLeft: '2rem',
    border: '1px solid #1f2a4f',
  },
  searchIcon: {
    color: '#a0aec0',
    marginRight: '0.5rem',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    fontSize: '1.2rem',
    cursor: 'pointer',
    marginLeft: '1.5rem',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    marginLeft: '1.5rem',
  },
  userName: {
    margin: '0 0.5rem',
    color: '#a0aec0',
    fontSize: '0.9rem'
  },
};

function TopbarAdmin() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={styles.topbar}>
      {/* Phần bên trái */}
      <div style={styles.leftSection}>
        <div>
          <span style={styles.breadcrumb}>Pages / </span>
          <span style={styles.breadcrumbPage}>Dashboard</span>
        </div>
      </div>
      
      {/* Phần bên phải */}
      <div style={styles.rightSection}>
        <div style={styles.searchBox}>
          <FaSearch style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Type here..." 
            style={styles.searchInput} 
          />
        </div>

        <div style={styles.userMenu}>
          <FaUserCircle size={20} color="#a0aec0" />
          <span style={styles.userName}>{user?.name || 'Admin'}</span>
        </div>
        
        <button style={styles.iconButton} title="Thông báo">
          <FaBell />
        </button>
        <button style={styles.iconButton} title="Cài đặt">
          <FaCog />
        </button>
        <button onClick={logout} style={{...styles.iconButton, color: '#e74c3c'}} title="Đăng xuất">
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}

export default TopbarAdmin;