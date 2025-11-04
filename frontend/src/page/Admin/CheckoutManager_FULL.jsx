import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import checkoutService from "../../services/checkoutService";
import { adminGetAllBookings } from "../../services/bookingService";
import CheckoutStatistics from "../../components/checkout/CheckoutStatistics";
import CheckoutAdvancedStats from "../../components/checkout/CheckoutAdvancedStats";
import "./CheckoutManager.css";

const CheckoutManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [lateFeeInfo, setLateFeeInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("confirm");
  const [paymentData, setPaymentData] = useState({
    phuongThuc: "Tiền mặt",
    soTien: 0,
    ghiChu: "",
  });
  const [reviewData, setReviewData] = useState({
    diemDanhGia: 5,
    binhLuan: "",
  });
  const [showCheckoutStatsModal, setShowCheckoutStatsModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null); // checkout-stats, revenue, late-fee, occupancy

  useEffect(() => {
    loadActiveBookings();
  }, []);

  const loadActiveBookings = async () => {
    try {
      setLoading(true);
      const response = await adminGetAllBookings();
      const bookingsData = Array.isArray(response)
        ? response
        : response.data || [];
      const activeBookings = bookingsData.filter(
        (b) => b.TrangThai === "Đang sử dụng" || b.TrangThai === "Hoàn thành"
      );
      setBookings(activeBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      alert("Lỗi khi tải danh sách đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (booking) => {
    setSelectedBooking(booking);

    // Nếu booking đã hoàn thành, chỉ hiển thị chi tiết mà không tính phí trễ
    if (booking.TrangThai === "Hoàn thành") {
      setLateFeeInfo(null); // Không có phí trễ cho booking đã hoàn thành
      setActiveTab("confirm");
      setShowCheckoutModal(true);
      return;
    }

    // Nếu booking đang sử dụng, tính phí trễ
    try {
      const response = await checkoutService.calculateLateFee(
        booking.MaDatPhong
      );
      setLateFeeInfo(response.data);
      setSelectedBooking(booking);
      setActiveTab("confirm");

      // Tính số tiền còn lại để mặc định cho thanh toán
      const totalPaid =
        booking.HoaDon?.LichSuThanhToan?.reduce(
          (sum, payment) =>
            payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
          0
        ) || 0;
      const totalAmount =
        (booking.HoaDon?.TongTien || 0) + (response.data?.lateFee || 0);
      const remaining = totalAmount - totalPaid;

      setPaymentData({
        phuongThuc: "Tiền mặt",
        soTien: remaining > 0 ? remaining : 0,
        ghiChu: "",
      });

      setReviewData({
        diemDanhGia: 5,
        binhLuan: "",
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

      await checkoutService.processPayment(
        selectedBooking.MaDatPhong,
        paymentData
      );
      alert("✅ Thanh toán thành công!");

      // Reload booking để cập nhật thông tin thanh toán
      const response = await checkoutService.getCheckoutDetails(
        selectedBooking.MaDatPhong
      );
      setSelectedBooking(response.data);

      // Reset form
      setPaymentData({
        phuongThuc: "Tiền mặt",
        soTien: 0,
        ghiChu: "",
      });
    } catch (error) {
      alert(
        "Lỗi khi thanh toán: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleReview = async () => {
    try {
      if (
        !reviewData.diemDanhGia ||
        reviewData.diemDanhGia < 1 ||
        reviewData.diemDanhGia > 5
      ) {
        alert("Vui lòng chọn điểm đánh giá từ 1-5!");
        return;
      }

      await checkoutService.submitReview(
        selectedBooking.MaDatPhong,
        reviewData
      );
      alert("⭐ Cảm ơn bạn đã đánh giá!");

      // Reset form
      setReviewData({
        diemDanhGia: 5,
        binhLuan: "",
      });
    } catch (error) {
      alert(
        "Lỗi khi gửi đánh giá: " +
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

      {/* Thống kê cơ bản với 5 nút báo cáo */}
      {console.log("🔍 About to render CheckoutStatistics component")}
      <CheckoutStatistics
        onOpenReport={(reportType) => {
          console.log("🎯 onOpenReport called with:", reportType);
          setShowCheckoutStatsModal(true);
          setSelectedReportType(reportType);
        }}
      />

      {/* XÓA phần dưới - đã tích hợp vào CheckoutStatistics */}
      <div style={{ display: "none" }}>
        <h5>📊 Báo Cáo và Thống Kê Sau Check-out</h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "15px",
          }}
        >
          {/* Button 1: Thống kê checkout theo ngày/tháng */}
          <button
            onClick={() => {
              setShowCheckoutStatsModal(true);
              setSelectedReportType("checkout-stats");
            }}
            style={{
              padding: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(102, 126, 234, 0.4)";
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📈</div>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              Thống Kê Checkout
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>
              Số lượt trả phòng theo ngày/tháng
            </div>
          </button>

          {/* Button 2: Doanh thu thực tế */}
          <button
            onClick={() => {
              setShowCheckoutStatsModal(true);
              setSelectedReportType("revenue");
            }}
            style={{
              padding: "20px",
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 4px 12px rgba(17, 153, 142, 0.4)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(17, 153, 142, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(17, 153, 142, 0.4)";
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>💰</div>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              Doanh Thu Thực Tế
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>
              Tính doanh thu đã thanh toán
            </div>
          </button>

          {/* Button 3: Trả trễ & phụ phí */}
          <button
            onClick={() => {
              setShowCheckoutStatsModal(true);
              setSelectedReportType("late-fee");
            }}
            style={{
              padding: "20px",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 4px 12px rgba(250, 112, 154, 0.4)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(250, 112, 154, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(250, 112, 154, 0.4)";
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏰</div>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              Trả Trễ & Phụ Phí
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>
              Thống kê trả trễ, phụ phí phát sinh
            </div>
          </button>

          {/* Button 4: Tỷ lệ lấp đầy */}
          <button
            onClick={() => {
              setShowCheckoutStatsModal(true);
              setSelectedReportType("occupancy");
            }}
            style={{
              padding: "20px",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 4px 12px rgba(79, 172, 254, 0.4)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(79, 172, 254, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(79, 172, 254, 0.4)";
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🏨</div>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              Tỷ Lệ Lấp Đầy
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>
              Hiệu suất sử dụng phòng
            </div>
          </button>
        </div>
      </div>

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
                  { id: "confirm", icon: "✅", label: "Xác nhận" },
                  { id: "payment", icon: "💰", label: "Thanh toán" },
                  { id: "review", icon: "⭐", label: "Đánh giá" },
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
                {/* TAB 1: XÁC NHẬN TRẢ PHÒNG */}
                {activeTab === "confirm" && (
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
                      {lateFeeInfo && lateFeeInfo.lateFee > 0 && (
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
                          <strong>{formatCurrency(lateFeeInfo.lateFee)}</strong>
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
                          {formatCurrency(
                            (selectedBooking.HoaDon?.TongTien || 0) +
                              (lateFeeInfo?.lateFee || 0)
                          )}
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
                            {formatCurrency(
                              (selectedBooking.HoaDon?.TongTien || 0) +
                                (lateFeeInfo?.lateFee || 0)
                            )}
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
                              (selectedBooking.HoaDon?.TongTien || 0) +
                                (lateFeeInfo?.lateFee || 0) -
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

                    {/* Form thanh toán */}
                    <div style={{ marginBottom: "20px" }}>
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
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #e9ecef",
                          borderRadius: "8px",
                          fontSize: "16px",
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

                    <div style={{ marginBottom: "20px" }}>
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
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #e9ecef",
                          borderRadius: "8px",
                          fontSize: "16px",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
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
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #e9ecef",
                          borderRadius: "8px",
                          fontSize: "16px",
                          fontFamily: "inherit",
                        }}
                        placeholder="Nhập ghi chú (không bắt buộc)"
                      />
                    </div>

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

                {/* TAB 3: ĐÁNH GIÁ */}
                {activeTab === "review" && (
                  <div>
                    <div
                      style={{
                        textAlign: "center",
                        marginBottom: "30px",
                      }}
                    >
                      <div style={{ fontSize: "64px", marginBottom: "16px" }}>
                        ⭐
                      </div>
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "24px",
                          color: "#495057",
                        }}
                      >
                        Đánh giá trải nghiệm của bạn
                      </h3>
                      <p style={{ margin: 0, color: "#6c757d" }}>
                        Chia sẻ cảm nhận của bạn về phòng và dịch vụ
                      </p>
                    </div>

                    <div style={{ marginBottom: "30px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >
                        Chọn số sao (1-5):
                      </label>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              setReviewData({
                                ...reviewData,
                                diemDanhGia: star,
                              })
                            }
                            style={{
                              fontSize: "48px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              opacity: star <= reviewData.diemDanhGia ? 1 : 0.3,
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.transform = "scale(1.2)")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.transform = "scale(1)")
                            }
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                      <p
                        style={{
                          textAlign: "center",
                          marginTop: "8px",
                          color: "#667eea",
                          fontWeight: "600",
                          fontSize: "18px",
                        }}
                      >
                        {reviewData.diemDanhGia}/5 sao
                      </p>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                        }}
                      >
                        Nhận xét của bạn:
                      </label>
                      <textarea
                        value={reviewData.binhLuan}
                        onChange={(e) =>
                          setReviewData({
                            ...reviewData,
                            binhLuan: e.target.value,
                          })
                        }
                        rows="5"
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid #e9ecef",
                          borderRadius: "8px",
                          fontSize: "16px",
                          fontFamily: "inherit",
                        }}
                        placeholder="Chia sẻ trải nghiệm của bạn về phòng, dịch vụ, nhân viên..."
                      />
                    </div>

                    <button
                      onClick={handleReview}
                      style={{
                        width: "100%",
                        padding: "14px 32px",
                        background:
                          "linear-gradient(135deg, #ffc107 0%, #ff9800 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "18px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      ⭐ Gửi đánh giá
                    </button>

                    {/* Hiển thị đánh giá đã có */}
                    {selectedBooking.DanhGia && (
                      <div
                        style={{
                          marginTop: "30px",
                          padding: "20px",
                          background: "#fff3cd",
                          borderRadius: "12px",
                          border: "2px solid #ffc107",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 12px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#856404",
                          }}
                        >
                          ✅ Đánh giá của bạn
                        </h4>
                        <div
                          style={{
                            fontSize: "24px",
                            marginBottom: "8px",
                          }}
                        >
                          {"⭐".repeat(selectedBooking.DanhGia.DiemDanhGia)}
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "18px",
                              color: "#856404",
                            }}
                          >
                            {selectedBooking.DanhGia.DiemDanhGia}/5
                          </span>
                        </div>
                        {selectedBooking.DanhGia.BinhLuan && (
                          <p
                            style={{
                              margin: "0 0 8px 0",
                              color: "#856404",
                            }}
                          >
                            {selectedBooking.DanhGia.BinhLuan}
                          </p>
                        )}
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#6c757d",
                          }}
                        >
                          Ngày đánh giá:{" "}
                          {formatDate(selectedBooking.DanhGia.NgayDanhGia)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: HÓA ĐƠN */}
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
                      {(selectedBooking.HoaDon?.PhuPhiTraTre > 0 ||
                        (lateFeeInfo && lateFeeInfo.lateFee > 0)) && (
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
                            +
                            {formatCurrency(
                              selectedBooking.HoaDon?.PhuPhiTraTre ||
                                lateFeeInfo?.lateFee ||
                                0
                            )}
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
                          {formatCurrency(
                            (selectedBooking.HoaDon?.TongTien || 0) +
                              (lateFeeInfo?.lateFee || 0)
                          )}
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

      {/* Modal Báo cáo chi tiết */}
      {showCheckoutStatsModal &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
            }}
            onClick={() => setShowCheckoutStatsModal(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                maxWidth: "1200px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  background: "white",
                  zIndex: 10,
                  borderBottom: "2px solid #f0f0f0",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ margin: 0, color: "#2c3e50" }}>
                    {selectedReportType === "checkout-stats" &&
                      "📈 Thống Kê Checkout"}
                    {selectedReportType === "revenue" && "💰 Doanh Thu Thực Tế"}
                    {selectedReportType === "late-fee" &&
                      "⏰ Trả Trễ & Phụ Phí"}
                    {selectedReportType === "occupancy" && "🏨 Tỷ Lệ Lấp Đầy"}
                  </h4>
                  <button
                    onClick={() => setShowCheckoutStatsModal(false)}
                    style={{
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    ✕ Đóng
                  </button>
                </div>
              </div>
              <div style={{ padding: "20px" }}>
                <CheckoutAdvancedStats initialTab={selectedReportType} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CheckoutManager;
