import React, { useState, useEffect } from "react";
import { adminGetAllBookings } from "../../services/bookingService";

const CheckoutStatistics = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const bookings = await adminGetAllBookings();
      const bookingsArray = Array.isArray(bookings)
        ? bookings
        : bookings.data || [];

      const totalBookings = bookingsArray.length;
      const activeBookings = bookingsArray.filter(
        (b) => b.TrangThai === "Đang sử dụng"
      ).length;
      const completedBookings = bookingsArray.filter(
        (b) => b.TrangThai === "Hoàn thành"
      ).length;

      // Calculate total revenue from completed bookings
      const totalRevenue = bookingsArray
        .filter((b) => b.TrangThai === "Hoàn thành")
        .reduce((sum, b) => sum + (b.HoaDon?.TongTien || 0), 0);

      // Calculate pending payments
      const pendingPayments = bookingsArray
        .filter((b) => b.TrangThai === "Hoàn thành")
        .reduce((sum, b) => {
          const totalAmount = b.HoaDon?.TongTien || 0;
          const paidAmount =
            b.HoaDon?.LichSuThanhToan?.reduce(
              (paid, payment) =>
                paid +
                (payment.TrangThai === "Thành công" ? payment.SoTien : 0),
              0
            ) || 0;
          return sum + Math.max(0, totalAmount - paidAmount);
        }, 0);

      setStats({
        totalBookings,
        activeBookings,
        completedBookings,
        totalRevenue,
        pendingPayments,
      });
    } catch (error) {
      console.error("Error loading checkout statistics:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Tổng số booking */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>📊</div>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}
          >
            {stats.totalBookings}
          </h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Tổng số đặt phòng</p>
        </div>

        {/* Đang sử dụng */}
        <div
          style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>🏨</div>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}
          >
            {stats.activeBookings}
          </h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Đang sử dụng</p>
        </div>

        {/* Đã hoàn thành */}
        <div
          style={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}
          >
            {stats.completedBookings}
          </h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Đã hoàn thành</p>
        </div>

        {/* Tổng doanh thu */}
        <div
          style={{
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>💰</div>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}
          >
            {formatCurrency(stats.totalRevenue)}
          </h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Tổng doanh thu</p>
        </div>

        {/* Chưa thanh toán */}
        <div
          style={{
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>⏳</div>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}
          >
            {formatCurrency(stats.pendingPayments)}
          </h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Chưa thanh toán</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutStatistics;
