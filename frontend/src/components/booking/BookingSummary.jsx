import React, { useContext, useEffect, useState } from "react";
import { BookingContext } from "../../context/BookingContext";
import { getRoomById } from "../../services/roomService";
import Spinner from "../../components/common/Spinner";

function BookingSummary() {
  const { bookingDetails } = useContext(BookingContext);
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);

  // Đọc đúng tên biến từ context
  const { room, checkInDate, checkOutDate, guests, rooms } = bookingDetails;

  useEffect(() => {
    if (room) {
      // If room is an object with full data (from modal), use it directly
      if (typeof room === "object") {
        // If it's likely a full room object from backend
        if (room.GiaPhong || room.TenPhong || room.price) {
          const mapped = {
            // prefer english keys used in summary, fall back to vietnamese
            name: room.name || room.TenPhong || room.title,
            price: room.price || room.GiaPhong,
            image:
              room.imageUrl ||
              (room.HinhAnh
                ? `http://localhost:5000/assets/images/room/${room.HinhAnh}`
                : room.image),
            full: room,
          };
          setRoomData(mapped);
          return;
        }

        // If object only contains id, attempt to extract id and fetch
        const id = room._id || room.id || room.roomId;
        if (id) {
          getRoomById(id)
            .then((data) => {
              setRoomData({
                name: data.name || data.TenPhong || data.title,
                price: data.price || data.GiaPhong,
                image:
                  data.imageUrl ||
                  (data.HinhAnh
                    ? `http://localhost:5000/assets/images/room/${data.HinhAnh}`
                    : data.image),
                full: data,
              });
            })
            .catch((err) => {
              console.error(err);
              setError("Không thể tải chi tiết phòng.");
            });
          return;
        }
      }

      // If room is an ID string, fetch data
      getRoomById(room)
        .then((data) => {
          setRoomData({
            name: data.name || data.TenPhong || data.title,
            price: data.price || data.GiaPhong,
            image:
              data.imageUrl ||
              (data.HinhAnh
                ? `http://localhost:5000/assets/images/room/${data.HinhAnh}`
                : data.image),
            full: data,
          });
        })
        .catch((err) => {
          console.error(err);
          setError("Không thể tải chi tiết phòng.");
        });
    }
  }, [room]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!roomData || !checkInDate || !checkOutDate) {
    return <Spinner />;
  }

  // Tính số đêm
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (nights <= 0) {
    return (
      <div className="alert alert-warning">
        Ngày check-out phải sau ngày check-in.
      </div>
    );
  }

  const total = roomData.price * nights * rooms;

  return (
    <div className="p-4 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
      <h4 className="mb-3">{roomData.name || roomData.title}</h4>
      <img
        src={roomData.imageUrl || roomData.image}
        alt={roomData.name || roomData.title}
        className="img-fluid rounded mb-3"
      />

      <div className="d-flex justify-content-between mb-2">
        <span>Check-in:</span>
        <strong>{checkInDate.toLocaleDateString("vi-VN")}</strong>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Check-out:</span>
        <strong>{checkOutDate.toLocaleDateString("vi-VN")}</strong>
      </div>
      <hr />
      <div className="d-flex justify-content-between mb-2">
        <span>Số đêm:</span>
        <strong>{nights}</strong>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Số phòng:</span>
        <strong>{rooms}</strong>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Số khách:</span>
        <strong>{guests}</strong>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Giá 1 đêm:</span>
        <strong>{roomData.price?.toLocaleString()}đ</strong>
      </div>
      <hr />
      <div className="d-flex justify-content-between fs-4 fw-bold">
        <span>Tổng cộng:</span>
        <span className="text-primary">{total.toLocaleString()}đ</span>
      </div>
    </div>
  );
}

export default BookingSummary;
