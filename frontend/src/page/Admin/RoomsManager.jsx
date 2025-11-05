import React, { useState, useEffect, useCallback } from "react";
import {
  adminGetAllRooms,
  adminUpdateRoom,
  adminUploadRoomImage,
} from "../../services/roomService";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  API_BASE_URL,
  ASSETS_BASE_URL,
  getRoomImageUrl,
} from "../../config/constants";

// Giá trị mặc định cho một phòng mới
const emptyRoom = {
  MaPhong: "",
  TenPhong: "",
  LoaiPhong: "",
  Tang: 1,
  GiaPhong: 0,
  SoGiuong: 1,
  LoaiGiuong: "",
  DienTich: 0,
  MoTa: "",
  HinhAnh: "",
  TinhTrang: "Trống",
};

function RoomsManager() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Chỉ để edit, không add
  const [selectedRooms, setSelectedRooms] = useState([]); // For bulk operations
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filtering and search states
  const [filters, setFilters] = useState({
    roomType: "",
    status: "",
    floor: "",
    search: "",
  });

  // State để quản lý form (chỉ dùng cho edit)
  const [formData, setFormData] = useState(emptyRoom);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);

  const applyFilters = useCallback(() => {
    // Be defensive: rooms may be undefined during some error states
    const source = Array.isArray(rooms) ? rooms : [];
    let filtered = [...source];

    // Filter by room type
    if (filters.roomType) {
      filtered = filtered.filter((room) =>
        room.LoaiPhong.toLowerCase().includes(filters.roomType.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((room) => room.TinhTrang === filters.status);
    }

    // Filter by floor
    if (filters.floor) {
      filtered = filtered.filter(
        (room) => room.Tang.toString() === filters.floor
      );
    }

    // Search by room code or name
    if (filters.search) {
      filtered = filtered.filter(
        (room) =>
          room.MaPhong.toLowerCase().includes(filters.search.toLowerCase()) ||
          room.TenPhong.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
  }, [rooms, filters]);

  useEffect(() => {
    fetchRooms();
    return () => {};
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminGetAllRooms();
      // Be defensive: ensure we always set an array to avoid render-time errors
      let safeData = [];
      if (Array.isArray(data)) safeData = data;
      else if (data && Array.isArray(data.data)) safeData = data.data;
      else safeData = [];
      setRooms(safeData);
    } catch (error) {
      console.error("Lỗi khi tải phòng:", error);
      setError("Không thể tải danh sách phòng. " + error.message);
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
      roomType: "",
      status: "",
      floor: "",
      search: "",
    });
  };

  // Show success message
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Get unique values for filters
  const getUniqueRoomTypes = () => [
    ...new Set(rooms.map((room) => room.LoaiPhong)),
  ];
  const getUniqueFloors = () =>
    [...new Set(rooms.map((room) => room.Tang))].sort((a, b) => a - b);

  // Status color mapping - ĐÃ CẬP NHẬT CHO SNEAT
  const getStatusColor = (status) => {
    const statusColors = {
      Trống: { bg: "bg-label-success", text: "Sẵn sàng" },
      "Đang sử dụng": { bg: "bg-label-info", text: "Có khách" },
      "Đang dọn dẹp": { bg: "bg-label-warning", text: "Đang dọn" },
      "Bảo trì": { bg: "bg-label-secondary", text: "Bảo trì" },
      Hư: { bg: "bg-label-danger", text: "Hư hỏng" },
      "Đã đặt": { bg: "bg-label-primary", text: "Đã đặt" },
    };
    return statusColors[status] || { bg: "bg-label-secondary", text: status };
  };

  // Cập nhật state của form khi người dùng nhập
  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      try {
        const url = URL.createObjectURL(file);
        setSelectedImagePreview(url);
      } catch {
        setSelectedImagePreview(null);
      }
    } else {
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
    }
  };

  // Bulk selection handlers
  const handleSelectRoom = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRooms.length === filteredRooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(filteredRooms.map((room) => room._id));
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedRooms.length === 0) return;

    const confirmMessage = `Bạn có chắc chắn muốn cập nhật trạng thái ${selectedRooms.length} phòng thành "${newStatus}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        setError(null);

        // Update all selected rooms
        await Promise.all(
          selectedRooms.map((roomId) =>
            adminUpdateRoom(roomId, { TinhTrang: newStatus })
          )
        );

        setSelectedRooms([]);
        await fetchRooms();
        showSuccessMessage(
          `Đã cập nhật trạng thái ${selectedRooms.length} phòng thành công!`
        );
      } catch (error) {
        console.error("Lỗi khi cập nhật hàng loạt:", error);
        setError("Cập nhật hàng loạt thất bại: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Chỉ còn function để mở modal edit
  const handleOpenEditModal = (room) => {
    setSelectedRoom(room);
    setFormData(room); // Nạp dữ liệu của phòng vào form
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setError(null);
    setIsModalOpen(true);
  };

  // View room details
  const handleViewDetails = (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // revoke preview URL if any
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
      setSelectedImagePreview(null);
    }
    setSelectedImageFile(null);
    setSelectedRoom(null);
    setError(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRoom(null);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();

    // Chỉ cho phép cập nhật phòng
    if (!selectedRoom) {
      setError("Không thể lưu - không có phòng được chọn");
      return;
    }

    const payload = {
      ...formData,
      // Đảm bảo các trường số được gửi đi là số
      Tang: Number(formData.Tang) || 1,
      GiaPhong: Number(formData.GiaPhong) || 0,
      SoGiuong: Number(formData.SoGiuong) || 1,
      DienTich: Number(formData.DienTich) || 0,
    };

    try {
      setLoading(true);
      setError(null);

      // If user selected a new image file, upload it first (backend will overwrite file keeping existing filename if present)
      let returnedImageName = null;
      if (selectedImageFile) {
        const uploadResp = await adminUploadRoomImage(
          selectedRoom._id,
          selectedImageFile
        );
        returnedImageName =
          uploadResp && uploadResp.data && uploadResp.data.HinhAnh
            ? uploadResp.data.HinhAnh
            : null;
        // update local formData immediately so preview and UI reflect the new filename
        if (returnedImageName) {
          setFormData((prev) => ({
            ...prev,
            HinhAnh: returnedImageName,
            _imgVersion: Date.now(),
          }));
        }
        // For immediate table preview, create a local object URL and attach to updatedRoom->_localPreview
        // We'll use this local preview for the thumbnail until the server-served image is requested.
        // Do NOT revoke this URL yet; we'll revoke when modal closes or on next update.
      }

      // Include HinhAnh in payload if available
      if (returnedImageName) payload.HinhAnh = returnedImageName;

      // Update on server and use result to update local state without refetching entire list
      const updatedRoom = await adminUpdateRoom(selectedRoom._id, payload);

      // Add transient image version to force browser reload of updated image
      updatedRoom._imgVersion = Date.now();
      // If we have a selectedImageFile, add a local preview URL so the thumbnail updates immediately
      if (selectedImageFile) {
        try {
          const localUrl = URL.createObjectURL(selectedImageFile);
          updatedRoom._localPreview = localUrl;
        } catch (e) {
          console.warn("Không thể tạo preview cục bộ:", e);
        }
      }

      // Update local rooms and filteredRooms in-place for immediate UI feedback
      setRooms((prev) =>
        prev.map((r) => (r._id === updatedRoom._id ? updatedRoom : r))
      );
      setFilteredRooms((prev) =>
        prev.map((r) => (r._id === updatedRoom._id ? updatedRoom : r))
      );

      handleCloseModal();
      showSuccessMessage(
        `Phòng ${selectedRoom.MaPhong} đã được cập nhật thành công!`
      );
    } catch (error) {
      console.error("Lỗi khi lưu phòng:", error);
      setError("Lưu phòng thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick status update function
  const handleQuickStatusUpdate = async (roomId, newStatus, roomCode) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      await adminUpdateRoom(roomId, { TinhTrang: newStatus });
      await fetchRooms();
      showSuccessMessage(
        `Phòng ${roomCode} đã được cập nhật thành "${newStatus}"!`
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      setError("Cập nhật trạng thái thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Bắt đầu phần JSX đã được refactor
  return (
    <div className="container-fluid px-0">
      {" "}
      {/* Loại bỏ các style dark-mode */}
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
      {/* Filters and Search - Đặt trong Card của Sneat */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Bộ lọc và Tìm kiếm</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6">
              <label className="form-label">
                <i className="bx bx-search me-1"></i>Tìm kiếm
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo mã phòng hoặc tên phòng..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label">
                <i className="bx bx-bed me-1"></i>Loại phòng
              </label>
              <select
                className="form-select"
                value={filters.roomType}
                onChange={(e) => handleFilterChange("roomType", e.target.value)}
              >
                <option value="">Tất cả loại</option>
                {getUniqueRoomTypes().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label">
                <i className="bx bx-toggle-right me-1"></i>Trạng thái
              </label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Trống">Sẵn sàng</option>
                <option value="Đang dọn dẹp">Đang dọn</option>
                <option value="Đang chờ xác nhận">Đang chờ xác nhận</option>
                <option value="Đang sử dụng">Có khách</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Hư">Hư hỏng</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label">
                <i className="bx bx-building me-1"></i>Tầng
              </label>
              <select
                className="form-select"
                value={filters.floor}
                onChange={(e) => handleFilterChange("floor", e.target.value)}
              >
                <option value="">Tất cả tầng</option>
                {getUniqueFloors().map((floor) => (
                  <option key={floor} value={floor}>
                    Tầng {floor}
                  </option>
                ))}
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
      {/* Bulk Actions */}
      {selectedRooms.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-dark fw-bold">
                  Đã chọn {selectedRooms.length} phòng
                </span>
              </div>
              <div className="d-flex gap-2">
                <div className="dropdown">
                  <button
                    className="btn btn-primary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bx bx-edit me-1"></i>Cập nhật trạng thái
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={() => handleBulkStatusUpdate("Trống")}
                      >
                        Sẵn sàng
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={() => handleBulkStatusUpdate("Đang dọn dẹp")}
                      >
                        Đang dọn
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={() => handleBulkStatusUpdate("Bảo trì")}
                      >
                        Bảo trì
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={() => handleBulkStatusUpdate("Hư")}
                      >
                        Hư hỏng
                      </a>
                    </li>
                  </ul>
                </div>
                <Button
                  className="btn btn-outline-secondary"
                  onClick={() => setSelectedRooms([])}
                >
                  <i className="bx bx-x me-1"></i>Hủy chọn
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Statistics Cards - Sử dụng cấu trúc từ DashboardPage/index.html */}
      {!loading && rooms.length > 0 && (
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="bx bx-door-open"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Sẵn sàng</span>
                <h3 className="card-title mb-2">
                  {filteredRooms.filter((r) => r.TinhTrang === "Trống").length}
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
                <span className="fw-semibold d-block mb-1">Có khách</span>
                <h3 className="card-title mb-2">
                  {
                    filteredRooms.filter((r) => r.TinhTrang === "Đang sử dụng")
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
                    <span className="avatar-initial rounded bg-label-warning">
                      <i className="bx bx-wrench"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Bảo trì/Dọn</span>
                <h3 className="card-title mb-2">
                  {
                    filteredRooms.filter((r) =>
                      ["Bảo trì", "Hư", "Đang dọn dẹp"].includes(r.TinhTrang)
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
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-calendar-check"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Đã đặt</span>
                <h3 className="card-title mb-2">
                  {filteredRooms.filter((r) => r.TinhTrang === "Đã đặt").length}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main Table Card */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Danh sách phòng</h5>
          {filteredRooms.length > 0 && (
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="selectAll"
                checked={selectedRooms.length === filteredRooms.length}
                onChange={handleSelectAll}
              />
              <label className="form-check-label" htmlFor="selectAll">
                Chọn tất cả
              </label>
            </div>
          )}
        </div>

        {loading && !isModalOpen ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "400px" }}
          >
            <div className="text-center">
              <Spinner />
              <p className="mt-2">Đang tải danh sách phòng...</p>
              {error && (
                <div className="mt-3">
                  <div className="text-danger mb-2">{error}</div>
                  <Button
                    className="btn btn-sm btn-outline-primary"
                    onClick={fetchRooms}
                  >
                    Thử lại
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <i className="bx bx-check-square"></i>
                  </th>
                  <th>Mã phòng</th>
                  <th>Tên phòng</th>
                  <th>Loại phòng</th>
                  <th>Giá</th>
                  <th>Tầng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <h5 className="text-muted">
                        {rooms.length === 0
                          ? "Chưa có phòng nào"
                          : "Không tìm thấy phòng phù hợp"}
                      </h5>
                      <p className="text-muted">
                        {rooms.length === 0
                          ? "Vui lòng thêm phòng mới."
                          : "Thử điều chỉnh bộ lọc."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => {
                    const statusInfo = getStatusColor(room.TinhTrang);
                    return (
                      <tr
                        key={room._id}
                        className={
                          selectedRooms.includes(room._id) ? "table-active" : ""
                        }
                      >
                        <td>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRooms.includes(room._id)}
                            onChange={() => handleSelectRoom(room._id)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={
                                room._localPreview
                                  ? room._localPreview
                                  : getRoomImageUrl(room.HinhAnh) +
                                    (room._imgVersion
                                      ? `?v=${room._imgVersion}`
                                      : "")
                              }
                              alt={room.TenPhong}
                              className="rounded me-2"
                              style={{
                                width: "30px",
                                height: "30px",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.src =
                                  "/assets/img/avatars/default.png";
                              }}
                            />
                            <span className="fw-semibold">{room.MaPhong}</span>
                          </div>
                        </td>
                        <td>{room.TenPhong}</td>
                        <td>
                          <span className="badge bg-label-primary me-1">
                            {room.LoaiPhong}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold text-dark">
                            {formatCurrency(room.GiaPhong)}
                          </span>
                        </td>
                        <td>Tầng {room.Tang}</td>
                        <td>
                          <div className="dropdown">
                            <span
                              className={`badge ${statusInfo.bg} dropdown-toggle`}
                              data-bs-toggle="dropdown"
                              style={{ cursor: "pointer" }}
                              title="Click để thay đổi"
                            >
                              {statusInfo.text}
                            </span>
                            <ul className="dropdown-menu">
                              <li>
                                <a
                                  className="dropdown-item"
                                  href="#"
                                  onClick={() =>
                                    handleQuickStatusUpdate(
                                      room._id,
                                      "Trống",
                                      room.MaPhong
                                    )
                                  }
                                >
                                  Sẵn sàng
                                </a>
                              </li>
                              <li>
                                <a
                                  className="dropdown-item"
                                  href="#"
                                  onClick={() =>
                                    handleQuickStatusUpdate(
                                      room._id,
                                      "Đang dọn dẹp",
                                      room.MaPhong
                                    )
                                  }
                                >
                                  Đang dọn
                                </a>
                              </li>
                              <li>
                                <a
                                  className="dropdown-item"
                                  href="#"
                                  onClick={() =>
                                    handleQuickStatusUpdate(
                                      room._id,
                                      "Đang sử dụng",
                                      room.MaPhong
                                    )
                                  }
                                >
                                  Có khách
                                </a>
                              </li>
                              <li>
                                <a
                                  className="dropdown-item"
                                  href="#"
                                  onClick={() =>
                                    handleQuickStatusUpdate(
                                      room._id,
                                      "Bảo trì",
                                      room.MaPhong
                                    )
                                  }
                                >
                                  Bảo trì
                                </a>
                              </li>
                              <li>
                                <a
                                  className="dropdown-item"
                                  href="#"
                                  onClick={() =>
                                    handleQuickStatusUpdate(
                                      room._id,
                                      "Hư",
                                      room.MaPhong
                                    )
                                  }
                                >
                                  Hư hỏng
                                </a>
                              </li>
                            </ul>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              className="btn btn-icon btn-sm btn-outline-success"
                              onClick={() => handleViewDetails(room)}
                              disabled={loading}
                              title="Xem chi tiết"
                            >
                              <i className="bx bx-show"></i>
                            </Button>
                            <Button
                              className="btn btn-icon btn-sm btn-outline-primary"
                              onClick={() => handleOpenEditModal(room)}
                              disabled={loading}
                              title="Chỉnh sửa"
                            >
                              <i className="bx bx-edit-alt"></i>
                            </Button>
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
      {/* Modal Chỉnh sửa phòng - Cập nhật giao diện Modal của Bootstrap/Sneat */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Chỉnh sửa phòng: ${selectedRoom?.TenPhong || ""}`}
        isStaticBackdrop={true} // Ngăn đóng khi click bên ngoài
        dialogClassName="modal-lg" // Làm modal rộng hơn
      >
        <form onSubmit={handleSaveRoom}>
          <div className="row g-3">
            {/* CỘT TRÁI */}
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Xem trước ảnh</label>
                <img
                  src={
                    (formData.HinhAnh
                      ? getRoomImageUrl(formData.HinhAnh)
                      : getRoomImageUrl("default.jpg")) +
                    (formData._imgVersion ? `?v=${formData._imgVersion}` : "")
                  }
                  alt="Xem trước"
                  className="img-fluid rounded w-100"
                  style={{ height: "250px", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = "/assets/img/avatars/default.png";
                  }}
                />
              </div>
              <InputField
                label="Tên tệp ảnh (ví dụ: deluxe_p203.jpg)"
                name="HinhAnh"
                value={formData.HinhAnh}
                onChange={handleFormChange}
              />
              <div className="mb-3">
                <label className="form-label">
                  Upload ảnh mới (ghi đè file hiện có)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={handleImageFileChange}
                />
                {selectedImagePreview && (
                  <div className="mt-2">
                    <img
                      src={selectedImagePreview}
                      alt="preview"
                      className="img-fluid rounded"
                      style={{ height: "120px", objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <InputField
                  label="Mô tả"
                  name="MoTa"
                  type="textarea"
                  rows={5}
                  value={formData.MoTa}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="col-md-6">
              <div className="mb-3">
                <InputField
                  label="Tên phòng"
                  name="TenPhong"
                  value={formData.TenPhong}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <InputField
                    label="Mã phòng"
                    name="MaPhong"
                    value={formData.MaPhong}
                    onChange={handleFormChange}
                    required
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="Loại phòng"
                    name="LoaiPhong"
                    value={formData.LoaiPhong}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="Tầng"
                    name="Tang"
                    type="number"
                    value={formData.Tang}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="Giá (VND)"
                    type="number"
                    name="GiaPhong"
                    value={formData.GiaPhong}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="Số giường"
                    type="number"
                    name="SoGiuong"
                    value={formData.SoGiuong}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="Loại giường"
                    name="LoaiGiuong"
                    value={formData.LoaiGiuong}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-12">
                  <InputField
                    label="Diện tích (m²)"
                    type="number"
                    name="DienTich"
                    value={formData.DienTich}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">Trạng thái phòng</label>
                <select
                  className="form-select"
                  name="TinhTrang"
                  value={formData.TinhTrang}
                  onChange={handleFormChange}
                >
                  <option value="Trống">Trống (Sẵn sàng)</option>
                  <option value="Đang dọn dẹp">Đang dọn dẹp</option>
                  <option value="Đang sử dụng">Đang sử dụng</option>
                  <option value="Đã đặt">Đã đặt</option>
                  <option value="Bảo trì">Bảo trì</option>
                  <option value="Hư">Hư hỏng</option>
                </select>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger mt-4">{error}</div>}

          <div className="text-end mt-4 pt-3 border-top">
            <Button
              type="button"
              className="btn btn-outline-secondary me-2"
              onClick={handleCloseModal}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : "Cập nhật thông tin"}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Modal Chi Tiết Phòng */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title={`Chi tiết phòng: ${selectedRoom?.TenPhong || ""}`}
        dialogClassName="modal-lg"
      >
        {selectedRoom && (
          <div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <img
                  src={
                    getRoomImageUrl(selectedRoom.HinhAnh) +
                    (selectedRoom._imgVersion
                      ? `?v=${selectedRoom._imgVersion}`
                      : "")
                  }
                  alt={selectedRoom.TenPhong}
                  className="img-fluid rounded w-100"
                  style={{ height: "300px", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = "/assets/img/avatars/default.png";
                  }}
                />
              </div>

              <div className="col-md-6">
                <span
                  className={`badge ${
                    getStatusColor(selectedRoom.TinhTrang).bg
                  } mb-2`}
                >
                  {getStatusColor(selectedRoom.TinhTrang).text}
                </span>
                <h4 className="fw-bold">{selectedRoom.TenPhong}</h4>
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Mã phòng</span>
                    <span className="fw-semibold">{selectedRoom.MaPhong}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Loại phòng</span>
                    <span className="fw-semibold">
                      {selectedRoom.LoaiPhong}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Giá phòng</span>
                    <span className="fw-semibold text-success">
                      {formatCurrency(selectedRoom.GiaPhong)}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Tầng</span>
                    <span>Tầng {selectedRoom.Tang}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Giường</span>
                    <span>
                      {selectedRoom.SoGiuong} (
                      {selectedRoom.LoaiGiuong || "N/A"})
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Diện tích</span>
                    <span>{selectedRoom.DienTich || "N/A"}m²</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedRoom.MoTa && (
              <div className="mt-3">
                <h5 className="text-dark">Mô tả</h5>
                <p className="text-muted">{selectedRoom.MoTa}</p>
              </div>
            )}

            <div className="text-end mt-4 pt-3 border-top">
              <Button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={handleCloseDetailModal}
              >
                Đóng
              </Button>
              <Button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleCloseDetailModal();
                  handleOpenEditModal(selectedRoom);
                }}
              >
                <i className="bx bx-edit me-1"></i>
                Chỉnh sửa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RoomsManager;
