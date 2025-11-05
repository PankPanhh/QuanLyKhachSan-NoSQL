import api from "./api";

export const calculateLateFee = async (bookingId) => {
  try {
    const response = await api.get(`/checkout/${bookingId}/late-fee`);
    return response;
  } catch (error) {
    console.error("Lỗi khi tính phụ phí trễ:", error);
    throw error;
  }
};

export const confirmCheckout = async (bookingId) => {
  try {
    const response = await api.patch(`/checkout/${bookingId}/confirm`);
    return response;
  } catch (error) {
    console.error("Lỗi khi xác nhận trả phòng:", error);
    throw error;
  }
};

export const processPayment = async (bookingId, paymentData) => {
  try {
    const response = await api.post(
      `/checkout/${bookingId}/payment`,
      paymentData
    );
    return response;
  } catch (error) {
    console.error("Lỗi khi xử lý thanh toán:", error);
    throw error;
  }
};

export const getCheckoutDetails = async (bookingId) => {
  try {
    const response = await api.get(`/checkout/${bookingId}`);
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết checkout:", error);
    throw error;
  }
};

export const submitReview = async (bookingId, reviewData) => {
  try {
    const response = await api.post(
      `/checkout/${bookingId}/review`,
      reviewData
    );
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi đánh giá:", error);
    throw error;
  }
};

export const downloadInvoice = async (bookingId) => {
  try {
    const response = await api.download(
      `/checkout/${bookingId}/invoice/download`
    );
    return response;
  } catch (error) {
    console.error("Lỗi khi tải hóa đơn:", error);
    throw error;
  }
};

export const emailInvoice = async (bookingId, emailData) => {
  try {
    const response = await api.post(
      `/checkout/${bookingId}/invoice/email`,
      emailData
    );
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email hóa đơn:", error);
    throw error;
  }
};

export const getLateFeeReport = async (startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    const response = await api.get("/checkout/reports/late-checkouts", {
      params,
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo trả trễ:", error);
    throw error;
  }
};

export const getOccupancyRate = async (startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    const response = await api.get("/checkout/reports/occupancy", { params });
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy tỷ lệ lấp đầy:", error);
    throw error;
  }
};

export const getRoomRating = async (roomCode) => {
  try {
    const response = await api.get(`/checkout/rooms/${roomCode}/rating`);
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá phòng:", error);
    throw error;
  }
};

export const getTopRatedRooms = async (limit = 10) => {
  try {
    const response = await api.get("/checkout/rooms/top-rated", {
      params: { limit },
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy top phòng đánh giá cao:", error);
    throw error;
  }
};

export const getCheckoutStatistics = async (
  startDate,
  endDate,
  groupBy = "day"
) => {
  try {
    const params = { groupBy };
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    const response = await api.get("/checkout/reports/checkout-stats", {
      params,
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy thống kê checkout:", error);
    throw error;
  }
};

export const getActualRevenue = async (startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    const response = await api.get("/checkout/reports/revenue", { params });
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy doanh thu thực tế:", error);
    throw error;
  }
};

export default {
  calculateLateFee,
  confirmCheckout,
  processPayment,
  getCheckoutDetails,
  submitReview,
  downloadInvoice,
  emailInvoice,
  getLateFeeReport,
  getOccupancyRate,
  getRoomRating,
  getTopRatedRooms,
  getCheckoutStatistics,
  getActualRevenue,
};
