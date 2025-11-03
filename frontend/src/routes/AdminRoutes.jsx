import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

// Import Layout Admin
import AdminLayout from '../components/layout/AdminLayout.jsx';

// Import các trang Admin
import DashboardPage from '../page/Admin/DashboardPage.jsx';
import RoomsManager from '../page/Admin/RoomsManager.jsx';
import BookingsManager from '../page/Admin/BookingsManager.jsx';
import UsersManager from '../page/Admin/UsersManager.jsx';
import ServicesManager from '../page/Admin/ServicesManager.jsx';
import PromotionsManager from '../page/Admin/PromotionsManager.jsx';
import ReportsPage from '../page/Admin/ReportsPage.jsx';
import AdminPage from '../page/Admin/AdminPage.jsx';

// Component bảo vệ Route
const ProtectedRoute = ({ children }) => {
  return children; // Không kiểm tra user, luôn cho truy cập
};


function AdminRoutes() {
  return (
    <Routes>
      {/* Tất cả các trang admin đều dùng AdminLayout và được bảo vệ */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Trang mặc định của /admin, chuyển hướng tới dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} /> 
        
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="rooms" element={<RoomsManager />} />
        <Route path="bookings" element={<BookingsManager />} />
        <Route path="users" element={<UsersManager />} />
        <Route path="services" element={<ServicesManager />} />
        <Route path="promotions" element={<PromotionsManager />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="home" element={<AdminPage />} /> 
      </Route>
    </Routes>
  );
}

export default AdminRoutes;