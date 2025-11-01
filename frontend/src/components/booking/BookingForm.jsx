// Đây là code đã refactor từ file MainPage.jsx gốc của bạn
// CẬP NHẬT: Dùng Context
import React, { useState, useContext } from "react";
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
      const startDate = checkInDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const endDate = checkOutDate.toISOString().split("T")[0];
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
      room: room._id, // hoặc room.MaPhong
    });
    setShowModal(false);
    navigate("/booking");
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
        className={`modal fade ${showModal ? "show" : ""}`}
        style={{ display: showModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Phòng trống từ {checkInDate.toLocaleDateString()} đến{" "}
                {checkOutDate.toLocaleDateString()}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {availableRooms.length === 0 ? (
                <p>Không có phòng trống trong khoảng thời gian này.</p>
              ) : (
                <div className="row">
                  {availableRooms.map((room) => (
                    <div key={room._id} className="col-md-6 mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">{room.TenPhong}</h6>
                          <p className="card-text">Loại: {room.LoaiPhong}</p>
                          <p className="card-text">
                            Giá: {room.GiaPhong?.toLocaleString()} VND/đêm
                          </p>
                          <p className="card-text">
                            Số giường: {room.SoGiuong}
                          </p>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSelectRoom(room)}
                          >
                            Chọn phòng
                          </button>
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
      {showModal && <div className="modal-backdrop fade show"></div>}
    </>
  );
}

export default BookingForm;
