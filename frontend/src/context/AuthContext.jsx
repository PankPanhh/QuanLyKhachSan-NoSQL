import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. THÊM IMPORT
import { login as apiLogin, register as apiRegister } from '../services/userService';

// 1. Tạo Context
export const AuthContext = createContext();

// 2. Tạo Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- 2. KHỞI TẠO HOOK

  // 3. Effect: Tự động đăng nhập khi tải lại trang (nếu có token)
  useEffect(() => {
    const DEV_BYPASS_LOGIN = false; // 🔧 Tắt bypass để test login thực tế

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
      
      console.log('Login response data:', data); // Debug log
      
      // Backend trả về user info trực tiếp, không có field 'user'
      const userInfo = {
        _id: data._id,
        IDNguoiDung: data.IDNguoiDung,
        HoTen: data.HoTen,
        Email: data.Email,
        VaiTro: data.VaiTro,
        isAdmin: data.VaiTro === 'Admin' || data.VaiTro === 'NhanVien'
      };
      
      setUser(userInfo);
      setToken(data.token);
      
      localStorage.setItem('user', JSON.stringify(userInfo));
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
      
      console.log('Register response data:', data); // Debug log
      
      // Backend trả về user info trực tiếp, không có field 'user'
      const userInfo = {
        _id: data._id,
        IDNguoiDung: data.IDNguoiDung,
        HoTen: data.HoTen,
        Email: data.Email,
        VaiTro: data.VaiTro,
        isAdmin: data.VaiTro === 'Admin' || data.VaiTro === 'NhanVien'
      };
      
      setUser(userInfo);
      setToken(data.token);

      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('token', data.token);

      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // 6. Hàm Logout (ĐÃ CẬP NHẬT)
  const logout = () => {
    console.log('Logout function called'); // Debug log
    console.log('Current URL before logout:', window.location.href); // Debug log
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo'); // Xóa thêm userInfo nếu có
    
    console.log('About to navigate to home page'); // Debug log
    
    // Thử sử dụng navigate với replace
    navigate('/', { replace: true });
    
    // Nếu vẫn có vấn đề, có thể uncommment dòng dưới
    // window.location.href = '/';
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