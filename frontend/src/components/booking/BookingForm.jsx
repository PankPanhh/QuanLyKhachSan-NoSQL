// Đây là code đã refactor từ file MainPage.jsx gốc của bạn
// CẬP NHẬT: Dùng Context
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaCalendarAlt,
  FaBed,
  FaUserFriends,
  FaArrowRight,
} from "react-icons/fa";
import { BookingContext } from "../../context/BookingContext";
import { getAvailableRooms } from "../../services/roomService";

function BookingForm({ roomId = null }) {
  // Nhận roomId (nếu có, từ trang chi tiết)
  const { bookingDetails, updateBookingDetails } = useContext(BookingContext);
  const navigate = useNavigate();

  // Lấy state ban đầu từ context
  const [checkInDate, setCheckInDate] = useState(bookingDetails.checkInDate);
  const [checkOutDate, setCheckOutDate] = useState(bookingDetails.checkOutDate);
  const [rooms, setRooms] = useState(bookingDetails.rooms);
  const [guests, setGuests] = useState(bookingDetails.guests);

  // State cho modal phòng trống
  const [showModal, setShowModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Close modal on Escape and reset small states when opened/closed
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowModal(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal]);

  // Lock body scroll while modal is open (we render modal manually, so Bootstrap's
  // automatic body class isn't applied). This prevents the page from keeping its
  // own scrollbar and leaving multiple scrollbars visible.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    if (showModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    }
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [showModal]);

  const roomTypes = useMemo(() => {
    return [
      "all",
      ...Array.from(new Set(availableRooms.map((r) => r.LoaiPhong || "Khác"))),
    ];
  }, [availableRooms]);

  const handleCheckInChange = (date) => {
    setCheckInDate(date);
    if (date >= checkOutDate) {
      const nextDay = new Date(new Date(date).setDate(date.getDate() + 1));
      setCheckOutDate(nextDay);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Nếu ở trang chi tiết phòng, chuyển trực tiếp đến booking
    if (roomId) {
      updateBookingDetails({
        checkInDate,
        checkOutDate,
        rooms,
        guests,
        room: roomId,
      });
      navigate("/booking");
      return;
    }

    // Nếu ở trang chủ, gọi API lấy phòng trống và hiển thị modal
    setLoading(true);
    try {
      const formatLocalYMD = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
      const startDate = formatLocalYMD(checkInDate);
      const endDate = formatLocalYMD(checkOutDate);
      const roomsData = await getAvailableRooms(startDate, endDate);
      setAvailableRooms(roomsData);
      setShowModal(true);
    } catch (error) {
      alert("Lỗi khi kiểm tra phòng trống: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (room) => {
    // Cập nhật context với phòng đã chọn
    updateBookingDetails({
      checkInDate,
      checkOutDate,
      rooms,
      guests,
      // store both object and id to make downstream components flexible
      room: room,
      roomId: room._id || room.id,
    });
    setShowModal(false);
    navigate("/booking");
  };

  const handleViewDetails = (room) => {
    setShowModal(false);
    navigate(`/room/${room._id}`); // Route chi tiết phòng là /room/:id
  };

  return (
    <>
      <form
        id="form"
        className="form-group flex-wrap bg-white p-4 rounded-4"
        onSubmit={handleSubmit}
      >
        <h3 className="display-5">{roomId ? "Đặt ngay" : "Kiểm tra phòng"}</h3>

        {/* HÀNG 1: CHECK-IN VÀ CHECK-OUT */}
        <div className="row g-3 my-4">
          <div className="col-md-6">
            <label className="form-label text-uppercase">Check-In</label>
            <div className="date position-relative bg-transparent">
              <DatePicker
                selected={checkInDate}
                onChange={handleCheckInChange}
                selectsStart
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={new Date()}
                className="form-control"
                dateFormat="dd/MM/yyyy"
              />
              <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                <FaCalendarAlt className="text-body" />
              </span>
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-uppercase">Check-Out</label>
            <div className="date position-relative bg-transparent">
              <DatePicker
                selected={checkOutDate}
                onChange={(date) => setCheckOutDate(date)}
                selectsEnd
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={
                  new Date(
                    new Date(checkInDate).setDate(checkInDate.getDate() + 1)
                  )
                }
                className="form-control"
                dateFormat="dd/MM/yyyy"
              />
              <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                <FaCalendarAlt className="text-body" />
              </span>
            </div>
          </div>
        </div>

        {/* HÀNG 2: ROOMS VÀ GUESTS */}
        <div className="row g-3 my-4">
          <div className="col-md-6">
            <label className="form-label text-uppercase">Số phòng</label>
            <div className="position-relative">
              <select
                className="form-select text-black-50 ps-3"
                value={rooms}
                onChange={(e) => setRooms(parseInt(e.target.value))}
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num > 1 ? "Phòng" : "Phòng"}
                  </option>
                ))}
              </select>
              <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                <FaBed className="text-body" />
              </span>
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-uppercase">Số khách</label>
            <div className="position-relative">
              <select
                className="form-select text-black-50 ps-3"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num > 1 ? "Khách" : "Khách"}
                  </option>
                ))}
              </select>
              <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                <FaUserFriends className="text-body" />
              </span>
            </div>
          </div>
        </div>

        {/* HÀNG 3: NÚT SUBMIT */}
        <div className="d-grid">
          <button
            type="submit"
            className="btn btn-arrow btn-primary mt-3"
            disabled={loading}
          >
            <span>
              {loading
                ? "Đang kiểm tra..."
                : roomId
                ? "Đến trang thanh toán"
                : "Kiểm tra phòng"}
              <FaArrowRight />
            </span>
          </button>
        </div>
      </form>

      {/* MODAL HIỂN THỊ PHÒNG TRỐNG */}
      <div
        className={`modal fade ${showModal ? "show" : ""} available-modal`}
        style={{ display: showModal ? "block" : "none", zIndex: 2000 }}
        tabIndex="-1"
        role="dialog"
        aria-modal={showModal}
        aria-labelledby="availableRoomsTitle"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title" id="availableRoomsTitle">
                  Phòng trống
                </h5>
                <small className="text-muted">
                  Từ {checkInDate.toLocaleDateString()} đến{" "}
                  {checkOutDate.toLocaleDateString()}
                </small>
              </div>
              <div className="ms-3 text-end">
                <div className="mb-1">{availableRooms.length} kết quả</div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Đóng"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
            </div>

            <div className="modal-body">
              {/* Filter / Search bar */}
              <div className="d-flex gap-2 align-items-center mb-3">
                <input
                  className="form-control"
                  placeholder="Tìm theo tên phòng..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Tất cả loại phòng</option>
                  {roomTypes
                    .filter((t) => t !== "all")
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </select>
              </div>

              {availableRooms.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  Không có phòng trống trong khoảng thời gian này.
                </div>
              ) : (
                <div className="row">
                  {availableRooms
                    .filter(
                      (room) =>
                        (typeFilter === "all" ||
                          room.LoaiPhong === typeFilter) &&
                        room.TenPhong.toLowerCase().includes(
                          filterText.toLowerCase()
                        )
                    )
                    .map((room) => (
                      <div key={room._id} className="col-md-4 mb-3">
                        <div className="card room-card shadow-sm">
                          <div className="card-img-wrap">
                            {room.HinhAnh ? (
                              <img
                                src={`http://localhost:5000/assets/images/room/${room.HinhAnh}`}
                                className="card-img-top"
                                alt={room.TenPhong}
                                style={{ height: "220px", objectFit: "cover" }}
                              />
                            ) : (
                              <div className="card-img-placeholder" />
                            )}
                            <span className="room-badge">Sẵn sàng</span>
                            <span className="price-tag">
                              {room.GiaPhong?.toLocaleString()}₫{" "}
                              <small className="per-night">/đêm</small>
                            </span>
                          </div>
                          <div className="card-body">
                            <h6 className="card-title mb-1">{room.TenPhong}</h6>
                            <div className="text-muted small mb-2">
                              {room.LoaiPhong} • {room.SoGiuong} giường
                            </div>
                            <p
                              className="card-text text-truncate"
                              style={{ maxHeight: "3.2rem" }}
                            >
                              {room.MoTa || "Không có mô tả"}
                            </p>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                              <div className="btn-group">
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleSelectRoom(room)}
                                >
                                  Chọn
                                </button>
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleViewDetails(room)}
                                >
                                  Chi tiết
                                </button>
                              </div>
                              {/* moved '/đêm' into price tag overlay for clearer position */}
                              <div className="text-end small text-muted d-none">
                                /đêm
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div
          className="modal-backdrop fade show"
          style={{ zIndex: 1990 }}
        ></div>
      )}
    </>
  );
}

export default BookingForm;
