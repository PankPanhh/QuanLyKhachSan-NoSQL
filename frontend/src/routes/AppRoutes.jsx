// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainRoutes from './MainRoutes';
import AdminRoutes from './AdminRoutes';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mọi đường dẫn cho admin sẽ đi vào AdminRoutes */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        
        {/* Mọi đường dẫn còn lại (cho người dùng) sẽ đi vào MainRoutes */}
        <Route path="/*" element={<MainRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;