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
    // optional: gọi apiCheckRole nếu cần
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiLogin(email, password); // { token, user }
      if (res?.token) localStorage.setItem('token', res.token);
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