import React, { useState, useEffect, useCallback } from "react";
import {
  adminGetAllBookings,
  adminConfirmBooking,
  adminCancelBooking,
} from "../../services/bookingService"; // Đã sửa đường dẫn
import Spinner from "../../components/common/Spinner"; // Đã sửa đường dẫn
import Button from "../../components/common/Button"; // Đã sửa đường dẫn
import Modal from "../../components/common/Modal"; // Đã sửa đường dẫn

function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtering and search states
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  const applyFilters = useCallback(() => {
    const source = Array.isArray(bookings) ? bookings : [];
    let filtered = [...source];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(
        (booking) => booking.TrangThai === filters.status
      );
    }

    // Search by booking code or customer name
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.MaDatPhong.toLowerCase().includes(searchTerm) ||
          (booking.KhachHang &&
            booking.KhachHang.HoTen.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, filters]);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminGetAllBookings();
      const safeData = Array.isArray(data) ? data : [];
      setBookings(safeData);
    } catch (err) {
      setError("Không thể tải danh sách đặt phòng: " + err.message);
      console.error("Lỗi khi tải bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      search: "",
    });
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== "number") {
      amount = 0;
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      "Đang chờ": { bg: "bg-label-warning", text: "Đang chờ" },
      "Đã xác nhận": { bg: "bg-label-success", text: "Đã xác nhận" },
      "Đang sử dụng": { bg: "bg-label-info", text: "Đang sử dụng" },
      "Đã hủy": { bg: "bg-label-danger", text: "Đã hủy" },
      "Hoàn thành": { bg: "bg-label-primary", text: "Hoàn thành" },
      "Phòng trống": { bg: "bg-label-danger", text: "Phòng trống" }, // treat legacy/edge-case as canceled
    };
    return statusColors[status] || { bg: "bg-label-secondary", text: status };
  };

  // Handler functions for actions
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBooking(null);
  };

  const handleConfirm = async (booking) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xác nhận đặt phòng ${booking.MaDatPhong}?`
      )
    )
      return;

    try {
      setActionLoading(true);
      setError(null);
      const id = booking._id || booking.MaDatPhong;
      const resp = await adminConfirmBooking(id);
      const updated = resp?.data || resp || null;
      if (!updated) throw new Error("Invalid response from server");

      // Update bookings list in-place
      const updatedBookings = bookings.map((b) =>
        b._id === booking._id || b.MaDatPhong === booking.MaDatPhong
          ? { ...b, ...updated }
          : b
      );
      setBookings(updatedBookings);

      // Update modal detail
      setSelectedBooking((s) => (s ? { ...s, ...updated } : updated));
      showSuccessMessage("Đã xác nhận đặt phòng thành công!");
      handleCloseDetailModal();
    } catch (error) {
      console.error("Lỗi khi xác nhận:", error);
      setError("Có lỗi xảy ra khi xác nhận đặt phòng: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (booking) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn hủy đặt phòng ${booking.MaDatPhong}?\nHành động này không thể hoàn tác.`
      )
    )
      return;

    try {
      setActionLoading(true);
      setError(null);
      const id = booking._id || booking.MaDatPhong;
      const resp = await adminCancelBooking(id);
      const updated = resp?.data || resp || null;
      if (!updated) throw new Error("Invalid response from server");

      const updatedBookings = bookings.map((b) =>
        b._id === booking._id || b.MaDatPhong === booking.MaDatPhong
          ? { ...b, ...updated }
          : b
      );
      setBookings(updatedBookings);

      setSelectedBooking((s) => (s ? { ...s, ...updated } : updated));
      showSuccessMessage("Đã hủy đặt phòng thành công!");
      handleCloseDetailModal();
    } catch (error) {
      console.error("Lỗi khi hủy:", error);
      setError("Có lỗi xảy ra khi hủy đặt phòng: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- JSX Starts Here ---
  return (
    <div className="container-fluid px-0">
      {/* Success/Error Messages */}
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

      {/* Filters and Search Card */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Bộ lọc và Tìm kiếm</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6 col-md-6">
              <label className="form-label">
                <i className="bx bx-search me-1"></i>Tìm kiếm
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo mã đặt phòng hoặc tên khách..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-toggle-right me-1"></i>Trạng thái
              </label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang chờ">Đang chờ</option>
                <option value="Đã xác nhận">Đã xác nhận</option>
                <option value="Đang sử dụng">Đang sử dụng</option>
                <option value="Đã hủy">Đã hủy</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-12">
              <div className="d-flex gap-2">
                <Button
                  className="btn btn-outline-secondary flex-fill"
                  onClick={clearFilters}
                >
                  <i className="bx bx-x me-1"></i>Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && (
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-warning">
                      <i className="bx bx-time-five"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Đang chờ</span>
                <h3 className="card-title mb-2">
                  {
                    filteredBookings.filter((b) => b.TrangThai === "Đang chờ")
                      .length
                  }
                </h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="bx bx-check-double"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Đã xác nhận</span>
                <h3 className="card-title mb-2">
                  {
                    filteredBookings.filter(
                      (b) => b.TrangThai === "Đã xác nhận"
                    ).length
                  }
                </h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-danger">
                      <i className="bx bx-x-circle"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Đã hủy</span>
                <h3 className="card-title mb-2">
                  {
                    filteredBookings.filter((b) => b.TrangThai === "Đã hủy")
                      .length
                  }
                </h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-user-check"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Đang sử dụng</span>
                <h3 className="card-title mb-2">
                  {
                    filteredBookings.filter(
                      (b) => b.TrangThai === "Đang sử dụng"
                    ).length
                  }
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Danh sách Đặt phòng</h5>
          <span className="text-muted">
            Tổng cộng: {filteredBookings.length}
          </span>
        </div>

        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "400px" }}
          >
            <div className="text-center">
              <Spinner />
              <p className="mt-2">Đang tải danh sách đặt phòng...</p>
            </div>
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
                  <th>Ngày Trả</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <h5 className="text-muted">
                        {bookings.length === 0
                          ? "Chưa có đặt phòng nào"
                          : "Không tìm thấy đặt phòng phù hợp"}
                      </h5>
                      <p className="text-muted">
                        {bookings.length === 0
                          ? "Chưa có đơn đặt phòng nào trong hệ thống."
                          : "Thử điều chỉnh bộ lọc."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const statusInfo = getStatusColor(booking.TrangThai);
                    return (
                      <tr key={booking._id}>
                        <td>
                          <span className="fw-semibold">
                            {booking.MaDatPhong}
                          </span>
                        </td>
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
                        <td>
                          {booking.HoaDon ? (
                            <span className="fw-semibold text-dark">
                              {formatCurrency(booking.HoaDon.TongTien)}
                            </span>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${statusInfo.bg}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              className="btn btn-icon btn-sm btn-outline-success"
                              onClick={() => handleViewDetails(booking)}
                              disabled={actionLoading}
                              title="Xem chi tiết"
                            >
                              <i className="bx bx-show"></i>
                            </Button>

                            {booking.TrangThai === "Đang chờ" && (
                              <Button
                                className="btn btn-icon btn-sm btn-outline-primary"
                                title="Xác nhận đặt phòng"
                                onClick={() => handleConfirm(booking)}
                                disabled={actionLoading}
                              >
                                <i className="bx bx-check"></i>
                              </Button>
                            )}

                            {booking.TrangThai !== "Đã hủy" &&
                              booking.TrangThai !== "Hoàn thành" &&
                              booking.TrangThai !== "Đang sử dụng" && (
                                <Button
                                  className="btn btn-icon btn-sm btn-outline-danger"
                                  title="Hủy đặt phòng"
                                  onClick={() => handleCancel(booking)}
                                  disabled={actionLoading}
                                >
                                  <i className="bx bx-x"></i>
                                </Button>
                              )}
                          </div>
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

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title={`Chi tiết đặt phòng: ${selectedBooking?.MaDatPhong || ""}`}
        dialogClassName="modal-lg"
      >
        {selectedBooking && (
          <div>
            <div className="row">
              {/* Cột trái: Thông tin Khách và Phòng */}
              <div className="col-md-6">
                <h5 className="text-dark">Khách hàng</h5>
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Họ tên</span>
                    <span className="fw-semibold">
                      {selectedBooking.KhachHang?.HoTen || "N/A"}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Email</span>
                    <span>{selectedBooking.KhachHang?.Email || "N/A"}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">ID Khách</span>
                    <span>{selectedBooking.IDKhachHang || "N/A"}</span>
                  </div>
                </div>

                <h5 className="text-dark mt-4">Phòng</h5>
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Tên phòng</span>
                    <span className="fw-semibold">
                      {selectedBooking.Phong?.TenPhong || selectedBooking.MaPhong}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Loại phòng</span>
                    <span>{selectedBooking.Phong?.LoaiPhong || "N/A"}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Mã phòng</span>
                    <span>{selectedBooking.MaPhong}</span>
                  </div>
                </div>
              </div>

              {/* Cột phải: Thông tin Đặt và Trạng thái */}
              <div className="col-md-6">
                <h5 className="text-dark">Thông tin đặt</h5>
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Trạng thái</span>
                    <span
                      className={`badge ${
                        getStatusColor(selectedBooking.TrangThai).bg
                      }`}
                    >
                      {getStatusColor(selectedBooking.TrangThai).text}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Ngày đặt</span>
                    <span>{formatDate(selectedBooking.NgayDat)}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Ngày nhận</span>
                    <span>{formatDate(selectedBooking.NgayNhanPhong)}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Ngày trả</span>
                    <span>{formatDate(selectedBooking.NgayTraPhong)}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Số người</span>
                    <span>{selectedBooking.SoNguoi}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Tiền cọc</span>
                    <span className="fw-semibold text-primary">
                      {formatCurrency(selectedBooking.TienCoc || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            {/* Thông tin Hóa đơn */}
            <h5 className="text-dark">Hóa đơn</h5>
            {selectedBooking.HoaDon ? (
              <div className="row">
                <div className="col-md-6">
                  <div className="list-group list-group-flush">
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Mã hóa đơn</span>
                      <span className="fw-semibold">
                        {selectedBooking.HoaDon.MaHoaDon}
                      </span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Ngày lập</span>
                      <span>{formatDate(selectedBooking.HoaDon.NgayLap)}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Tiền phòng</span>
                      <span>
                        {formatCurrency(
                          selectedBooking.HoaDon.TongTienPhong || 0
                        )}
                      </span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Tiền dịch vụ</span>
                      <span>
                        {formatCurrency(
                          selectedBooking.HoaDon.TongTienDichVu || 0
                        )}
                      </span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Giảm giá</span>
                      <span>
                        {formatCurrency(selectedBooking.HoaDon.GiamGia || 0)}
                      </span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Tổng tiền</span>
                      <span className="fw-semibold text-success fs-5">
                        {formatCurrency(selectedBooking.HoaDon.TongTien || 0)}
                      </span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Tình trạng</span>
                      <span className="fw-semibold">
                        {selectedBooking.HoaDon.TinhTrang}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  {Array.isArray(selectedBooking.HoaDon.LichSuThanhToan) &&
                  selectedBooking.HoaDon.LichSuThanhToan.length > 0 ? (
                    <>
                      <h6 className="text-dark">Lịch sử thanh toán</h6>
                      <ul className="list-group list-group-flush">
                        {selectedBooking.HoaDon.LichSuThanhToan.map((l, i) => (
                          <li
                            key={i}
                            className="list-group-item d-flex justify-content-between px-0"
                          >
                            <span>
                              <i className="bx bx-calendar-check me-1"></i>
                              {l.NgayThanhToan
                                ? formatDate(l.NgayThanhToan)
                                : "N/A"}
                            </span>
                            <span>{l.PhuongThuc}</span>
                            <span className="fw-semibold">
                              {formatCurrency(l.SoTien)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-muted">Chưa có lịch sử thanh toán.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted">Không có thông tin hóa đơn</p>
            )}

            {/* Modal Footer */}
            <div className="text-end mt-4 pt-3 border-top">
              <Button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={handleCloseDetailModal}
                disabled={actionLoading}
              >
                Đóng
              </Button>
              {selectedBooking.TrangThai === "Đang chờ" && (
                <Button
                  type="button"
                  className="btn btn-primary me-2"
                  onClick={() => handleConfirm(selectedBooking)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <i className="bx bx-check me-1"></i> Xác nhận
                    </>
                  )}
                </Button>
              )}
              {selectedBooking.TrangThai !== "Đã hủy" &&
                selectedBooking.TrangThai !== "Hoàn thành" &&
                selectedBooking.TrangThai !== "Đang sử dụng" && (
                  <Button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleCancel(selectedBooking)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <i className="bx bx-x me-1"></i> Hủy
                      </>
                  )}
                  </Button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BookingsManager;