import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

// CSS cơ bản
const styles = {
  topbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '0 2rem',
    height: '100%',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  userName: {
    margin: '0 0.5rem',
  },
  logoutButton: {
    marginLeft: '1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#e74c3c',
    fontSize: '1.2rem'
  }
};

function TopbarAdmin() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={styles.topbar}>
      <div style={styles.userMenu}>
        <FaUserCircle size={24} />
        <span style={styles.userName}>{user?.name || 'Admin'}</span>
      </div>
      <button onClick={logout} style={styles.logoutButton} title="Đăng xuất">
        <FaSignOutAlt />
      </button>
    </div>
  );
}

export default TopbarAdmin;
