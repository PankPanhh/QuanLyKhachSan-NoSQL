import React from 'react';
// 1. Import các component cần thiết từ react-router-dom
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 2. Import component MainPage của bạn
import MainPage from "./page/MainPage.jsx";
function App() {
  return (
    // 4. Bọc toàn bộ ứng dụng của bạn bằng <BrowserRouter>
    <BrowserRouter>
      {/* 5. Dùng <Routes> để định nghĩa các trang */}
      <Routes>
        {/* Route cho trang chủ, render MainPage */}
        <Route path="/" element={<MainPage />} />
        
        {/* Thêm các route cho trang đăng nhập/đăng ký ở đây */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;