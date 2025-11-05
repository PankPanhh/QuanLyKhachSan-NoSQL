// src/services/roomService.js
import api from "./api";

export const getAllRooms = async (query = "") => {
  try {
    const endpoint = query ? `/rooms?${query}` : "/rooms";
    const response = await api.get(endpoint);

    if (Array.isArray(response)) return response;
    if (response && response.data && Array.isArray(response.data))
      return response.data;

    console.warn(
      "getAllRooms: unexpected response shape, returning empty array",
      response
    );
    // Một số API trả về { data: [...] } còn một số (mock) trả trực tiếp mảng
    if (Array.isArray(response)) return response;
    if (response && response.data && Array.isArray(response.data))
      return response.data;
    // Nếu response không phải mảng, log để dễ debug và trả về mảng rỗng
    console.warn(
      "getAllRooms: unexpected response shape, returning empty array",
      response
    );
    return [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng:", error.message);
    throw error;
  }
};

// Hàm lấy tất cả phòng dành cho khu vực admin
export const adminGetAllRooms = async () => {
  try {
    // Sửa lỗi 404: Gọi đến /rooms
    const response = await api.get("/rooms");

    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) return response;
    if (response && response.data) return response.data;

    console.warn("adminGetAllRooms: unexpected response shape", response);
    return [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng (admin):", error.message);
    throw error;
  }
};

export const getRoomById = async (id) => {
  try {
    const response = await api.get(`/rooms/${id}`);
    if (response && response.data) return response.data;
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phòng:", error.message);
    throw error;
  }
};

export const getAvailableRooms = async (startDate, endDate) => {
  try {
    const response = await api.get(
      `/rooms/available?startDate=${startDate}&endDate=${endDate}`
    );
    if (response && response.data) return response.data;
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy phòng trống:", error.message);
    throw error;
  }
};

// Kiểm tra phòng có sẵn trong khoảng thời gian cụ thể
export const checkRoomAvailability = async (roomId, startDate, endDate) => {
  try {
    const response = await api.get(
      `/rooms/${roomId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
    if (response && response.data) return response.data;
    return response;
  } catch (error) {
    console.error("Lỗi khi kiểm tra phòng trống:", error.message);
    throw error;
  }
};

// --- BỔ SUNG CÁC HÀM ADMIN ---

// *** SỬA LỖI 404: Endpoint phải là '/rooms' ***
const ADMIN_ENDPOINT = "/rooms";

export const adminCreateRoom = async (roomData) => {
  try {
    const response = await api.post(ADMIN_ENDPOINT, roomData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo phòng (admin):", error.message);
    throw error;
  }
};

export const adminUpdateRoom = async (id, roomData) => {
  try {
    // Sửa lỗi 404: Dùng ADMIN_ENDPOINT
    const response = await api.put(`${ADMIN_ENDPOINT}/${id}`, roomData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật phòng (admin):", error.message);
    throw error;
  }
};

export const adminUploadRoomImage = async (id, file) => {
  try {
    const form = new FormData();
    form.append("image", file);
    const response = await api.putFormData(
      `${ADMIN_ENDPOINT}/${id}/image`,
      form
    );
    // response expected shape: { success: true, data: { HinhAnh: filename } }
    return response;
  } catch (error) {
    console.error("Lỗi khi upload ảnh phòng (admin):", error.message || error);
    throw error;
  }
};

export const adminDeleteRoom = async (id) => {
  try {
    // Sửa lỗi 404: Dùng ADMIN_ENDPOINT
    await api.delete(`${ADMIN_ENDPOINT}/${id}`);
    return true; // Thành công
  } catch (error) {
    console.error("Lỗi khi xóa phòng (admin):", error.message);
    throw error;
  }
};
