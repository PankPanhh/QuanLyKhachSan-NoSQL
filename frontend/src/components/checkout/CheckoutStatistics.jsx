import React, { useState, useEffect } from "react";
import { adminGetAllBookings } from "../../services/bookingService";
import { formatCurrency } from "../../utils/formatCurrency";

const CheckoutStatistics = () => {
  const [stats, setStats] = useState({
    totalCheckouts: 0,
    totalRevenue: 0,
    lateCheckouts: 0,
    totalLateFee: 0,
    occupancyRate: 0,
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
      const completedBookings = bookingsArray.filter(
        (b) => b.TrangThai === "Hoàn thành"
      );

      const totalCheckouts = completedBookings.length;
      const totalRevenue = completedBookings.reduce(
        (sum, b) => sum + (b.HoaDon?.TongTien || 0),
        0
      );
      const lateCheckouts = completedBookings.filter(
        (b) => (b.HoaDon?.PhuPhiTraTre || 0) > 0
      ).length;
      const totalLateFee = completedBookings.reduce(
        (sum, b) => sum + (b.HoaDon?.PhuPhiTraTre || 0),
        0
      );

      const totalRooms = 30;
      const activeBookings = bookingsArray.filter(
        (b) => b.TrangThai === "Đang sử dụng"
      ).length;
      const occupancyRate =
        totalRooms > 0 ? (activeBookings / totalRooms) * 100 : 0;

      setStats({
        totalCheckouts,
        totalRevenue,
        lateCheckouts,
        totalLateFee,
        occupancyRate,
      });
    } catch (error) {
      console.error("Error loading checkout statistics:", error);
    }
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
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>�</div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#333",
            }}
          >
            {stats.totalCheckouts}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Tổng số lượt trả phòng
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>💰</div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "700",
              color: "#333",
            }}
          >
            {formatCurrency(stats.totalRevenue)}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Doanh thu thực tế
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>⏰</div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#333",
            }}
          >
            {stats.lateCheckouts}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Trả phòng trễ
          </p>
          <p style={{ margin: "5px 0 0 0", color: "#999", fontSize: "12px" }}>
            {stats.totalCheckouts > 0
              ? `${((stats.lateCheckouts / stats.totalCheckouts) * 100).toFixed(
                  1
                )}% tổng số`
              : "0% tổng số"}
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>🏷️</div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "700",
              color: "#333",
            }}
          >
            {formatCurrency(stats.totalLateFee)}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Tổng phụ phí trả trễ
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>📊</div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#333",
            }}
          >
            {stats.occupancyRate.toFixed(1)}%
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Tỷ lệ lấp đầy
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutStatistics;
