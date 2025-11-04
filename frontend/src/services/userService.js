// src/services/userService.js
import api from './api.js';

export const apiLogin = (email, password) =>
  api.post('/auth/login', { email, password });

export const apiRegisterWithAccount = (payload) =>
  api.post('/auth/register-with-account', payload);

export const apiVerifyOtpAccount = (payload) =>
  api.post('/auth/verify-otp-account', payload);

export const apiRegisterGuest = (payload) =>
  api.post('/auth/register-guest', payload);

export const apiCheckRole = () =>
  api.get('/auth/check-role');

// tùy chọn (nếu dùng)
export const apiForgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const apiResetPassword = (email, otp, newPassword) =>
  api.post('/auth/reset-password', { email, otp, newPassword });

export const apiStaffRegisterWithAccount = (payload) =>
  api.post('/auth/staff/register-with-account', payload);

