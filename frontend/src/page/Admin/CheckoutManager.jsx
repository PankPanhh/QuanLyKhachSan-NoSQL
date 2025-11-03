import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import checkoutService from "../../services/checkoutService";
import { adminGetAllBookings } from "../../services/bookingService";
import CheckoutStatistics from "../../components/checkout/CheckoutStatistics";
import "./CheckoutManager.css";

const CheckoutManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [lateFeeInfo, setLateFeeInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [calculatedTotal, setCalculatedTotal] = useState({
    baseTongTien: 0,
    lateFee: 0,
    totalAmount: 0,
  });
  const [paymentData, setPaymentData] = useState({
    phuongThuc: "Tiền mặt",
    soTien: 0,
    ghiChu: "",
  });

  useEffect(() => {
    loadActiveBookings();
  }, []);

  // Helper function để lấy late fee đúng
  const getLateFee = () => {
    return calculatedTotal.lateFee || 0;
  };

  const loadActiveBookings = async () => {
    try {
      setLoading(true);
      const response = await adminGetAllBookings();
      const bookingsData = Array.isArray(response)
        ? response
        : response.data || [];

      // Lọc: Đang sử dụng HOẶC Hoàn thành nhưng chưa thanh toán hết
      const activeBookings = bookingsData.filter((b) => {
        if (b.TrangThai === "Đang sử dụng") return true;

        if (b.TrangThai === "Hoàn thành") {
          // Kiểm tra đã thanh toán hết chưa - Dùng smart detection
          const tongTienPhong = b.HoaDon?.TongTienPhong || 0;
          const tongTienDichVu = b.HoaDon?.TongTienDichVu || 0;
          const giamGia = b.HoaDon?.GiamGia || 0;
          const phuPhiTraTre = b.HoaDon?.PhuPhiTraTre || 0;

          // Tính lại baseTongTien từ nguồn đáng tin cậy
          const correctBaseTongTien = tongTienPhong + tongTienDichVu - giamGia;
          let baseTongTien = b.HoaDon?.TongTien || 0;

          // Smart detection: Nếu TongTien khác correctBaseTongTien thì dùng correctBaseTongTien
          if (
            phuPhiTraTre > 0 &&
            Math.abs(baseTongTien - correctBaseTongTien) >= 10
          ) {
            baseTongTien = correctBaseTongTien;
          }

          const totalAmount = baseTongTien + phuPhiTraTre;
          const totalPaid =
            b.HoaDon?.LichSuThanhToan?.reduce(
              (sum, p) => (p.TrangThai === "Thành công" ? sum + p.SoTien : sum),
              0
            ) || 0;

          // Chỉ hiển thị nếu chưa thanh toán xong
          return totalPaid < totalAmount;
        }

        return false;
      });

      setBookings(activeBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      alert("Lỗi khi tải danh sách đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (booking) => {
    try {
      const response = await checkoutService.calculateLateFee(
        booking.MaDatPhong
      );
      setLateFeeInfo(response.data);
      setSelectedBooking(booking);
      setActiveTab("info");

      // Tính số tiền còn lại để mặc định cho thanh toán
      const totalPaid =
        booking.HoaDon?.LichSuThanhToan?.reduce(
          (sum, payment) =>
            payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
          0
        ) || 0;

      // Smart detection: Xử lý data cũ bị lỗi (TongTien đã bị cộng phụ phí)
      const savedLateFee = booking.HoaDon?.PhuPhiTraTre || 0;
      const calculatedLateFee = response.data?.lateFee || 0;

      let baseTongTien = booking.HoaDon?.TongTien || 0;
      let lateFee = 0;

      if (booking.TrangThai === "Hoàn thành" && savedLateFee > 0) {
        // Booking đã confirm, kiểm tra TongTien có bị cộng sai không
        const tongTienPhong = booking.HoaDon?.TongTienPhong || 0;
        const tongTienDichVu = booking.HoaDon?.TongTienDichVu || 0;
        const correctTongTien = tongTienPhong + tongTienDichVu;

        // Nếu TongTien = TongTienPhong + TongTienDichVu thì chưa cộng phụ phí (đúng)
        // Nếu TongTien > đó thì đã cộng phụ phí rồi (data cũ sai)
        if (Math.abs(baseTongTien - correctTongTien) < 10) {
          // Data đúng: TongTien chưa bao gồm phụ phí
          lateFee = savedLateFee;
        } else {
          // Data sai: TongTien đã bao gồm phụ phí, cần trừ ra
          baseTongTien = correctTongTien;
          lateFee = savedLateFee;
          console.warn(
            `⚠️ Phát hiện data cũ bị lỗi: Booking ${booking.MaDatPhong}, TongTien đã bị cộng phụ phí`
          );
        }
      } else {
        // Chưa confirm hoặc không có phụ phí
        lateFee = calculatedLateFee;
      }

      const totalAmount = baseTongTien + lateFee;
      const remaining = totalAmount - totalPaid;

      // Lưu giá trị đã tính toán để dùng trong UI
      setCalculatedTotal({
        baseTongTien,
        lateFee,
        totalAmount,
      });

      setPaymentData({
        phuongThuc: "Tiền mặt",
        soTien: remaining > 0 ? remaining : 0,
        ghiChu: "",
      });

      setShowCheckoutModal(true);
    } catch (error) {
      alert(
        "Lỗi khi tính phụ phí: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const confirmCheckout = async () => {
    try {
      await checkoutService.confirmCheckout(selectedBooking.MaDatPhong);
      alert("✅ Trả phòng thành công!");
      setShowCheckoutModal(false);
      setSelectedBooking(null);
      loadActiveBookings();
    } catch (error) {
      alert(
        "Lỗi khi xác nhận trả phòng: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handlePayment = async () => {
    try {
      if (!paymentData.soTien || paymentData.soTien <= 0) {
        alert("Vui lòng nhập số tiền thanh toán!");
        return;
      }

      // Kiểm tra số tiền thanh toán không vượt quá số tiền còn lại
      const totalAmount = calculatedTotal.totalAmount;
      const totalPaid =
        selectedBooking.HoaDon?.LichSuThanhToan?.reduce(
          (sum, p) => (p.TrangThai === "Thành công" ? sum + p.SoTien : sum),
          0
        ) || 0;
      const remainingBeforePayment = totalAmount - totalPaid;

      if (paymentData.soTien > remainingBeforePayment) {
        alert(
          `Số tiền thanh toán không được vượt quá số tiền còn lại!\nCòn lại: ${formatCurrency(
            remainingBeforePayment
          )}`
        );
        return;
      }

      const paymentResponse = await checkoutService.processPayment(
        selectedBooking.MaDatPhong,
        paymentData
      );

      // Lấy thông tin từ payment response (chính xác nhất)
      const paymentResult = paymentResponse.data;
      const remainingAfterPayment = paymentResult.conLai || 0;

      // Delay để backend commit database
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reload booking từ database
      try {
        const response = await checkoutService.getCheckoutDetails(
          selectedBooking.MaDatPhong
        );
        if (response.data && response.data.booking) {
          const updatedBooking = response.data.booking;
          setSelectedBooking(updatedBooking);

          // CẬP NHẬT LẠI calculatedTotal sau khi thanh toán
          const savedLateFee = updatedBooking.HoaDon?.PhuPhiTraTre || 0;
          const tongTienPhong = updatedBooking.HoaDon?.TongTienPhong || 0;
          const tongTienDichVu = updatedBooking.HoaDon?.TongTienDichVu || 0;
          const correctTongTien = tongTienPhong + tongTienDichVu;

          let baseTongTien = updatedBooking.HoaDon?.TongTien || 0;
          let lateFee = savedLateFee;

          // Smart detection cho data cũ
          if (updatedBooking.TrangThai === "Hoàn thành" && savedLateFee > 0) {
            if (Math.abs(baseTongTien - correctTongTien) >= 10) {
              baseTongTien = correctTongTien;
            }
          }

          setCalculatedTotal({
            baseTongTien,
            lateFee,
            totalAmount: baseTongTien + lateFee,
          });
        }
      } catch (reloadError) {
        console.error("Warning: Could not reload booking details", reloadError);
      }

      alert("✅ Thanh toán thành công!");

      // Reset form với số tiền từ payment response (đáng tin cậy)
      setPaymentData({
        phuongThuc: "Tiền mặt",
        soTien: remainingAfterPayment > 0 ? remainingAfterPayment : 0,
        ghiChu: "",
      });
    } catch (error) {
      alert(
        "Lỗi khi thanh toán: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await checkoutService.downloadInvoice(
        selectedBooking.MaDatPhong
      );

      // Tạo blob từ response
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Tạo link download
      const link = document.createElement("a");
      link.href = url;
      link.download = `HoaDon_${selectedBooking.MaDatPhong}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(url);

      alert("📄 Tải hóa đơn thành công!");

      // Đóng modal và reload danh sách (ẩn booking đã hoàn tất)
      setShowCheckoutModal(false);
      setSelectedBooking(null);
      loadActiveBookings();
    } catch (error) {
      alert(
        "Lỗi khi tải hóa đơn: " +
          (error.response?.data?.message || error.message)
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
      alert("📧 Đã gửi hóa đơn qua email!");

      // Đóng modal và reload danh sách (ẩn booking đã hoàn tất)
      setShowCheckoutModal(false);
      setSelectedBooking(null);
      loadActiveBookings();
    } catch (error) {
      alert(
        "Lỗi khi gửi email: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div
        className="checkout-manager"
        style={{ textAlign: "center", padding: "60px" }}
      >
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
        <h3>Đang tải...</h3>
      </div>
    );
  }

  return (
    <div className="checkout-manager">
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "32px",
          borderRadius: "16px",
          marginBottom: "30px",
          color: "white",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>
          🏨 Quản lý Trả phòng (Check-out)
        </h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9 }}>
          Quản lý và xử lý trả phòng, tính phụ phí tự động
        </p>
      </div>

      {/* Thống kê */}
      <CheckoutStatistics />

      {/* Danh sách booking */}
      {bookings.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            background: "#f8f9fa",
            borderRadius: "12px",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏨</div>
          <h3 style={{ color: "#6c757d" }}>Không có phòng nào cần trả</h3>
          <p style={{ color: "#adb5bd" }}>
            Tất cả phòng đã được trả hoặc chưa có khách
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {bookings.map((booking) => (
            <div
              key={booking._id}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(102, 126, 234, 0.2)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Header card */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      color: "#667eea",
                      fontWeight: "700",
                    }}
                  >
                    🏠 Phòng {booking.MaPhong}
                  </h3>
                  <p style={{ margin: "4px 0 0 0", color: "#6c757d" }}>
                    {booking.Phong?.LoaiPhong || "N/A"}
                  </p>
                </div>
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background:
                      booking.TrangThai === "Đang sử dụng"
                        ? "#e3f2fd"
                        : "#e8f5e9",
                    color:
                      booking.TrangThai === "Đang sử dụng"
                        ? "#1976d2"
                        : "#388e3c",
                  }}
                >
                  {booking.TrangThai}
                </span>
              </div>

              {/* Info */}
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px 0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#6c757d" }}>Mã đặt:</span>
                  <strong>{booking.MaDatPhong}</strong>
                </p>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#6c757d" }}>Khách hàng:</span>
                  <strong>
                    {booking.KhachHang?.HoTen || booking.IDKhachHang}
                  </strong>
                </p>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#6c757d" }}>Ngày nhận:</span>
                  <strong>{formatDate(booking.NgayNhanPhong)}</strong>
                </p>
                <p
                  style={{
                    margin: "0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#6c757d" }}>Ngày trả dự kiến:</span>
                  <strong style={{ color: "#dc3545" }}>
                    {formatDate(booking.NgayTraPhong)}
                  </strong>
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={() => handleCheckout(booking)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.02)";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(102, 126, 234, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {booking.TrangThai === "Hoàn thành"
                  ? "📋 Xem chi tiết"
                  : "✅ Xác nhận trả phòng"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Checkout */}
      {showCheckoutModal &&
        selectedBooking &&
        ReactDOM.createPortal(
          <div
            onClick={() => setShowCheckoutModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "20px",
            }}
          >
            <style>
              {`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from {
                    opacity: 0;
                    transform: translateY(30px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}
            </style>
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                position: "relative",
                zIndex: 10001,
                animation: "slideUp 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "28px 32px",
                  borderRadius: "16px 16px 0 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      fontSize: "28px",
                    }}
                  >
                    🏨
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      color: "white",
                      fontSize: "26px",
                      fontWeight: "700",
                    }}
                  >
                    Check-out Phòng {selectedBooking.MaPhong}
                  </h2>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    fontSize: "32px",
                    cursor: "pointer",
                    color: "white",
                    lineHeight: 1,
                    padding: "6px 14px",
                    borderRadius: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "rgba(255,255,255,0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "rgba(255,255,255,0.2)")
                  }
                >
                  ×
                </button>
              </div>

              {/* Tab Navigation */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "2px solid #e9ecef",
                  background: "#f8f9fa",
                }}
              >
                {[
                  { id: "info", icon: "📋", label: "Thông tin" },
                  { id: "payment", icon: "💰", label: "Thanh toán" },
                  { id: "invoice", icon: "📄", label: "Hóa đơn" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background:
                        activeTab === tab.id ? "white" : "transparent",
                      border: "none",
                      borderBottom:
                        activeTab === tab.id
                          ? "3px solid #667eea"
                          : "3px solid transparent",
                      color: activeTab === tab.id ? "#667eea" : "#6c757d",
                      fontSize: "16px",
                      fontWeight: activeTab === tab.id ? "600" : "400",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id)
                        e.target.style.color = "#667eea";
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id)
                        e.target.style.color = "#6c757d";
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ padding: "32px" }}>
                {/* TAB 1: THÔNG TIN BOOKING */}
                {activeTab === "info" && (
                  <div>
                    {/* Thông tin booking */}
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 16px 0",
                          color: "#495057",
                          fontSize: "18px",
                          fontWeight: "600",
                        }}
                      >
                        📋 Thông tin đặt phòng
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              color: "#6c757d",
                              fontSize: "14px",
                            }}
                          >
                            Mã đặt
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: "600",
                              fontSize: "16px",
                            }}
                          >
                            {selectedBooking.MaDatPhong}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              color: "#6c757d",
                              fontSize: "14px",
                            }}
                          >
                            Phòng
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: "600",
                              fontSize: "16px",
                              color: "#667eea",
                            }}
                          >
                            {selectedBooking.MaPhong}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              color: "#6c757d",
                              fontSize: "14px",
                            }}
                          >
                            Ngày trả dự kiến
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: "600",
                              fontSize: "16px",
                            }}
                          >
                            {formatDate(selectedBooking.NgayTraPhong)}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              color: "#6c757d",
                              fontSize: "14px",
                            }}
                          >
                            Ngày trả thực tế
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: "600",
                              fontSize: "16px",
                              color: "#28a745",
                            }}
                          >
                            {formatDate(new Date())}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Phụ phí trả trễ */}
                    {lateFeeInfo && lateFeeInfo.isLate && (
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
                          padding: "20px",
                          borderRadius: "12px",
                          marginBottom: "20px",
                          border: "2px solid #ffc107",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 12px 0",
                            color: "#856404",
                            fontSize: "18px",
                            fontWeight: "600",
                          }}
                        >
                          ⏰ Cảnh báo: Trả phòng trễ
                        </h4>
                        <p style={{ margin: "0 0 8px 0", color: "#856404" }}>
                          Số ngày trễ:{" "}
                          <strong>{lateFeeInfo.daysLate} ngày</strong>
                        </p>
                        <p style={{ margin: 0, fontSize: "18px" }}>
                          Phụ phí trả trễ:{" "}
                          <strong
                            style={{ color: "#dc3545", fontSize: "20px" }}
                          >
                            {formatCurrency(lateFeeInfo.lateFee)}
                          </strong>
                        </p>
                      </div>
                    )}

                    {/* Tổng kết hóa đơn */}
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "2px solid #4caf50",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 16px 0",
                          color: "#2e7d32",
                          fontSize: "18px",
                          fontWeight: "600",
                        }}
                      >
                        💰 Tổng kết thanh toán
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "12px 0",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                        }}
                      >
                        <span>Tiền phòng:</span>
                        <strong>
                          {formatCurrency(
                            selectedBooking.HoaDon?.TongTienPhong || 0
                          )}
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "12px 0",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                        }}
                      >
                        <span>Tiền dịch vụ:</span>
                        <strong>
                          {formatCurrency(
                            selectedBooking.HoaDon?.TongTienDichVu || 0
                          )}
                        </strong>
                      </div>
                      {calculatedTotal.lateFee > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: "1px solid rgba(0,0,0,0.1)",
                            color: "#dc3545",
                          }}
                        >
                          <span>Phụ phí trả trễ:</span>
                          <strong>
                            {formatCurrency(calculatedTotal.lateFee)}
                          </strong>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "16px 0 0 0",
                          fontSize: "22px",
                          fontWeight: "700",
                          color: "#2e7d32",
                        }}
                      >
                        <span>Tổng cộng:</span>
                        <span>
                          {formatCurrency(calculatedTotal.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Button xác nhận */}
                    {selectedBooking.TrangThai === "Đang sử dụng" && (
                      <button
                        onClick={confirmCheckout}
                        style={{
                          width: "100%",
                          marginTop: "20px",
                          padding: "14px 32px",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "18px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        ✅ Xác nhận trả phòng
                      </button>
                    )}
                  </div>
                )}

                {/* TAB 2: THANH TOÁN */}
                {activeTab === "payment" && (
                  <div>
                    {/* Thông tin thanh toán */}
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 16px 0",
                          color: "#495057",
                          fontSize: "18px",
                          fontWeight: "600",
                        }}
                      >
                        💰 Thông tin thanh toán
                      </h3>
                      <div style={{ marginBottom: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 0",
                          }}
                        >
                          <span>Tổng tiền:</span>
                          <strong>
                            {formatCurrency(calculatedTotal.totalAmount)}
                          </strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 0",
                            color: "#28a745",
                          }}
                        >
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
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 0",
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#dc3545",
                            borderTop: "2px solid #dee2e6",
                            marginTop: "8px",
                            paddingTop: "12px",
                          }}
                        >
                          <span>Còn lại:</span>
                          <span>
                            {formatCurrency(
                              calculatedTotal.totalAmount -
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
                    </div>

                    {/* Tính toán isFullyPaid một lần cho toàn bộ form */}
                    {(() => {
                      const totalAmount = calculatedTotal.totalAmount;
                      const totalPaid =
                        selectedBooking.HoaDon?.LichSuThanhToan?.reduce(
                          (sum, p) =>
                            p.TrangThai === "Thành công" ? sum + p.SoTien : sum,
                          0
                        ) || 0;
                      const isFullyPaid = totalPaid >= totalAmount;

                      return (
                        <>
                          {/* Form thanh toán */}
                          <div
                            style={{
                              marginBottom: "20px",
                              opacity: isFullyPaid ? 0.5 : 1,
                            }}
                          >
                            <label
                              style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Phương thức thanh toán:
                            </label>
                            <select
                              value={paymentData.phuongThuc}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  phuongThuc: e.target.value,
                                })
                              }
                              disabled={isFullyPaid}
                              style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                fontSize: "16px",
                                cursor: isFullyPaid ? "not-allowed" : "pointer",
                              }}
                            >
                              <option value="Tiền mặt">Tiền mặt</option>
                              <option value="Chuyển khoản">Chuyển khoản</option>
                              <option value="Thẻ tín dụng">Thẻ tín dụng</option>
                              <option value="PayPal">PayPal</option>
                              <option value="Ví điện tử">
                                Ví điện tử (MoMo, ZaloPay...)
                              </option>
                            </select>
                          </div>

                          <div
                            style={{
                              marginBottom: "20px",
                              opacity: isFullyPaid ? 0.5 : 1,
                            }}
                          >
                            <label
                              style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Số tiền:
                            </label>
                            <input
                              type="number"
                              value={paymentData.soTien}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  soTien: Number(e.target.value),
                                })
                              }
                              disabled={isFullyPaid}
                              style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                fontSize: "16px",
                                cursor: isFullyPaid ? "not-allowed" : "text",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              marginBottom: "20px",
                              opacity: isFullyPaid ? 0.5 : 1,
                            }}
                          >
                            <label
                              style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Ghi chú:
                            </label>
                            <textarea
                              value={paymentData.ghiChu}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  ghiChu: e.target.value,
                                })
                              }
                              rows="3"
                              disabled={isFullyPaid}
                              style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontFamily: "inherit",
                                cursor: isFullyPaid ? "not-allowed" : "text",
                              }}
                              placeholder="Nhập ghi chú (không bắt buộc)"
                            />
                          </div>

                          {/* Kiểm tra đã thanh toán xong chưa */}
                          {isFullyPaid ? (
                            // Đã thanh toán xong - Hiện nút xuất hóa đơn
                            <button
                              onClick={() => setActiveTab("invoice")}
                              style={{
                                width: "100%",
                                padding: "16px 32px",
                                background:
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "18px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow:
                                  "0 4px 15px rgba(102, 126, 234, 0.4)",
                              }}
                            >
                              ✅ Thanh toán hoàn tất - Xuất hóa đơn →
                            </button>
                          ) : (
                            // Chưa thanh toán xong - Hiện nút thanh toán
                            <button
                              onClick={handlePayment}
                              style={{
                                width: "100%",
                                padding: "14px 32px",
                                background:
                                  "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "18px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              💰 Xác nhận thanh toán
                            </button>
                          )}
                        </>
                      );
                    })()}

                    {/* Lịch sử thanh toán */}
                    {selectedBooking.HoaDon?.LichSuThanhToan?.length > 0 && (
                      <div
                        style={{
                          marginTop: "30px",
                          padding: "20px",
                          background: "#f8f9fa",
                          borderRadius: "12px",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 16px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          📋 Lịch sử thanh toán
                        </h4>
                        {selectedBooking.HoaDon.LichSuThanhToan.map(
                          (payment, index) => (
                            <div
                              key={index}
                              style={{
                                padding: "12px",
                                background: "white",
                                borderRadius: "8px",
                                marginBottom: "8px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "4px",
                                }}
                              >
                                <span style={{ fontWeight: "600" }}>
                                  {payment.PhuongThuc}
                                </span>
                                <span
                                  style={{
                                    fontWeight: "700",
                                    color: "#28a745",
                                  }}
                                >
                                  {formatCurrency(payment.SoTien)}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#6c757d",
                                }}
                              >
                                {formatDate(payment.NgayThanhToan)} -{" "}
                                {payment.TrangThai}
                              </div>
                              {payment.GhiChu && (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#adb5bd",
                                    marginTop: "4px",
                                  }}
                                >
                                  {payment.GhiChu}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: HÓA ĐƠN */}
                {activeTab === "invoice" && (
                  <div>
                    <div
                      style={{
                        textAlign: "center",
                        marginBottom: "30px",
                      }}
                    >
                      <div style={{ fontSize: "64px", marginBottom: "16px" }}>
                        📄
                      </div>
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "24px",
                          color: "#495057",
                        }}
                      >
                        Hóa đơn thanh toán
                      </h3>
                      <p style={{ margin: 0, color: "#6c757d" }}>
                        Mã hóa đơn: {selectedBooking.HoaDon?.MaHoaDon}
                      </p>
                    </div>

                    {/* Chi tiết hóa đơn */}
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 16px 0",
                          fontSize: "18px",
                          fontWeight: "600",
                        }}
                      >
                        📋 Chi tiết
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        <span>Tiền phòng:</span>
                        <strong>
                          {formatCurrency(
                            selectedBooking.HoaDon?.TongTienPhong || 0
                          )}
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        <span>Tiền dịch vụ:</span>
                        <strong>
                          {formatCurrency(
                            selectedBooking.HoaDon?.TongTienDichVu || 0
                          )}
                        </strong>
                      </div>
                      {selectedBooking.HoaDon?.GiamGia > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 0",
                            borderBottom: "1px solid #dee2e6",
                            color: "#28a745",
                          }}
                        >
                          <span>Giảm giá:</span>
                          <strong>
                            -{formatCurrency(selectedBooking.HoaDon.GiamGia)}
                          </strong>
                        </div>
                      )}
                      {calculatedTotal.lateFee > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 0",
                            borderBottom: "1px solid #dee2e6",
                            color: "#dc3545",
                          }}
                        >
                          <span>Phụ phí trả trễ:</span>
                          <strong>
                            +{formatCurrency(calculatedTotal.lateFee)}
                          </strong>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "16px 0 0 0",
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#667eea",
                        }}
                      >
                        <span>Tổng cộng:</span>
                        <span>
                          {formatCurrency(calculatedTotal.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      <button
                        onClick={handleDownloadInvoice}
                        style={{
                          padding: "14px 24px",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "16px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        📥 Tải PDF
                      </button>
                      <button
                        onClick={handleEmailInvoice}
                        style={{
                          padding: "14px 24px",
                          background:
                            "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "16px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        📧 Gửi Email
                      </button>
                    </div>

                    {/* Trạng thái thanh toán */}
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "16px",
                        background:
                          selectedBooking.HoaDon?.TinhTrang === "Đã thanh toán"
                            ? "#d4edda"
                            : "#fff3cd",
                        borderRadius: "8px",
                        border:
                          selectedBooking.HoaDon?.TinhTrang === "Đã thanh toán"
                            ? "2px solid #28a745"
                            : "2px solid #ffc107",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "48px",
                          marginBottom: "8px",
                        }}
                      >
                        {selectedBooking.HoaDon?.TinhTrang === "Đã thanh toán"
                          ? "✅"
                          : "⏳"}
                      </div>
                      <strong
                        style={{
                          fontSize: "18px",
                          color:
                            selectedBooking.HoaDon?.TinhTrang ===
                            "Đã thanh toán"
                              ? "#155724"
                              : "#856404",
                        }}
                      >
                        {selectedBooking.HoaDon?.TinhTrang || "Chưa thanh toán"}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "20px 32px",
                  borderTop: "1px solid #e9ecef",
                  background: "#f8f9fa",
                  borderRadius: "0 0 16px 16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  style={{
                    padding: "12px 32px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CheckoutManager;
