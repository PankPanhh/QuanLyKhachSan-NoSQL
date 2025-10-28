// Đây là code đã refactor từ file MainPage.jsx gốc của bạn
// CẬP NHẬT: Dùng Context
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaBed, FaUserFriends, FaArrowRight } from 'react-icons/fa';
import { BookingContext } from '../../context/BookingContext';

function BookingForm({ roomId = null }) { // Nhận roomId (nếu có, từ trang chi tiết)
  const { bookingDetails, updateBookingDetails } = useContext(BookingContext);
  const navigate = useNavigate();

  // Lấy state ban đầu từ context
  const [checkInDate, setCheckInDate] = useState(bookingDetails.checkInDate);
  const [checkOutDate, setCheckOutDate] = useState(bookingDetails.checkOutDate);
  const [rooms, setRooms] = useState(bookingDetails.rooms);
  const [guests, setGuests] = useState(bookingDetails.guests);


  const handleCheckInChange = (date) => {
    setCheckInDate(date);
    if (date >= checkOutDate) {
      const nextDay = new Date(new Date(date).setDate(date.getDate() + 1));
      setCheckOutDate(nextDay);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Cập nhật state chung trong Context
    updateBookingDetails({
        checkInDate,
        checkOutDate,
        rooms,
        guests,
        // Nếu ở trang chi tiết, gán luôn ID phòng vào context
        ...(roomId && { room: roomId }) 
    });
    
    // Nếu ở trang chủ, chuyển đến trang ds phòng
    if (!roomId) {
        navigate('/rooms');
    } else {
        // Nếu ở trang chi tiết, chuyển đến trang booking
        navigate('/booking');
    }
  }

  return (
    <form id="form" className="form-group flex-wrap bg-white p-4 rounded-4" onSubmit={handleSubmit}>
      <h3 className="display-5">
        {roomId ? 'Đặt ngay' : 'Kiểm tra phòng'}
      </h3>

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
              minDate={new Date(new Date(checkInDate).setDate(checkInDate.getDate() + 1))}
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
              {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} {num > 1 ? 'Phòng' : 'Phòng'}</option>
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
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} {num > 1 ? 'Khách' : 'Khách'}</option>
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
        <button type="submit" className="btn btn-arrow btn-primary mt-3">
          <span>
            {roomId ? 'Đến trang thanh toán' : 'Kiểm tra phòng'}
            <FaArrowRight />
          </span>
        </button>
      </div>
    </form>
  );
}

export default BookingForm;
