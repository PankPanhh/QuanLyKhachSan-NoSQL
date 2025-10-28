import api from './api'; // Import mock API

export const getAllRooms = async () => {
  try {
    // Gọi API giả lập
    const data = await api.get('/rooms');
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng:', error.message);
    throw error;
  }
};

export const getRoomById = async (id) => {
  try {
    // Gọi API giả lập
    const data = await api.get(`/rooms/${id}`);
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết phòng:', error.message);
    throw error;
  }
};

// Các hàm cho admin
export const adminGetAllRooms = async () => {
    try {
        const data = await api.get('/admin/rooms');
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách phòng (admin):', error.message);
        throw error;
    }
}

// Thêm các hàm createRoom, updateRoom, deleteRoom (giả lập)
