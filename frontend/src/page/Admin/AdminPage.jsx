import React from 'react';
import { Link } from 'react-router-dom';

function AdminPage() {
  return (
    <div>
      <h1>Chào mừng đến với Trang Admin</h1>
      <p>Đây là trang admin chung. Bạn có thể muốn chuyển hướng người dùng đến trang Dashboard.</p>
      <Link to="/admin/dashboard">Đi đến Dashboard</Link>
    </div>
  );
}

export default AdminPage;
