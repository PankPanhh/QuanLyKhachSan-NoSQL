import React, { useState, useEffect } from "react";
import checkoutService from "../../services/checkoutService";

const CheckoutAdvancedStats = ({ initialTab = "late-fee" }) => {
  // Map report types: late-fee, occupancy, checkout-stats, revenue
  const getInitialTab = () => {
    if (initialTab === "late-fee" || initialTab === "occupancy")
      return "late-occupancy";
    return initialTab; // checkout-stats or revenue
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [lateFeeData, setLateFeeData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [checkoutStats, setCheckoutStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState("day");
  const formatLocalYMD = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  const [dateRange, setDateRange] = useState({
    start: formatLocalYMD(
      new Date(new Date().setDate(new Date().getDate() - 29))
    ),
    end: formatLocalYMD(new Date()),
  });

  useEffect(() => {
    loadStatistics();
  }, [activeTab]);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      if (activeTab === "late-occupancy") {
        const [lateFeeRes, occupancyRes] = await Promise.all([
          checkoutService.getLateFeeReport(dateRange.start, dateRange.end),
          checkoutService.getOccupancyRate(dateRange.start, dateRange.end),
        ]);
        setLateFeeData(lateFeeRes.data?.data || null);
        setOccupancyData(occupancyRes.data?.data || null);
      } else if (activeTab === "checkout-stats") {
        const response = await checkoutService.getCheckoutStatistics(
          dateRange.start,
          dateRange.end,
          groupBy
        );
        setCheckoutStats(response.data);
      } else if (activeTab === "revenue") {
        const response = await checkoutService.getActualRevenue(
          dateRange.start,
          dateRange.end
        );
        setRevenueData(response.data);
      }
    } catch (error) {
      console.error("Error loading advanced statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStatistics();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-advanced-stats mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">📊 Thống kê nâng cao</h5>
        <button className="btn btn-sm btn-primary" onClick={handleRefresh}>
          🔄 Làm mới
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Từ ngày:</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Đến ngày:</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
            {activeTab === "checkout-stats" && (
              <div className="col-md-2">
                <label className="form-label">Nhóm theo:</label>
                <select
                  className="form-control"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <option value="day">Ngày</option>
                  <option value="month">Tháng</option>
                </select>
              </div>
            )}
            <div
              className={`col-md-${
                activeTab === "checkout-stats" ? "2" : "4"
              } d-flex align-items-end`}
            >
              <button
                className="btn btn-success w-100"
                onClick={loadStatistics}
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "late-occupancy" ? "active" : ""
            }`}
            onClick={() => setActiveTab("late-occupancy")}
          >
            ⏰ Trả Trễ & Lấp Đầy
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "checkout-stats" ? "active" : ""
            }`}
            onClick={() => setActiveTab("checkout-stats")}
          >
            📈 Thống Kê Checkout
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "revenue" ? "active" : ""}`}
            onClick={() => setActiveTab("revenue")}
          >
            💰 Doanh Thu Thực Tế
          </button>
        </li>
      </ul>

      {/* Checkout Statistics Tab */}
      {activeTab === "checkout-stats" && checkoutStats && (
        <div>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h6 className="card-title">Tổng Lượt Checkout</h6>
                  <h2 className="mb-0">
                    {checkoutStats.data.summary.totalCheckouts}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h6 className="card-title">Tổng Doanh Thu</h6>
                  <h2 className="mb-0">
                    {formatCurrency(checkoutStats.data.summary.totalRevenue)}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h6 className="card-title">Trung Bình/Checkout</h6>
                  <h2 className="mb-0">
                    {formatCurrency(
                      checkoutStats.data.summary.averageRevenuePerCheckout
                    )}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Table */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                Chi Tiết Theo {groupBy === "day" ? "Ngày" : "Tháng"}
              </h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>{groupBy === "day" ? "Ngày" : "Tháng"}</th>
                      <th className="text-end">Số Lượt</th>
                      <th className="text-end">Doanh Thu</th>
                      <th className="text-end">Đã Thanh Toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutStats.data.statistics.map((stat, index) => (
                      <tr key={index}>
                        <td>{stat.period}</td>
                        <td className="text-end">{stat.checkouts}</td>
                        <td className="text-end">
                          {formatCurrency(stat.revenue)}
                        </td>
                        <td className="text-end">
                          {formatCurrency(stat.paidAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === "revenue" && revenueData && (
        <div>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h6 className="card-title">Tổng Hóa Đơn</h6>
                  <h3 className="mb-0">
                    {formatCurrency(revenueData.data.summary.totalBilled)}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h6 className="card-title">Đã Thanh Toán</h6>
                  <h3 className="mb-0">
                    {formatCurrency(revenueData.data.summary.totalPaid)}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <h6 className="card-title">Chưa Thanh Toán</h6>
                  <h3 className="mb-0">
                    {formatCurrency(revenueData.data.summary.totalUnpaid)}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h6 className="card-title">Tỷ Lệ Thu Tiền</h6>
                  <h3 className="mb-0">
                    {revenueData.data.summary.collectionRate}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Chi Tiết Doanh Thu</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-2">Tiền Phòng</h6>
                    <h4 className="mb-0">
                      {formatCurrency(revenueData.data.breakdown.roomRevenue)}
                    </h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-2">Dịch Vụ</h6>
                    <h4 className="mb-0">
                      {formatCurrency(
                        revenueData.data.breakdown.serviceRevenue
                      )}
                    </h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-2">Giảm Giá</h6>
                    <h4 className="mb-0 text-danger">
                      -{formatCurrency(revenueData.data.breakdown.discounts)}
                    </h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-light rounded">
                    <h6 className="text-muted mb-2">Phụ Phí Trễ</h6>
                    <h4 className="mb-0 text-success">
                      +{formatCurrency(revenueData.data.breakdown.lateFees)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Phương Thức Thanh Toán</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Phương Thức</th>
                      <th className="text-end">Số Tiền</th>
                      <th className="text-end">Tỷ Lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.data.paymentMethods.map((method, index) => (
                      <tr key={index}>
                        <td>{method.method}</td>
                        <td className="text-end">
                          {formatCurrency(method.amount)}
                        </td>
                        <td className="text-end">{method.percentage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Late Fee Report */}
      {activeTab === "late-occupancy" && lateFeeData && (
        <div className="card mb-3">
          <div className="card-header bg-warning text-dark">
            <h6 className="mb-0">⏰ Báo cáo trả phòng trễ</h6>
          </div>
          <div className="card-body">
            <div className="row text-center mb-3">
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-primary">
                    {lateFeeData.summary.totalCheckouts}
                  </h4>
                  <small className="text-muted">Tổng số lượt trả</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-danger">
                    {lateFeeData.summary.lateCheckouts}
                  </h4>
                  <small className="text-muted">Trả trễ</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-warning">
                    {lateFeeData.summary.latePercentage}
                  </h4>
                  <small className="text-muted">Tỷ lệ trả trễ</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-success">
                    {lateFeeData.summary.totalLateFee.toLocaleString("vi-VN")}{" "}
                    VND
                  </h4>
                  <small className="text-muted">Tổng phụ phí</small>
                </div>
              </div>
            </div>

            {lateFeeData.details.length > 0 && (
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Mã đặt</th>
                      <th>Phòng</th>
                      <th>Giờ trả dự kiến</th>
                      <th>Giờ trả thực tế</th>
                      <th>Số giờ trễ</th>
                      <th>Phụ phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateFeeData.details.slice(0, 5).map((item, index) => (
                      <tr key={index}>
                        <td>{item.MaDatPhong}</td>
                        <td>{item.TenPhong}</td>
                        <td>
                          {new Date(item.NgayTraPhongDuKien).toLocaleString(
                            "vi-VN"
                          )}
                        </td>
                        <td>
                          {new Date(item.NgayTraPhongThucTe).toLocaleString(
                            "vi-VN"
                          )}
                        </td>
                        <td>
                          <span className="badge bg-warning">
                            {item.SoGioTre}h
                          </span>
                        </td>
                        <td className="text-danger fw-bold">
                          {item.PhuPhiTre.toLocaleString("vi-VN")} VND
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lateFeeData.details.length > 5 && (
                  <small className="text-muted">
                    Hiển thị 5/{lateFeeData.details.length} kết quả
                  </small>
                )}
              </div>
            )}

            {lateFeeData.details.length === 0 && (
              <div className="alert alert-info">
                ✅ Không có trường hợp trả phòng trễ trong khoảng thời gian này!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Occupancy Rate */}
      {activeTab === "late-occupancy" && occupancyData && (
        <div className="card">
          <div className="card-header bg-info text-white">
            <h6 className="mb-0">🏨 Tỷ lệ lấp đầy phòng (Occupancy Rate)</h6>
          </div>
          <div className="card-body">
            <div className="row text-center mb-3">
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-primary">
                    {occupancyData.summary.totalRooms}
                  </h4>
                  <small className="text-muted">Tổng số phòng</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-info">
                    {occupancyData.period.days} ngày
                  </h4>
                  <small className="text-muted">Khoảng thời gian</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-warning">
                    {occupancyData.summary.bookedRoomNights}
                  </h4>
                  <small className="text-muted">Số đêm đã đặt</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-box">
                  <h4 className="text-success">
                    {occupancyData.summary.occupancyRate}
                  </h4>
                  <small className="text-muted">Tỷ lệ lấp đầy</small>
                </div>
              </div>
            </div>

            {occupancyData.topRooms.length > 0 && (
              <div>
                <h6 className="mt-3">🏆 Top phòng được đặt nhiều nhất:</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mã phòng</th>
                        <th>Tên phòng</th>
                        <th>Loại phòng</th>
                        <th>Số đêm đã đặt</th>
                        <th>Số lần đặt</th>
                        <th>Tỷ lệ lấp đầy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupancyData.topRooms
                        .slice(0, 10)
                        .map((room, index) => (
                          <tr key={index}>
                            <td>
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : index + 1}
                            </td>
                            <td>{room.MaPhong}</td>
                            <td>{room.TenPhong}</td>
                            <td>
                              <span className="badge bg-secondary">
                                {room.LoaiPhong}
                              </span>
                            </td>
                            <td className="fw-bold">{room.SoDemDaDat}</td>
                            <td>{room.SoLanDat}</td>
                            <td>
                              <span className="badge bg-success">
                                {room.TyLelapDay}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutAdvancedStats;
