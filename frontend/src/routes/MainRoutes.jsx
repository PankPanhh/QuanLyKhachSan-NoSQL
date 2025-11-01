import React from "react";
import { Routes, Route } from "react-router-dom";

// Import Layout
import MainLayout from "../components/layout/MainLayout.jsx";

// Import các trang
import MainPage from "../page/Main/MainPage.jsx"; // Sửa đường dẫn đúng theo cấu trúc thư mục
import RoomsPage from "../page/Main/RoomsPage.jsx";
import RoomDetailPage from "../page/Main/RoomDetailPage.jsx";
import BookingPage from "../page/Main/BookingPage.jsx";
import PromotionsPage from "../page/Main/PromotionsPage.jsx";
import ContactPage from "../page/Main/ContactPage.jsx";
import ProfilePage from "../page/Main/ProfilePage.jsx";
import LoginPage from "../page/Main/Auth/LoginPage.jsx";
import RegisterPage from "../page/Main/Auth/RegisterPage.jsx";
import NotFoundPage from "../page/NotFoundPage.jsx";

import AboutPage from "../page/Main/AboutPage.jsx";


// Component layout riêng cho trang Auth (không Header/Footer)
const AuthLayout = ({ children }) => (
  <div className="auth-container">{children}</div>
);

function MainRoutes() {
  return (
    <Routes>
      {/* Các trang chính dùng MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="room/:id" element={<RoomDetailPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="promotions" element={<PromotionsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Các trang Đăng nhập / Đăng ký có thể dùng layout riêng */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        }
      />

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default MainRoutes;
