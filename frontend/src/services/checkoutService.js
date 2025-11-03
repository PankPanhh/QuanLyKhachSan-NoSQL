import api from "./api";

const checkoutService = {
  /**
   * Xác nhận trả phòng
   */
  confirmCheckout: async (bookingId, actualCheckoutDate = null) => {
    try {
      const response = await api.post(`/checkout/${bookingId}/confirm`, {
        actualCheckoutDate,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Thanh toán khi trả phòng
   */
  processPayment: async (bookingId, paymentData) => {
    try {
      const response = await api.post(
        `/checkout/${bookingId}/payment`,
        paymentData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tính phụ phí trả trễ
   */
  calculateLateFee: async (bookingId, checkoutDate = null) => {
    try {
      const queryParams = checkoutDate ? `?checkoutDate=${checkoutDate}` : "";
      const response = await api.get(
        `/checkout/${bookingId}/late-fee${queryParams}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Gửi đánh giá
   */
  submitReview: async (bookingId, reviewData) => {
    try {
      const response = await api.post(
        `/checkout/${bookingId}/review`,
        reviewData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy thống kê checkout
   */
  getStatistics: async (startDate, endDate, period = "day") => {
    try {
      const queryParams = `?startDate=${startDate}&endDate=${endDate}&period=${period}`;
      const response = await api.get(`/checkout/statistics${queryParams}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy chi tiết checkout
   */
  getCheckoutDetails: async (bookingId) => {
    try {
      const response = await api.get(`/checkout/${bookingId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tải hóa đơn PDF
   */
  downloadInvoice: async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      const baseURL = api.baseURL || "http://localhost:5000/api/v1";
      const url = `${baseURL}/checkout/${bookingId}/invoice/download`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải hóa đơn");
      }

      return { data: await response.blob() };
    } catch (error) {
      console.error("Error downloading invoice:", error);
      throw error;
    }
  },

  /**
   * Gửi hóa đơn qua email
   */
  emailInvoice: async (bookingId, email) => {
    try {
      const response = await api.post(`/checkout/${bookingId}/invoice/email`, {
        email,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default checkoutService;
