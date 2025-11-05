import React, { useState, useEffect } from "react";
// import ReactDOM from "react-dom"; // Đã xóa, thay bằng Modal component
import checkoutService from "../../services/checkoutService";
import { adminGetAllBookings } from "../../services/bookingService";
import CheckoutStatistics from "../../components/checkout/CheckoutStatistics";
import CheckoutAdvancedStats from "../../components/checkout/CheckoutAdvancedStats";
// import ReviewForm from "../../components/checkout/ReviewForm"; // Đã xóa theo yêu cầu
// import "./CheckoutManager.css"; // Đã xóa CSS tùy chỉnh

// Import các component UI chung
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

const CheckoutManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  // const [showCheckoutModal, setShowCheckoutModal] = useState(false); // Thay bằng isModalOpen
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [lateFeeInfo, setLateFeeInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("confirm");
  const [paymentData, setPaymentData] = useState({
    phuongThuc: "Tiền mặt",
    soTien: 0,
    ghiChu: "",
  });
  // const [reviewData, setReviewData] = useState({ ... }); // Đã xóa theo yêu cầu
  const [showCheckoutStatsModal, setShowCheckoutStatsModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);

  // State thông báo chuẩn
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  useEffect(() => {
    loadActiveBookings();
  }, []);

  const loadActiveBookings = async () => {
    try {
      setLoading(true);
      setError(null); // Reset lỗi
      const response = await adminGetAllBookings();
      const bookingsData = Array.isArray(response)
        ? response
        : response.data || [];
      const activeBookings = bookingsData.filter(
        (b) =>
          (b.TrangThai === "Đã xác nhận" ||
            b.TrangThai === "Đang sử dụng" ||
            b.TrangThai === "Hoàn thành") &&
          !b.HoaDon?.DaXuatHoaDon
      );
      setBookings(activeBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setError("Lỗi khi tải danh sách đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (booking) => {
    try {
      const response = await checkoutService.getCheckoutDetails(
        booking.MaDatPhong
      );
      const fullBookingData = response.booking;
      setSelectedBooking(fullBookingData);

      if (fullBookingData.TrangThai === "Hoàn thành") {
        setLateFeeInfo(null);
        setActiveTab("confirm");
        setIsModalOpen(true); // Cập nhật state
        return;
      }

      const lateFeeResponse = await checkoutService.calculateLateFee(
        booking.MaDatPhong
      );
      setLateFeeInfo(lateFeeResponse);
      setActiveTab("confirm");

      const totalPaid =
        fullBookingData.HoaDon?.LichSuThanhToan?.reduce(
          (sum, payment) =>
            payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
          0
        ) || 0;
      const totalAmount =
        (fullBookingData.HoaDon?.TongTien || 0) +
        (lateFeeResponse?.lateFee || 0);
      const remaining = totalAmount - totalPaid;

      setPaymentData({
        phuongThuc: "Tiền mặt",
        soTien: remaining > 0 ? remaining : 0,
        ghiChu: "",
      });

      // setReviewData({ ... }); // Đã xóa
      setIsModalOpen(true); // Cập nhật state
    } catch (error) {
      console.error("Lỗi khi load chi tiết booking:", error);
      setError(
        "Lỗi khi tải thông tin booking: " +
          (error.message || "Không rõ lý do")
      );
      setSelectedBooking(null);
    }
  };

  const reloadSelectedBooking = async () => {
    if (!selectedBooking) return null;
    try {
      const response = await checkoutService.getCheckoutDetails(
        selectedBooking.MaDatPhong
      );
      const updatedBooking = response.booking;
      setSelectedBooking(updatedBooking);
      loadActiveBookings(); // Reload danh sách nền
      return updatedBooking;
    } catch (error) {
      console.error("Lỗi khi reload booking:", error);
      return null;
    }
  };

  const confirmCheckout = async () => {
    try {
      await checkoutService.confirmCheckout(selectedBooking.MaDatPhong);
      const updatedBooking = await reloadSelectedBooking();
      if (!updatedBooking) {
        setError("Lỗi: Không thể tải lại thông tin booking");
        return;
      }
      setSelectedBooking(updatedBooking);
      const totalPaid =
        updatedBooking.HoaDon?.LichSuThanhToan?.reduce(
          (sum, payment) =>
            payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
          0
        ) || 0;
      const remaining = (updatedBooking.HoaDon?.TongTien || 0) - totalPaid;
      setPaymentData({
        phuongThuc: "Tiền mặt",
        soTien: remaining > 0 ? remaining : 0,
        ghiChu: "",
      });
      setLateFeeInfo(null);
      showSuccessMessage("Trả phòng thành công! Chuyển sang thanh toán.");
      setActiveTab("payment");
    } catch (error) {
      setError(
        "Lỗi khi xác nhận trả phòng: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handlePayment = async () => {
    try {
      if (!paymentData.soTien || paymentData.soTien <= 0) {
        setError("Vui lòng nhập số tiền thanh toán!");
        return;
      }
      const totalPaid =
        selectedBooking.HoaDon?.LichSuThanhToan?.reduce(
          (sum, payment) =>
            payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
          0
        ) || 0;
      const totalAmount = selectedBooking.HoaDon?.TongTien || 0;
      const remainingAmount = totalAmount - totalPaid;

      if (paymentData.soTien > remainingAmount) {
        setError(
          `Số tiền thanh toán (${paymentData.soTien.toLocaleString()} VND) vượt quá số tiền còn lại (${remainingAmount.toLocaleString()} VND)!`
        );
        return;
      }

      const paymentPayload = {
        paymentMethod: paymentData.phuongThuc,
        amount: paymentData.soTien,
        notes: paymentData.ghiChu,
      };

      const response = await checkoutService.processPayment(
        selectedBooking.MaDatPhong,
        paymentPayload
      );
      const remainingFromResponse = response?.remainingAmount ?? 0;
      await reloadSelectedBooking();

      // LOGIC ĐÃ THAY ĐỔI (Bỏ qua Đánh giá)
      if (remainingFromResponse <= 0) {
        showSuccessMessage(
          `Thanh toán hoàn tất! Đã thanh toán: ${paymentData.soTien.toLocaleString()} VND. Chuyển sang xuất hóa đơn...`
        );
        setActiveTab("invoice"); // Chuyển thẳng sang hóa đơn
      } else {
        showSuccessMessage(
          `Thanh toán thành công! Số tiền: ${paymentData.soTien.toLocaleString()} VND. Còn lại: ${remainingFromResponse.toLocaleString()} VND`
        );
      }

      setPaymentData({
        phuongThuc: "Tiền mặt",
        soTien: remainingFromResponse > 0 ? remainingFromResponse : 0,
        ghiChu: "",
      });
    } catch (error) {
      const errorMsg = error.message || "Lỗi không xác định";
      let detailedMsg = `Lỗi khi thanh toán: ${errorMsg}`;
      setError(detailedMsg);
    }
  };

  // const handleReview = async () => { ... }; // ĐÃ XÓA HÀM NÀY

  const handleDownloadInvoice = async () => {
    try {
      if (!selectedBooking || !selectedBooking.MaDatPhong) {
        setError("Lỗi: Không tìm thấy thông tin booking. Vui lòng thử lại.");
        return;
      }
      const response = await checkoutService.downloadInvoice(
        selectedBooking.MaDatPhong
      );
      const blob = new Blob([response], { type: "text/html; charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `HoaDon_${selectedBooking.MaDatPhong}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccessMessage("Xuất hóa đơn thành công! Booking đã hoàn tất.");
      setIsModalOpen(false); // Cập nhật state
      setSelectedBooking(null);
      loadActiveBookings();
    } catch (error) {
      console.error("Download invoice error:", error);
      setError(
        "Lỗi khi tải hóa đơn: " + (error.message || "Không thể tải hóa đơn")
      );
    }
  };

  const handleEmailInvoice = async () => {
    try {
      const email =
        selectedBooking.KhachHang?.Email || prompt("Nhập email khách hàng:");
      if (!email) return;
      await checkoutService.emailInvoice(selectedBooking.MaDatPhong, {
        email,
      });
      showSuccessMessage("Đã gửi hóa đơn qua email!");
    } catch (error) {
      setError(
        "Lỗi khi gửi email: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const formatCurrency = (amount) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(safeAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Helper render trạng thái (mới)
  const getStatusColor = (status) => {
    const statusColors = {
      "Đang chờ": { bg: "bg-label-warning", text: "Đang chờ" },
      "Đã xác nhận": { bg: "bg-label-success", text: "Đã xác nhận" },
      "Đang sử dụng": { bg: "bg-label-info", text: "Đang sử dụng" },
      "Đã hủy": { bg: "bg-label-danger", text: "Đã hủy" },
      "Hoàn thành": { bg: "bg-label-primary", text: "Hoàn thành" },
    };
    return statusColors[status] || { bg: "bg-label-secondary", text: status };
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  // --- JSX ĐÃ CẬP NHẬT ---
  return (
    <div className="container-fluid px-0">
      {/* Thông báo */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Thống kê (Giữ lại component thống kê) */}
      <div className="mb-4">
        {/* Component này được giả định là render 4 thẻ thống kê giống RoomsManager */}
        <CheckoutStatistics
          onOpenReport={(reportType) => {
            setShowCheckoutStatsModal(true);
            setSelectedReportType(reportType);
          }}
        />
      </div>

      {/* Bỏ các nút báo cáo tùy chỉnh */}

      {/* Danh sách booking (Chuyển sang dạng Bảng) */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Quản lý Trả phòng (Check-out)</h5>
          <span className="text-muted">
            Các phòng đang hoạt động: {bookings.length}
          </span>
        </div>

        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "300px" }}
          >
            <Spinner />
            <p className="mt-2 ms-2">Đang tải danh sách...</p>
          </div>
        ) : (
          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Mã Đặt Phòng</th>
                  <th>Khách Hàng</th>
                  <th>Phòng</th>
                  <th>Ngày Nhận</th>
                  <th>Ngày Trả (Dự kiến)</th>
                  <th>Trạng Thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <h5 className="text-muted">
                        Không có phòng nào cần trả
                      </h5>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const statusInfo = getStatusColor(booking.TrangThai);
                    return (
                      <tr key={booking._id}>
                        <td>
                          <span className="fw-semibold">
                            {booking.MaDatPhong}
                          </span>
                        </td>
                        <td>
                          {booking.KhachHang?.HoTen || booking.IDKhachHang}
                        </td>
                        <td>
                          <span className="fw-semibold">
                            {booking.MaPhong}
                          </span>
                          <br />
                          <small>{booking.Phong?.LoaiPhong || "N/A"}</small>
                        </td>
                        <td>{formatDate(booking.NgayNhanPhong)}</td>
                        <td>{formatDate(booking.NgayTraPhong)}</td>
                        <td>
                          <span className={`badge ${statusInfo.bg}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td>
                          <Button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCheckout(booking)}
                          >
                            <i className="bx bx-log-out-circle me-1"></i>
                            {booking.TrangThai === "Hoàn thành"
                              ? "Xem chi tiết"
                              : "Trả phòng"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Checkout (Thay thế Portal) */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`Check-out Phòng ${selectedBooking?.MaPhong || ""}`}
        dialogClassName="modal-lg"
      >
        {selectedBooking && (
          <div>
            {/* Tab Navigation (Bootstrap Nav) */}
            <ul className="nav nav-tabs nav-fill" role="tablist">
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "confirm" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("confirm")}
                >
                  <i className="bx bx-check-shield me-1"></i> Xác nhận
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "payment" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("payment")}
                >
                  <i className="bx bx-dollar-circle me-1"></i> Thanh toán
                </button>
              </li>
              {/* <li className="nav-item">... Tab Đánh giá ĐÃ XÓA ...</li> */}
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "invoice" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("invoice")}
                >
                  <i className="bx bx-receipt me-1"></i> Hóa đơn
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content p-3">
              {/* TAB 1: XÁC NHẬN TRẢ PHÒNG */}
              {activeTab === "confirm" && (
                <div className="tab-pane fade show active">
                  <h5 className="text-dark">Thông tin đặt phòng</h5>
                  <div className="list-group list-group-flush mb-3">
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Mã đặt</span>
                      <span className="fw-semibold">
                        {selectedBooking.MaDatPhong}
                      </span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Ngày trả dự kiến</span>
                      <span>{formatDate(selectedBooking.NgayTraPhong)}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Ngày trả thực tế</span>
                      <span className="fw-semibold text-success">
                        {formatDate(new Date())}
                      </span>
                    </div>
                  </div>

                  {/* Phụ phí trả trễ */}
                  {lateFeeInfo && lateFeeInfo.isLate && (
                    <div className="alert alert-warning">
                      <h5 className="alert-heading">Cảnh báo: Trả phòng trễ</h5>
                      <p>
                        Số ngày trễ:{" "}
                        <strong>{lateFeeInfo.daysLate} ngày</strong>
                      </p>
                      <p className="mb-0 fs-5">
                        Phụ phí trả trễ:{" "}
                        <strong className="text-danger">
                          {formatCurrency(lateFeeInfo.lateFee)}
                        </strong>
                      </p>
                    </div>
                  )}

                  {/* Tổng kết hóa đơn */}
                  <h5 className="text-dark mt-4">Tổng kết thanh toán</h5>
                  <div className="list-group list-group-flush">
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span>Tiền phòng:</span>
                      <strong>
                        {formatCurrency(
                          selectedBooking.HoaDon?.TongTienPhong || 0
                        )}
                      </strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span>Tiền dịch vụ:</span>
                      <strong>
                        {formatCurrency(
                          selectedBooking.HoaDon?.TongTienDichVu || 0
                        )}
                      </strong>
                    </div>
                    {lateFeeInfo && lateFeeInfo.lateFee > 0 && (
                      <div className="list-group-item d-flex justify-content-between px-0 text-danger">
                        <span>Phụ phí trả trễ:</span>
                        <strong>{formatCurrency(lateFeeInfo.lateFee)}</strong>
                      </div>
                    )}
                    <div className="list-group-item d-flex justify-content-between px-0 fs-5 fw-bold text-primary">
                      <span>Tổng cộng:</span>
                      <span>
                        {formatCurrency(
                          (selectedBooking.HoaDon?.TongTien || 0) +
                            (lateFeeInfo?.lateFee || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Button xác nhận */}
                  {selectedBooking.TrangThai === "Đang sử dụng" && (
                    <Button
                      className="btn btn-primary w-100 mt-4"
                      onClick={confirmCheckout}
                    >
                      Xác nhận trả phòng
                    </Button>
                  )}
                </div>
              )}

              {/* TAB 2: THANH TOÁN */}
              {activeTab === "payment" && (
                <div className="tab-pane fade show active">
                  <h5 className="text-dark">Thông tin thanh toán</h5>
                  <div className="list-group list-group-flush mb-3">
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span>Tổng tiền:</span>
                      <strong>
                        {formatCurrency(
                          (selectedBooking.HoaDon?.TongTien || 0) +
                            (selectedBooking.TrangThai === "Hoàn thành"
                              ? 0
                              : lateFeeInfo?.lateFee || 0)
                        )}
                      </strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0 text-success">
                      <span>Đã thanh toán:</span>
                      <strong>
                        {formatCurrency(
                          selectedBooking.HoaDon?.LichSuThanhToan?.reduce(
                            (sum, p) =>
                              p.TrangThai === "Thành công"
                                ? sum + p.SoTien
                                : sum,
                            0
                          ) || 0
                        )}
                      </strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0 fs-5 fw-bold text-danger">
                      <span>Còn lại:</span>
                      <span>
                        {formatCurrency(
                          (selectedBooking.HoaDon?.TongTien || 0) +
                            (selectedBooking.TrangThai === "Hoàn thành"
                              ? 0
                              : lateFeeInfo?.lateFee || 0) -
                            (selectedBooking.HoaDon?.LichSuThanhToan?.reduce(
                              (sum, p) =>
                                p.TrangThai === "Thành công"
                                  ? sum + p.SoTien
                                  : sum,
                              0
                            ) || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Form thanh toán */}
                  <div className="mb-3">
                    <label className="form-label">Phương thức thanh toán:</label>
                    <select
                      className="form-select"
                      value={paymentData.phuongThuc}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          phuongThuc: e.target.value,
                        })
                      }
                    >
                      <option value="Tiền mặt">Tiền mặt</option>
                      <option value="Chuyển khoản">Chuyển khoản</option>
                      <option value="Thẻ tín dụng">Thẻ tín dụng</option>
                      <option value="Ví điện tử">
                        Ví điện tử (MoMo, ZaloPay...)
                      </option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label mb-0">Số tiền:</label>
                      <Button
                        className="btn btn-info btn-sm"
                        onClick={() => {
                          const totalPaid =
                            selectedBooking.HoaDon?.LichSuThanhToan?.reduce(
                              (sum, payment) =>
                                payment.TrangThai === "Thành công"
                                  ? sum + payment.SoTien
                                  : sum,
                              0
                            ) || 0;
                          const totalAmount =
                            (selectedBooking.HoaDon?.TongTien || 0) +
                            (selectedBooking.TrangThai === "Hoàn thành"
                              ? 0
                              : lateFeeInfo?.lateFee || 0);
                          const remaining = totalAmount - totalPaid;
                          setPaymentData({
                            ...paymentData,
                            soTien: remaining > 0 ? remaining : 0,
                          });
                        }}
                      >
                        Thanh toán toàn bộ
                      </Button>
                    </div>
                    <input
                      type="number"
                      className="form-control"
                      value={paymentData.soTien}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          soTien: Number(e.target.value),
                        })
                      }
                      placeholder="Nhập số tiền thanh toán"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ghi chú:</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={paymentData.ghiChu}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          ghiChu: e.target.value,
                        })
                      }
                      placeholder="Nhập ghi chú (không bắt buộc)"
                    />
                  </div>
                  <Button
                    className="btn btn-success w-100"
                    onClick={handlePayment}
                  >
                    Xác nhận thanh toán
                  </Button>

                  {/* Lịch sử thanh toán */}
                  {selectedBooking.HoaDon?.LichSuThanhToan?.length > 0 && (
                    <div className="mt-4">
                      <h6>Lịch sử thanh toán</h6>
                      <ul className="list-group">
                        {selectedBooking.HoaDon.LichSuThanhToan.map(
                          (payment, index) => (
                            <li
                              key={index}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <strong>{payment.PhuongThuc}</strong>
                                <br />
                                <small className="text-muted">
                                  {formatDate(payment.NgayThanhToan)} -{" "}
                                  {payment.TrangThai}
                                </small>
                              </div>
                              <span className="fw-semibold text-success">
                                {formatCurrency(payment.SoTien)}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ĐÁNH GIÁ (ĐÃ BỊ XÓA) */}
              {/* {activeTab === "review" && ( ... )} */}

              {/* TAB 4: HÓA ĐƠN */}
              {activeTab === "invoice" && (
                <div className="tab-pane fade show active">
                  <div className="text-center mb-3">
                    <i className="bx bx-receipt fs-1 text-primary"></i>
                    <h5 className="text-dark mt-2">Hóa đơn thanh toán</h5>
                    <p className="text-muted mb-0">
                      Mã hóa đơn: {selectedBooking.HoaDon?.MaHoaDon}
                    </p>
                  </div>

                  {/* Chi tiết hóa đơn */}
                  <div className="list-group list-group-flush mb-3">
                    {/* ... (Copy từ Tab Xác nhận) ... */}
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span>Tiền phòng:</span>
                      <strong>
                        {formatCurrency(
                          selectedBooking.HoaDon?.TongTienPhong || 0
                        )}
                      </strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span>Tiền dịch vụ:</span>
                      <strong>
                        {formatCurrency(
                          selectedBooking.HoaDon?.TongTienDichVu || 0
                        )}
                      </strong>
                    </div>
                    {selectedBooking.HoaDon?.GiamGia > 0 && (
                      <div className="list-group-item d-flex justify-content-between px-0 text-success">
                        <span>Giảm giá:</span>
                        <strong>
                          -{formatCurrency(selectedBooking.HoaDon.GiamGia)}
                        </strong>
                      </div>
                    )}
                    {(selectedBooking.HoaDon?.PhuPhiTraTre > 0) && (
                      <div className="list-group-item d-flex justify-content-between px-0 text-danger">
                        <span>Phụ phí trả trễ:</span>
                        <strong>
                          +{formatCurrency(selectedBooking.HoaDon.PhuPhiTraTre)}
                        </strong>
                      </div>
                    )}
                    <div className="list-group-item d-flex justify-content-between px-0 fs-5 fw-bold text-primary">
                      <span>Tổng cộng:</span>
                      <span>
                        {formatCurrency(selectedBooking.HoaDon?.TongTien || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Trạng thái thanh toán */}
                  <div
                    className={`alert ${
                      selectedBooking.HoaDon?.TinhTrang === "Đã thanh toán"
                        ? "alert-success"
                        : "alert-warning"
                    }`}
                  >
                    <strong>
                      Trạng thái:{" "}
                      {selectedBooking.HoaDon?.TinhTrang || "Chưa thanh toán"}
                    </strong>
                  </div>

                  {/* Action buttons */}
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button
                      className="btn btn-success"
                      onClick={handleEmailInvoice}
                    >
                      <i className="bx bx-mail-send me-1"></i> Gửi Email
                    </Button>
                    <Button
                      className="btn btn-primary"
                      onClick={handleDownloadInvoice}
                    >
                      <i className="bx bx-download me-1"></i> Tải Hóa Đơn
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Báo cáo chi tiết (Thay thế Portal) */}
      <Modal
        isOpen={showCheckoutStatsModal}
        onClose={() => setShowCheckoutStatsModal(false)}
        title={
          (selectedReportType === "checkout-stats" && "Thống Kê Checkout") ||
          (selectedReportType === "revenue" && "Doanh Thu Thực Tế") ||
          (selectedReportType === "late-fee" && "Trả Trễ & Phụ Phí") ||
          (selectedReportType === "occupancy" && "Tỷ Lệ Lấp Đầy") ||
          "Báo cáo"
        }
        dialogClassName="modal-xl"
      >
        <CheckoutAdvancedStats initialTab={selectedReportType} />
        <div className="text-end mt-4 pt-3 border-top">
          <Button
            className="btn btn-outline-secondary"
            onClick={() => setShowCheckoutStatsModal(false)}
          >
            Đóng
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutManager;