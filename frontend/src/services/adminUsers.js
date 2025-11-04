// src/services/adminUsers.js
import api from './api.js';

const qs = (params = {}) => {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : '';
};

// Helper gửi JSON cho các method tuỳ biến
const json = (method, url, body) =>
  api.request(url, { method, body: JSON.stringify(body) });

// Danh sách khách hàng
export const apiAdminListCustomers = (params = {}) =>
  api.get(`/admin/customers${qs(params)}`);

// Danh sách + lọc người dùng
export const apiAdminListUsers = (params = {}) =>
  api.get(`/admin/users${qs(params)}`);

// Khoá/Mở tài khoản
export const apiAdminUpdateUserStatus = (id, TrangThai) =>
  json('PATCH', `/admin/users/${id}/status`, { TrangThai });

// Cộng điểm trực tiếp
export const apiAdminAddPoints = (id, delta) =>
  json('PATCH', `/admin/users/${id}/points`, { delta });

// Cộng điểm theo doanh thu
export const apiAdminAddPointsByRevenue = (id, amount) =>
  json('PATCH', `/admin/users/${id}/revenue`, { amount });

// Cộng điểm theo số lần đặt
export const apiAdminAddPointsByBookings = (id, count) =>
  json('PATCH', `/admin/users/${id}/bookings`, { count });

// Tính lại hạng
export const apiAdminRecalcTier = (id) =>
  api.request(`/admin/users/${id}/recalc-tier`, { method: 'POST' });