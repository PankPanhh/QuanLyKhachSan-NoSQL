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
  downloadInvoice: (bookingId) => {
    const token = localStorage.getItem("token");
    const url = `${api.defaults.baseURL}/checkout/${bookingId}/invoice/download`;

    // Tạo link download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice_${bookingId}.pdf`);

    // Thêm token vào header (sử dụng fetch để có thể set header)
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice_${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error downloading invoice:", error);
        throw error;
      });
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
