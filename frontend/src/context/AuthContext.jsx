// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import {
  apiLogin,
  apiRegisterWithAccount,
  apiVerifyOtpAccount,
  apiCheckRole,
  apiStaffRegisterWithAccount 
} from '../services/userService.js';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Khi app load, nếu có token hoặc userInfo trong localStorage thì cố gắng khôi phục
    const token = localStorage.getItem('token');
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      try {
        const parsed = JSON.parse(userInfoString);
        setUser(parsed.user || null);
        setRole(parsed.user?.VaiTro || null);
      } catch (e) {
        console.warn('Không thể parse userInfo từ localStorage', e);
      }
    }

    if (token) {
      // nếu có token nhưng chưa có user, gọi checkRole để verify token và lấy thông tin user từ backend
      (async () => {
        try {
          await checkRole();
        } catch (err) {
          // nếu token không hợp lệ, xóa nó để tránh vòng lặp lỗi
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          setUser(null);
          setRole(null);
        }
      })();
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiLogin(email, password); // { token, user }
      if (res?.token) {
        localStorage.setItem('token', res.token);
      }
      // Store a richer userInfo object to help api client and to persist user data
      try {
        localStorage.setItem('userInfo', JSON.stringify(res));
      } catch (e) {
        // ignore serialization errors
      }

      setUser(res?.user || null);
      setRole(res?.user?.VaiTro || null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const registerWithAccount = async (payload) => {
    setLoading(true);
    try {
      return await apiRegisterWithAccount(payload);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAccount = async (payload) => {
    setLoading(true);
    try {
      return await apiVerifyOtpAccount(payload);
    } finally {
      setLoading(false);
    }
  };

  const checkRole = async () => {
    try {
      const { role: r, user: u } = await apiCheckRole();
      setRole(r);
      setUser(u);
      return { r, u };
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setUser(null);
    setRole(null);
  };
const staffRegisterWithAccount = async (payload) => {
  setLoading(true);
  try {
    return await apiStaffRegisterWithAccount(payload);
  } catch (err) {
    throw new Error(err?.message || 'Đăng ký nhân viên thất bại');
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthContext.Provider value={{
      user, role, loading,
      login, logout,
      registerWithAccount, verifyOtpAccount, staffRegisterWithAccount,  
      checkRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;