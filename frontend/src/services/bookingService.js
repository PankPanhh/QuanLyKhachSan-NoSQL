// Đây là file skeleton (khung sườn)
// Bạn có thể thêm logic gọi API (thật hoặc giả) tại đây

// const MOCK_BOOKINGS = [];

export const createBooking = async (bookingDetails) => {
  console.log('Đang tạo booking (giả lập):', bookingDetails);
  // await api.post('/bookings', bookingDetails);
  return { success: true, bookingId: `fake-${Date.now()}` };
};

export const getUserBookings = async (userId) => {
    console.log('Đang lấy lịch sử booking (giả lập) cho user:', userId);
    return []; // Trả về mảng rỗng
}

export const adminGetAllBookings = async () => {
    console.log('Đang lấy tất cả booking (giả lập) cho admin');
    return []; // Trả về mảng rỗng
}
