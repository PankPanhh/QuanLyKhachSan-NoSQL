import React, { useState, useEffect } from "react";
import {
  adminGetAllBookings,
  adminConfirmBooking,
  adminCancelBooking,
} from "../../services/bookingService";

function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await adminGetAllBookings();
        setBookings(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Lỗi khi tải bookings:", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case "Đã xác nhận":
      case "Đang sử dụng":
        return "bg-success";
      case "Đang chờ":
        return "bg-warning";
      case "Đã hủy":
        return "bg-danger";
      case "Phòng trống":
        // treat legacy/edge-case as canceled
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Handler functions for actions
  const handleViewDetail = (booking) => {
    // Open modal with full booking info
    setSelectedBooking(booking);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedBooking(null);
  };

  const handleConfirm = async (booking) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xác nhận đặt phòng ${booking.MaDatPhong}?`
      )
    ) {
      try {
        setActionLoading(true);
        const id = booking._id || booking.MaDatPhong;
        const resp = await adminConfirmBooking(id);
        const updated = resp?.data || resp || null;
        if (!updated) throw new Error("Invalid response from server");

        // Update bookings list in-place
        setBookings((prev) =>
          prev.map((b) =>
            b._id === booking._id || b.MaDatPhong === booking.MaDatPhong
              ? { ...b, ...updated }
              : b
          )
        );

        // Update modal detail
        setSelectedBooking((s) => (s ? { ...s, ...updated } : updated));
        alert("Đã xác nhận đặt phòng thành công!");
        setActionLoading(false);
        closeDetail();
      } catch (error) {
        console.error("Lỗi khi xác nhận:", error);
        alert("Có lỗi xảy ra khi xác nhận đặt phòng!");
        setActionLoading(false);
      }
    }
  };

  const handleCancel = async (booking) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn hủy đặt phòng ${booking.MaDatPhong}?\nHành động này không thể hoàn tác.`
      )
    ) {
      try {
        setActionLoading(true);
        const id = booking._id || booking.MaDatPhong;
        const resp = await adminCancelBooking(id);
        const updated = resp?.data || resp || null;
        if (!updated) throw new Error("Invalid response from server");

        setBookings((prev) =>
          prev.map((b) =>
            b._id === booking._id || b.MaDatPhong === booking.MaDatPhong
              ? { ...b, ...updated }
              : b
          )
        );

        setSelectedBooking((s) => (s ? { ...s, ...updated } : updated));
        alert("Đã hủy đặt phòng thành công!");
        setActionLoading(false);
        closeDetail();
      } catch (error) {
        console.error("Lỗi khi hủy:", error);
        alert("Có lỗi xảy ra khi hủy đặt phòng!");
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <h1 className="mb-4">Quản lý Đặt phòng</h1>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2">Đang tải danh sách đặt phòng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <h1 className="mb-4">Quản lý Đặt phòng</h1>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Lỗi tải dữ liệu</h4>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Quản lý Đặt phòng</h1>

      {!Array.isArray(bookings) || bookings.length === 0 ? (
        <div className="alert alert-info">
          <h4>Không có đặt phòng nào</h4>
          <p>Hiện tại chưa có đơn đặt phòng nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Mã Đặt Phòng</th>
                <th>Khách Hàng</th>
                <th>Phòng</th>
                <th>Ngày Nhận</th>
                <th>Ngày Trả</th>
                <th>Số Người</th>
                <th>Trạng Thái</th>
                <th>Tổng Tiền</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(bookings) &&
                bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.MaDatPhong}</td>
                    <td>
                      {booking.KhachHang ? (
                        <div>
                          <strong>{booking.KhachHang.HoTen}</strong>
                          <br />
                          <small className="text-muted">
                            {booking.KhachHang.Email}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      {booking.Phong ? (
                        <div>
                          <strong>{booking.Phong.TenPhong}</strong>
                          <br />
                          <small className="text-muted">
                            {booking.Phong.LoaiPhong}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted">{booking.MaPhong}</span>
                      )}
                    </td>
                    <td>{formatDate(booking.NgayNhanPhong)}</td>
                    <td>{formatDate(booking.NgayTraPhong)}</td>
                    <td>{booking.SoNguoi}</td>
                    <td>
                      <span
                        className={`badge ${getBadgeClass(booking.TrangThai)}`}
                      >
                        {booking.TrangThai}
                      </span>
                    </td>
                    <td>
                      {booking.HoaDon ? (
                        <div>
                          <strong>
                            {formatCurrency(booking.HoaDon.TongTien)}
                          </strong>
                          <br />
                          <small className="text-muted">
                            {booking.HoaDon.TinhTrang}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-secondary modern-btn"
                          title="Xem chi tiết"
                          onClick={() => handleViewDetail(booking)}
                          style={{
                            borderRadius: "20px",
                            padding: "8px 12px",
                            minWidth: "70px",
                            fontSize: "12px",
                          }}
                        >
                          <i className="fas fa-eye me-1"></i>
                          <span className="d-none d-lg-inline">Chi tiết</span>
                        </button>

                        {booking.TrangThai === "Đang chờ" && (
                          <button
                            className="btn btn-sm btn-outline-success modern-btn"
                            title="Xác nhận đặt phòng"
                            onClick={() => handleConfirm(booking)}
                            disabled={actionLoading}
                            style={{
                              borderRadius: "20px",
                              padding: "8px 12px",
                              minWidth: "70px",
                              fontSize: "12px",
                            }}
                          >
                            <i className="fas fa-check me-1"></i>
                            <span className="d-none d-lg-inline">Xác nhận</span>
                          </button>
                        )}

                        {booking.TrangThai !== "Đã hủy" &&
                          booking.TrangThai !== "Hoàn thành" && (
                            <button
                              className="btn btn-sm btn-outline-danger modern-btn"
                              title="Hủy đặt phòng"
                              onClick={() => handleCancel(booking)}
                              disabled={actionLoading}
                              style={{
                                borderRadius: "20px",
                                padding: "8px 12px",
                                minWidth: "70px",
                                fontSize: "12px",
                              }}
                            >
                              <i className="fas fa-times me-1"></i>
                              <span className="d-none d-lg-inline">Hủy</span>
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3">
        <p className="text-muted">
          Tổng cộng:{" "}
          <strong>{Array.isArray(bookings) ? bookings.length : 0}</strong> đặt
          phòng
        </p>
      </div>
      {/* Detail Modal (simple, CSS + markup) */}
      {showDetail && selectedBooking && (
        <div
          className="modal fade show"
          tabIndex={-1}
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeDetail}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Chi tiết đặt phòng — {selectedBooking.MaDatPhong}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDetail}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Khách hàng</h6>
                    <p className="mb-1">
                      <strong>
                        {selectedBooking.KhachHang?.HoTen || "N/A"}
                      </strong>
                    </p>
                    <p className="text-muted mb-1">
                      Email: {selectedBooking.KhachHang?.Email || "N/A"}
                    </p>
                    <p className="text-muted">
                      ID: {selectedBooking.IDKhachHang || "N/A"}
                    </p>

                    <h6 className="mt-3">Phòng</h6>
                    <p className="mb-1">
                      <strong>
                        {selectedBooking.Phong?.TenPhong ||
                          selectedBooking.MaPhong}
                      </strong>
                    </p>
                    <p className="text-muted">
                      Loại: {selectedBooking.Phong?.LoaiPhong || "N/A"}
                    </p>
                    <p className="text-muted">
                      Mã phòng: {selectedBooking.MaPhong}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Thông tin đặt</h6>
                    <p className="mb-1">
                      Ngày đặt: {formatDate(selectedBooking.NgayDat)}
                    </p>
                    <p className="mb-1">
                      Ngày nhận: {formatDate(selectedBooking.NgayNhanPhong)}
                    </p>
                    <p className="mb-1">
                      Ngày trả: {formatDate(selectedBooking.NgayTraPhong)}
                    </p>
                    <p className="mb-1">Số người: {selectedBooking.SoNguoi}</p>
                    <p className="mb-1">
                      Tiền cọc: {formatCurrency(selectedBooking.TienCoc || 0)}
                    </p>
                    <p>
                      Trạng thái:{" "}
                      <span
                        className={`badge ${getBadgeClass(
                          selectedBooking.TrangThai
                        )}`}
                      >
                        {selectedBooking.TrangThai}
                      </span>
                    </p>
                  </div>
                </div>

                <hr />

                <h6>Hóa đơn</h6>
                {selectedBooking.HoaDon ? (
                  <div>
                    <p className="mb-1">
                      Mã hóa đơn:{" "}
                      <strong>{selectedBooking.HoaDon.MaHoaDon}</strong>
                    </p>
                    <p className="mb-1">
                      Ngày lập: {formatDate(selectedBooking.HoaDon.NgayLap)}
                    </p>
                    <p className="mb-1">
                      Tổng tiền phòng:{" "}
                      {formatCurrency(
                        selectedBooking.HoaDon.TongTienPhong || 0
                      )}
                    </p>
                    <p className="mb-1">
                      Tổng dịch vụ:{" "}
                      {formatCurrency(
                        selectedBooking.HoaDon.TongTienDichVu || 0
                      )}
                    </p>
                    <p className="mb-1">
                      Giảm giá:{" "}
                      {formatCurrency(selectedBooking.HoaDon.GiamGia || 0)}
                    </p>
                    <p className="mb-1">
                      Tổng:{" "}
                      <strong>
                        {formatCurrency(selectedBooking.HoaDon.TongTien || 0)}
                      </strong>
                    </p>
                    <p className="mb-1">
                      Tình trạng: {selectedBooking.HoaDon.TinhTrang}
                    </p>

                    {Array.isArray(selectedBooking.HoaDon.LichSuThanhToan) &&
                      selectedBooking.HoaDon.LichSuThanhToan.length > 0 && (
                        <>
                          <h6 className="mt-3">Lịch sử thanh toán</h6>
                          <ul className="list-group list-group-flush">
                            {selectedBooking.HoaDon.LichSuThanhToan.map(
                              (l, i) => (
                                <li key={i} className="list-group-item py-1">
                                  <small>
                                    {l.NgayThanhToan
                                      ? formatDate(l.NgayThanhToan)
                                      : "N/A"}
                                  </small>
                                  &nbsp;•&nbsp; {l.PhuongThuc} &nbsp;•&nbsp;{" "}
                                  {formatCurrency(l.SoTien)}
                                </li>
                              )
                            )}
                          </ul>
                        </>
                      )}
                  </div>
                ) : (
                  <p className="text-muted">Không có thông tin hóa đơn</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeDetail}>
                  Đóng
                </button>
                {selectedBooking.TrangThai === "Đang chờ" && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleConfirm(selectedBooking)}
                    disabled={actionLoading}
                  >
                    Xác nhận
                  </button>
                )}
                {selectedBooking.TrangThai !== "Đã hủy" &&
                  selectedBooking.TrangThai !== "Hoàn thành" && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancel(selectedBooking)}
                      disabled={actionLoading}
                    >
                      Hủy
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingsManager;
