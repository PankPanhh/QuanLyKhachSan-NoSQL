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
    const response = await api.get(`/checkout/${bookingId}/invoice/download`, {
      responseType: "blob",
    });
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

export default {
  calculateLateFee,
  confirmCheckout,
  processPayment,
  getCheckoutDetails,
  submitReview,
  downloadInvoice,
  emailInvoice,
};
