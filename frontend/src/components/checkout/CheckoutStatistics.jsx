import React, { useState, useEffect } from "react";
import checkoutService from "../../services/checkoutService";
import "./CheckoutStatistics.css";

const CheckoutStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [period, setPeriod] = useState("day");

  useEffect(() => {
    loadStatistics();
  }, [dateRange, period]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await checkoutService.getStatistics(
        dateRange.startDate,
        dateRange.endDate,
        period
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Đang tải thống kê...</div>;
  }

  if (!statistics || !statistics.summary) {
    return <div className="no-data">Không có dữ liệu thống kê</div>;
  }

  const { summary = {}, timeSeries = [] } = statistics;

  return (
    <div className="checkout-statistics">
      <div className="stats-header">
        <h2>Thống kê Check-out</h2>

        <div className="filters">
          <div className="filter-group">
            <label>Từ ngày:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
            />
          </div>

          <div className="filter-group">
            <label>Đến ngày:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
            />
          </div>

          <div className="filter-group">
            <label>Chu kỳ:</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e3f2fd" }}>
            🚪
          </div>
          <div className="stat-content">
            <h3>Tổng số lượt trả phòng</h3>
            <p className="stat-value">{summary.totalCheckouts || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e8f5e9" }}>
            💰
          </div>
          <div className="stat-content">
            <h3>Doanh thu thực tế</h3>
            <p className="stat-value">
              {formatCurrency(summary.totalRevenue || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fff3cd" }}>
            ⏰
          </div>
          <div className="stat-content">
            <h3>Trả phòng trễ</h3>
            <p className="stat-value">{summary.lateCheckouts || 0}</p>
            <p className="stat-subtitle">
              {summary.lateCheckoutRate?.toFixed(1) || 0}% tổng số
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ffebee" }}>
            🏷️
          </div>
          <div className="stat-content">
            <h3>Tổng phụ phí trả trễ</h3>
            <p className="stat-value">
              {formatCurrency(summary.totalLateFees || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f3e5f5" }}>
            📊
          </div>
          <div className="stat-content">
            <h3>Tỷ lệ lấp đầy</h3>
            <p className="stat-value">
              {summary.occupancyRate?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Time Series Table */}
      {timeSeries && timeSeries.length > 0 && (
        <div className="time-series-section">
          <h3>Chi tiết theo {period === "day" ? "ngày" : "tháng"}</h3>
          <div className="table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Số lượt</th>
                  <th>Doanh thu</th>
                  <th>Phụ phí trễ</th>
                </tr>
              </thead>
              <tbody>
                {timeSeries.map((item, index) => {
                  const date =
                    period === "day"
                      ? `${item._id.day}/${item._id.month}/${item._id.year}`
                      : `${item._id.month}/${item._id.year}`;

                  return (
                    <tr key={index}>
                      <td>{date}</td>
                      <td>{item.count}</td>
                      <td>{formatCurrency(item.revenue)}</td>
                      <td className="late-fee">
                        {formatCurrency(item.lateFees)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <strong>Tổng cộng</strong>
                  </td>
                  <td>
                    <strong>{summary.totalCheckouts}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(summary.totalRevenue)}</strong>
                  </td>
                  <td className="late-fee">
                    <strong>{formatCurrency(summary.totalLateFees)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutStatistics;
