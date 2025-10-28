import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from './SidebarAdmin';
import TopbarAdmin from './TopbarAdmin';

// CSS cơ bản cho Admin Layout (bạn nên chuyển ra file CSS riêng)
const styles = {
  adminLayout: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '250px',
    flexShrink: 0,
    backgroundColor: '#2c3e50', // Màu tối cho sidebar
    color: 'white',
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    height: '60px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #ddd',
  },
  pageContent: {
    flexGrow: 1,
    padding: '2rem',
    backgroundColor: '#f4f6f9',
  }
};

function AdminLayout() {
  return (
    <div style={styles.adminLayout}>
      <aside style={styles.sidebar}>
        <SidebarAdmin />
      </aside>
      
      <div style={styles.mainContent}>
        <header style={styles.topbar}>
          <TopbarAdmin />
        </header>
        
        <main style={styles.pageContent}>
          {/* Nội dung các trang admin (Dashboard, RoomsManager...) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
