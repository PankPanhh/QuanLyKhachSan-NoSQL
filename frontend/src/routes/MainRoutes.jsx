// src/routes/MainRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Layout
import MainLayout from '../components/layout/MainLayout';

// Import các trang
import MainPage from '../pages/Main/MainPage';
import RoomsPage from '../pages/Main/RoomsPage'; // (Trang này bạn sẽ tạo sau)
import RoomDetailPage from '../pages/Main/RoomDetailPage'; // (Trang này bạn sẽ tạo sau)
import ContactPage from '../pages/Main/ContactPage'; // (Trang này bạn sẽ tạo sau)
// ... import các trang khác ...
import LoginPage from '../pages/Main/Auth/LoginPage';
import RegisterPage from '../pages/Main/Auth/RegisterPage';


function MainRoutes() {
  return (
    <Routes>
      {/* Tất cả các route bên trong đều dùng MainLayout */}
      <Route path="/" element={<MainLayout />}>
        {/* Trang chủ */}
        <Route index element={<MainPage />} /> 
        
        {/* Các trang khác */}
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="rooms/:roomId" element={<RoomDetailPage />} /> 
        <Route path="contact" element={<ContactPage />} />
        {/* ... (thêm các trang khác như blog, services...) */}
      </Route>

      {/* Các trang Auth có thể có layout riêng hoặc dùng chung */}
      {/* Ví dụ: Dùng chung MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* Hoặc: Auth có layout riêng (không header/footer)
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      */}
    </Routes>
  );
}

export default MainRoutes;