import React from "react";
import { Routes, Route } from "react-router-dom";
import MainRoutes from "./MainRoutes.jsx";
import AdminRoutes from "./AdminRoutes.jsx";

function AppRoutes() {
  return (
    <Routes>
      {/* Mọi đường dẫn cho admin sẽ đi vào AdminRoutes */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* Mọi đường dẫn còn lại (cho người dùng) sẽ đi vào MainRoutes */}
      <Route path="/*" element={<MainRoutes />} />
    </Routes>
  );
}

export default AppRoutes;
