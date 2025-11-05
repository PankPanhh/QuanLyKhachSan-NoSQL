import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCheckCircle,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaBed,
  FaMoneyBillWave,
  FaHome,
  FaReceipt,
} from "react-icons/fa";

function BookingSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingInfo, setBookingInfo] = useState(null);

  useEffect(() => {
    // Lấy thông tin booking từ state được truyền qua navigate
    if (location.state?.booking) {
      setBookingInfo(location.state.booking);
    } else {
      // Nếu không có thông tin, chuyển về trang chủ
      navigate("/");
    }
  }, [location, navigate]);

  if (!bookingInfo) {
    return (
      <div className="container padding-large text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const {
    MaDatPhong,
    room,
    contactInfo,
    checkIn,
    checkOut,
    numGuests,
    numRooms,
    paymentMethod,
    totalAmount,
    paymentMeta,
    promo,
  } = bookingInfo;

  // Format ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Tính số đêm
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    const diff = co.getTime() - ci.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const nights = calculateNights();

  // Payment method display
  const getPaymentMethodText = (method) => {
    const methods = {
      card: "Thẻ tín dụng (Visa/Master)",
      paypal: "PayPal",
      bank: "Chuyển khoản ngân hàng",
      onArrival: "Thanh toán tại khách sạn",
    };
    return methods[method] || method;
  };

  return (
    <div className="container padding-large">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Success Header */}
          <div className="text-center mb-5">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #28a745, #20c997)",
                marginBottom: "20px",
                animation: "scaleIn 0.5s ease-out",
              }}
            >
              <FaCheckCircle style={{ fontSize: "60px", color: "white" }} />
            </div>
            <h1 className="display-4 fw-bold text-success mb-3">
              Đặt Phòng Thành Công!
            </h1>
            <p className="lead text-muted">
              Cảm ơn bạn đã tin tưởng và lựa chọn Serpentine Palace
            </p>
            <p className="text-muted">
              Mã đặt phòng của bạn:{" "}
              <strong className="text-primary">{MaDatPhong}</strong>
            </p>
          </div>

          {/* Main Card */}
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Room Info Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #D16806, #e67e22)",
                padding: "30px",
                color: "white",
              }}
            >
              <h3 className="mb-0">
                <FaBed className="me-2" />
                {room?.TenPhong || room?.name || "Thông tin phòng"}
              </h3>
              <p className="mb-0 mt-2" style={{ fontSize: "18px" }}>
                {room?.LoaiPhong || room?.type || ""}
              </p>
            </div>

            {/* Booking Details */}
            <div className="p-4">
              <div className="row g-4">
                {/* Column 1: Thông tin liên hệ */}
                <div className="col-md-6">
                  <h5 className="mb-3 text-primary">
                    <FaUser className="me-2" />
                    Thông Tin Khách Hàng
                  </h5>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaUser className="text-muted me-2" />
                      <div>
                        <small className="text-muted d-block">Họ và tên</small>
                        <strong>{contactInfo?.fullName}</strong>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <FaEnvelope className="text-muted me-2" />
                      <div>
                        <small className="text-muted d-block">Email</small>
                        <strong>{contactInfo?.email}</strong>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <FaPhone className="text-muted me-2" />
                      <div>
                        <small className="text-muted d-block">
                          Số điện thoại
                        </small>
                        <strong>{contactInfo?.phone}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Thông tin đặt phòng */}
                <div className="col-md-6">
                  <h5 className="mb-3 text-primary">
                    <FaCalendarAlt className="me-2" />
                    Chi Tiết Đặt Phòng
                  </h5>
                  <div className="mb-3">
                    <div className="mb-2">
                      <small className="text-muted d-block">
                        Ngày nhận phòng
                      </small>
                      <strong>{formatDate(checkIn)}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">
                        Ngày trả phòng
                      </small>
                      <strong>{formatDate(checkOut)}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Số đêm</small>
                      <strong>{nights} đêm</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Số phòng</small>
                      <strong>{numRooms} phòng</strong>
                    </div>
                    <div>
                      <small className="text-muted d-block">Số khách</small>
                      <strong>{numGuests} người</strong>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* Payment Info */}
              <div className="row">
                <div className="col-md-12">
                  <h5 className="mb-3 text-primary">
                    <FaMoneyBillWave className="me-2" />
                    Thông Tin Thanh Toán
                  </h5>
                  <div className="bg-light p-3 rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Phương thức thanh toán:</span>
                      <strong>{getPaymentMethodText(paymentMethod)}</strong>
                    </div>

                    {promo && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Khuyến mãi:</span>
                        <strong>
                          {promo.TenKhuyenMai || promo.name || "Giảm giá"}
                          {promo.discountPercent &&
                            ` (-${promo.discountPercent}%)`}
                        </strong>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mb-2">
                      <span className="fs-5 fw-bold">Tổng tiền:</span>
                      <span className="fs-4 fw-bold text-primary">
                        {totalAmount?.toLocaleString("vi-VN")}₫
                      </span>
                    </div>

                    {paymentMethod === "bank" && paymentMeta?.amount && (
                      <div className="d-flex justify-content-between text-info">
                        <span>Đã thanh toán (chuyển khoản):</span>
                        <strong>
                          {paymentMeta.amount.toLocaleString("vi-VN")}₫
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {paymentMethod === "onArrival" && (
                <div className="mt-4">
                  <div className="alert alert-info">
                    <h6 className="alert-heading">
                      <FaReceipt className="me-2" />
                      Lưu Ý
                    </h6>
                    <p className="mb-0">
                      Vui lòng thanh toán tại quầy lễ tân khi nhận phòng. Xin
                      cảm ơn!
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 d-flex gap-3 justify-content-center">
                <button
                  className="btn btn-lg btn-primary"
                  onClick={() => navigate("/")}
                >
                  <FaHome className="me-2" />
                  Về Trang Chủ
                </button>
                <button
                  className="btn btn-lg btn-outline-primary"
                  onClick={() => navigate("/profile")}
                >
                  <FaReceipt className="me-2" />
                  Xem Đặt Phòng Của Tôi
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-4">
            <p className="text-muted">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua:
            </p>
            <p className="text-muted">
              📞 Hotline: <strong>1900-xxxx</strong> | ✉️ Email:{" "}
              <strong>support@serpentinepalace.com</strong>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default BookingSuccessPage;
