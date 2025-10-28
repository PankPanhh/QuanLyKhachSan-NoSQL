// src/components/booking/BookingForm.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaBed, FaUserFriends, FaArrowRight } from 'react-icons/fa';

function BookingForm() {
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));

  const handleCheckInChange = (date) => {
    setCheckInDate(date);
    // Tự động cập nhật ngày check-out nếu ngày check-in mới sau ngày check-out
    if (date >= checkOutDate) {
      setCheckOutDate(new Date(new Date(date).setDate(date.getDate() + 1)));
    }
  };

  return (
    <form id="form" className="form-group flex-wrap bg-white p-5 rounded-4 ms-md-5">
      <h3 className="display-5">Check availability</h3>

      {/* HÀNG 1: CHECK-IN VÀ CHECK-OUT */}
      <div className="row g-3 my-4">
        <div className="col-md-6">
          <label className="form-label text-uppercase">Check-In</label>
          <div className="date position-relative bg-transparent" id="select-arrival-date">
            <DatePicker
              selected={checkInDate}
              onChange={handleCheckInChange} // Cập nhật hàm xử lý
              selectsStart
              startDate={checkInDate}
              endDate={checkOutDate}
              minDate={new Date()}
              className="form-control"
              placeholderText="Select Date"
              dateFormat="dd/MM/yyyy"
            />
            <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
              <FaCalendarAlt className="text-body" />
            </span>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label text-uppercase">Check-Out</label>
          <div className="date position-relative bg-transparent" id="select-departure-date">
            <DatePicker
              selected={checkOutDate}
              onChange={(date) => setCheckOutDate(date)}
              selectsEnd
              startDate={checkInDate}
              endDate={checkOutDate}
              minDate={new Date(new Date(checkInDate).setDate(checkInDate.getDate() + 1))} // Luôn sau ngày check-in 1 ngày
              className="form-control"
              placeholderText="Select Date"
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
          <label className="form-label text-uppercase">Rooms</label>
          <div className="position-relative">
            <select className="form-select text-black-50 ps-3" defaultValue="1" name="quantity">
              {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} {num > 1 ? 'Rooms' : 'Room'}</option>
              ))}
            </select>
            <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
              <FaBed className="text-body" />
            </span>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label text-uppercase">Guests</label>
          <div className="position-relative">
            <select className="form-select text-black-50 ps-3" defaultValue="2" name="quantity">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} {num > 1 ? 'Guests' : 'Guest'}</option>
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
          <span>Check availability <FaArrowRight /></span>
        </button>
      </div>
    </form>
  );
}

export default BookingForm;