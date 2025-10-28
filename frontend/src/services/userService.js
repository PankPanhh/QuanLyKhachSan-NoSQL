import api from './api'; // Import mock API

export const login = async (email, password) => {
  try {
    // Gọi API giả lập
    const data = await api.post('/login', { email, password });
    return data;
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error.message);
    throw error;
  }
};

export const register = async (name, email, password) => {
  try {
    // Gọi API giả lập
    const data = await api.post('/register', { name, email, password });
    return data;
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error.message);
    throw error;
  }
};

// Hàm lấy tất cả user (cho Admin)
export const getAllUsers = async () => {
    try {
        const data = await api.get('/admin/users');
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách user:', error.message);
        throw error;
    }
}
