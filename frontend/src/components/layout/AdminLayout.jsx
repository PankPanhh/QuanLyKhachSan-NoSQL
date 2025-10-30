import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from './SidebarAdmin';
import TopbarAdmin from './TopbarAdmin';

// CSS cập nhật cho Giao diện Dark Mode giống hệt ảnh
const styles = {
  adminLayout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0f1734', // Nền tối chính (ngoài card)
    color: '#ffffff', 
  },
  sidebar: {
    width: '280px', // Rộng hơn một chút
    flexShrink: 0,
    backgroundColor: '#111c44', // Nền card/sidebar
    color: 'white',
    borderRight: '1px solid #1f2a4f', // Viền mờ
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto', // Cho phép cuộn nội dung
  },
  topbar: {
    height: '70px', // Cao hơn một chút
    backgroundColor: '#111c44', // Nền topbar
    borderBottom: '1px solid #1f2a4f', // Viền mờ
    color: '#ffffff',
    padding: '0 2rem',
  },
  pageContent: {
    flexGrow: 1,
    padding: '2rem',
    backgroundColor: '#0f1734', // Nền nội dung chính
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;