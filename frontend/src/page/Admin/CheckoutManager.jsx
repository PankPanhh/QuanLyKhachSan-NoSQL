import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import checkoutService from "../../services/checkoutService";
import { adminGetAllBookings } from "../../services/bookingService";
import "./CheckoutManager.css";

const CheckoutManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [lateFeeInfo, setLateFeeInfo] = useState(null);

  useEffect(() => {
    loadActiveBookings();
  }, []);

  const loadActiveBookings = async () => {
    try {
      setLoading(true);
      const response = await adminGetAllBookings();
      const bookingsData = Array.isArray(response) ? response : response.data || [];
      const activeBookings = bookingsData.filter(
        (b) => b.TrangThai === "Đang sử dụng"
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
    try {
      const response = await checkoutService.calculateLateFee(booking.MaDatPhong);
      setLateFeeInfo(response.data);
      setSelectedBooking(booking);
      setShowCheckoutModal(true);
    } catch (error) {
      alert("Lỗi khi tính phụ phí: " + (error.response?.data?.message || error.message));
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
      alert("Lỗi khi xác nhận trả phòng: " + (error.response?.data?.message || error.message));
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
      <div className="checkout-manager" style={{textAlign: "center", padding: "60px"}}>
        <div style={{fontSize: "48px", marginBottom: "20px"}}>⏳</div>
        <h3>Đang tải...</h3>
      </div>
    );
  }

  return (
    <div className="checkout-manager">
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "32px",
        borderRadius: "16px",
        marginBottom: "30px",
        color: "white",
      }}>
        <h1 style={{margin: 0, fontSize: "32px", fontWeight: "700"}}>
          🏨 Quản lý Trả phòng (Check-out)
        </h1>
        <p style={{margin: "8px 0 0 0", opacity: 0.9}}>
          Quản lý và xử lý trả phòng, tính phụ phí tự động
        </p>
      </div>

      {bookings.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px",
          background: "#f8f9fa",
          borderRadius: "12px",
        }}>
          <div style={{fontSize: "64px", marginBottom: "16px"}}>🏨</div>
          <h3 style={{color: "#6c757d"}}>Không có phòng nào đang sử dụng</h3>
        </div>
      ) : (
        <div className="bookings-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}>
          {bookings.map((booking) => (
            <div
              key={booking._id}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "2px solid #e9ecef",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                e.currentTarget.style.borderColor = "#667eea";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "#e9ecef";
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: "24px",
                  color: "#667eea",
                  fontWeight: "700",
                }}>
                  🚪 Phòng {booking.MaPhong}
                </h3>
                <span style={{
                  background: "#d4edda",
                  color: "#155724",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}>
                  Đang sử dụng
                </span>
              </div>

              <div style={{
                background: "#f8f9fa",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}>
                <p style={{margin: "0 0 8px 0", display: "flex", justifyContent: "space-between"}}>
                  <span style={{color: "#6c757d"}}>Mã đặt:</span>
                  <strong>{booking.MaDatPhong}</strong>
                </p>
                <p style={{margin: "0 0 8px 0", display: "flex", justifyContent: "space-between"}}>
                  <span style={{color: "#6c757d"}}>Khách hàng:</span>
                  <strong>{booking.IDKhachHang}</strong>
                </p>
                <p style={{margin: "0 0 8px 0", display: "flex", justifyContent: "space-between"}}>
                  <span style={{color: "#6c757d"}}>Ngày nhận:</span>
                  <strong>{formatDate(booking.NgayNhanPhong)}</strong>
                </p>
                <p style={{margin: "0", display: "flex", justifyContent: "space-between"}}>
                  <span style={{color: "#6c757d"}}>Ngày trả dự kiến:</span>
                  <strong style={{color: "#dc3545"}}>{formatDate(booking.NgayTraPhong)}</strong>
                </p>
              </div>

              <button
                onClick={() => handleCheckout(booking)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.02)";
                  e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                ✅ Xác nhận trả phòng
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Trả phòng với Portal */}
      {showCheckoutModal && selectedBooking &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCheckoutModal(false);
              }
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
                maxWidth: "650px",
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
              {/* Header với gradient */}
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "28px 32px",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                  <div style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "28px",
                  }}>
                    🏨
                  </div>
                  <h2 style={{margin: 0, color: "white", fontSize: "26px", fontWeight: "700"}}>
                    Xác nhận trả phòng
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
                  onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
                  onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "32px" }}>
                {/* Thông tin booking */}
                <div style={{
                  background: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}>
                  <h3 style={{
                    margin: "0 0 16px 0",
                    color: "#495057",
                    fontSize: "18px",
                    fontWeight: "600",
                  }}>
                    📋 Thông tin đặt phòng
                  </h3>
                  <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
                    <div>
                      <p style={{margin: "0 0 4px 0", color: "#6c757d", fontSize: "14px"}}>Mã đặt</p>
                      <p style={{margin: 0, fontWeight: "600", fontSize: "16px"}}>{selectedBooking.MaDatPhong}</p>
                    </div>
                    <div>
                      <p style={{margin: "0 0 4px 0", color: "#6c757d", fontSize: "14px"}}>Phòng</p>
                      <p style={{margin: 0, fontWeight: "600", fontSize: "16px", color: "#667eea"}}>
                        {selectedBooking.MaPhong}
                      </p>
                    </div>
                    <div>
                      <p style={{margin: "0 0 4px 0", color: "#6c757d", fontSize: "14px"}}>Ngày trả dự kiến</p>
                      <p style={{margin: 0, fontWeight: "600", fontSize: "16px"}}>
                        {formatDate(selectedBooking.NgayTraPhong)}
                      </p>
                    </div>
                    <div>
                      <p style={{margin: "0 0 4px 0", color: "#6c757d", fontSize: "14px"}}>Ngày trả thực tế</p>
                      <p style={{margin: 0, fontWeight: "600", fontSize: "16px", color: "#28a745"}}>
                        {formatDate(new Date())}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phụ phí trả trễ */}
                {lateFeeInfo && lateFeeInfo.isLate && (
                  <div style={{
                    background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    border: "2px solid #ffc107",
                  }}>
                    <h4 style={{
                      margin: "0 0 12px 0",
                      color: "#856404",
                      fontSize: "18px",
                      fontWeight: "600",
                    }}>
                      ⚠️ Thông báo trả phòng trễ
                    </h4>
                    <div style={{display: "flex", justifyContent: "space-between", marginBottom: "8px"}}>
                      <span style={{color: "#856404"}}>Số ngày trễ:</span>
                      <strong style={{color: "#dc3545", fontSize: "18px"}}>
                        {lateFeeInfo.daysLate} ngày
                      </strong>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                      <span style={{color: "#856404"}}>Phụ phí (20%/ngày):</span>
                      <strong style={{color: "#dc3545", fontSize: "20px"}}>
                        {formatCurrency(lateFeeInfo.lateFee)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Tổng kết hóa đơn */}
                <div style={{
                  background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "2px solid #4caf50",
                }}>
                  <h4 style={{
                    margin: "0 0 16px 0",
                    color: "#2e7d32",
                    fontSize: "18px",
                    fontWeight: "600",
                  }}>
                    💰 Tổng kết thanh toán
                  </h4>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.1)",
                  }}>
                    <span>Tiền phòng:</span>
                    <strong>{formatCurrency(selectedBooking.HoaDon?.TongTienPhong || 0)}</strong>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.1)",
                  }}>
                    <span>Tiền dịch vụ:</span>
                    <strong>{formatCurrency(selectedBooking.HoaDon?.TongTienDichVu || 0)}</strong>
                  </div>
                  {lateFeeInfo && lateFeeInfo.lateFee > 0 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(0,0,0,0.1)",
                      color: "#dc3545",
                    }}>
                      <span>Phụ phí trả trễ:</span>
                      <strong>{formatCurrency(lateFeeInfo.lateFee)}</strong>
                    </div>
                  )}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "16px 0 0 0",
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "#2e7d32",
                  }}>
                    <span>Tổng cộng:</span>
                    <span>
                      {formatCurrency(
                        (selectedBooking.HoaDon?.TongTien || 0) +
                          (lateFeeInfo?.lateFee || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: "20px 32px",
                borderTop: "1px solid #e9ecef",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                background: "#f8f9fa",
                borderRadius: "0 0 16px 16px",
              }}>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  style={{
                    padding: "12px 24px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#5a6268"}
                  onMouseLeave={(e) => e.target.style.background = "#6c757d"}
                >
                  ❌ Hủy
                </button>
                <button
                  onClick={confirmCheckout}
                  style={{
                    padding: "12px 32px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                  }}
                >
                  ✅ Xác nhận trả phòng
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
