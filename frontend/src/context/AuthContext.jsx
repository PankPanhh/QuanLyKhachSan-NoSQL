import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/userService';

// 1. Tạo Context
export const AuthContext = createContext();

// 2. Tạo Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Trạng thái loading khi check local storage

  // 3. Effect: Tự động đăng nhập khi tải lại trang (nếu có token)
// useEffect(() => {
//   const storedToken = localStorage.getItem('token');
//   const storedUser = localStorage.getItem('user');

//   if (storedToken && storedUser) {
//     try {
//       const parsedUser = JSON.parse(storedUser);
//       setToken(storedToken);
//       setUser(parsedUser);
//     } catch (err) {
//       console.error("User data in localStorage is invalid JSON:", err);
//       localStorage.removeItem('user'); // Xóa dữ liệu hỏng để tránh lỗi sau
//     }
//   }
//   setLoading(false);
// }, []);

useEffect(() => {
  const DEV_BYPASS_LOGIN = true; // 🔧 Cho phép vào admin không cần đăng nhập

  if (DEV_BYPASS_LOGIN) {
    // Giả lập user admin và token
    setUser({
      IDNguoiDung: "NV_DEV",
      HoTen: "Admin Developer",
      isAdmin: true,
      Email: "dev@admin.local",
    });
    setToken("dev-token");
    setLoading(false);
    return;
  }

  try {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
    }
  } catch (err) {
    console.error("Lỗi parse user:", err);
    localStorage.removeItem("user");
  } finally {
    setLoading(false);
  }
}, []);


  // 4. Hàm Login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await apiLogin(email, password); // Gọi API service
      
      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error; // Ném lỗi để trang Login có thể bắt
    }
  };

  // 5. Hàm Register
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const data = await apiRegister(name, email, password); // Gọi API service
      
      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // 6. Hàm Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // 7. Giá trị cung cấp cho các component con
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Chỉ render app khi đã check auth xong */}
    </AuthContext.Provider>
  );
};
