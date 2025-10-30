// src/services/roomService.js
import api from './api';

export const getAllRooms = async (query = '') => {
  try {
    const endpoint = query ? `/rooms?${query}` : '/rooms';
    const response = await api.get(endpoint);
  // Một số API trả về { data: [...] } còn một số (mock) trả trực tiếp mảng
  if (Array.isArray(response)) return response;
  if (response && response.data && Array.isArray(response.data)) return response.data;
  // Nếu response không phải mảng, log để dễ debug và trả về mảng rỗng
  console.warn('getAllRooms: unexpected response shape, returning empty array', response);
  return [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng:', error.message);
    throw error;
  }
};

// Hàm lấy tất cả phòng dành cho khu vực admin
export const adminGetAllRooms = async () => {
  try {
    const response = await api.get('/admin/rooms');
    // Chuẩn hoá: trả về mảng phòng (giống getAllRooms)
    if (Array.isArray(response)) return response;
    if (response && response.data) return response.data;
    return response;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng (admin):', error.message);
    throw error;
  }
};

export const getRoomById = async (id) => {
  try {
    const response = await api.get(`/rooms/${id}`);
    if (response && response.data) return response.data;
    return response;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết phòng:', error.message);
    throw error;
  }
};