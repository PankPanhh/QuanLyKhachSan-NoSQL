import React, { useContext, useEffect, useState } from "react";
import { BookingContext } from "../../context/BookingContext";
import { getRoomById } from "../../services/roomService";
import Spinner from "../../components/common/Spinner";
import './BookingSummary.css';

function BookingSummary() {
  const { bookingDetails, updateBookingDetails } = useContext(BookingContext);
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [showServices, setShowServices] = useState(true);

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
          // extract available services
          const svcs = Array.isArray(mapped.full?.DichVu) ? mapped.full.DichVu.filter(s => s.TrangThai === 'Đang hoạt động') : [];
          setAvailableServices(svcs);
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
              const svcs = Array.isArray(data?.DichVu) ? data.DichVu.filter((s) => s.TrangThai === 'Đang hoạt động') : [];
              setAvailableServices(svcs);
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
          // also set available services when fetching by id
          const svcs = Array.isArray(data?.DichVu) ? data.DichVu.filter((s) => s.TrangThai === 'Đang hoạt động') : [];
          setAvailableServices(svcs);
          // clear previous selected services when room changes
          updateBookingDetails({ DichVuDaChon: [] });
        })
        .catch((err) => {
          console.error(err);
          setError("Không thể tải chi tiết phòng.");
          setAvailableServices([]);
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
  // Apply promo if present
  const promo = bookingDetails.promo;
  let discount = 0;
  let totalAfterDiscount = total;
  if (promo) {
    // Always apply if promo is selected, regardless of current date
    if (promo.discountPercent) {
      discount = Math.round((total * Number(promo.discountPercent || 0)) / 100);
    } else if (promo.discountAmount) {
      discount = Number(promo.discountAmount) || 0;
      // don't exceed total
      if (discount > total) discount = total;
    }
    totalAfterDiscount = total - discount;
  }

  // Include selected services from bookingDetails (if any)
  const selectedServices = Array.isArray(bookingDetails.DichVuDaChon)
    ? bookingDetails.DichVuDaChon
    : [];

  const tongTienDichVu = selectedServices.reduce((sum, dv) => {
    const price = Number(dv.GiaDichVu || dv.Gia || 0);
    const qty = Number(dv.SoLuong || 0);
    return sum + price * qty;
  }, 0);

  totalAfterDiscount = total + tongTienDichVu - discount;

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

      {/* Dịch vụ bổ sung (collapsible vertical list) */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Dịch vụ bổ sung</h5>
          <div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary toggle-btn me-2"
              onClick={() => setShowServices((v) => !v)}
            >
              {showServices ? 'Ẩn dịch vụ' : 'Hiện dịch vụ'}
            </button>
            <small className="text-muted">{availableServices.length} dịch vụ có sẵn</small>
          </div>
        </div>

        {availableServices.length === 0 && (
          <div className="text-muted">Không có dịch vụ bổ sung cho phòng này.</div>
        )}

        {showServices && availableServices.length > 0 && (
          <div className={`services-container ${showServices ? 'expanded' : 'collapsed'}`}>
            {availableServices.map((s) => {
              const selected = selectedServices.find((x) => x.MaDichVu === s.MaDichVu) || null;
              const qty = selected ? Number(selected.SoLuong || 0) : 0;
              const price = Number(s.GiaDichVu || 0);
              const lineTotal = price * qty;
              const imgSrc = s.HinhAnhDichVu ? `http://localhost:5000/assets/images/services/${s.HinhAnhDichVu}` : '/images/default-thumb.jpg';

              return (
                <div key={s.MaDichVu} className={`service-card ${selected ? 'selected' : ''}`} style={{ position: 'relative' }}>
                  {selected && (
                    <div className="selected-indicator">✓</div>
                  )}
                  
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="service-info-container">
                        <img src={imgSrc} alt={s.TenDichVu} className="service-image" />
                        <div className="service-details">
                          <div className="service-title">{s.TenDichVu}</div>
                          <div className="price-container">
                            <span className="service-price">{price.toLocaleString()}đ</span>
                            <span className="service-unit">/{s.DonViTinh || 'lần'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="controls-container">
                        {/* quantity control +/- */}
                        <div className="qty-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            disabled={qty <= 0}
                            onClick={() => {
                              const current = Array.isArray(selectedServices) ? [...selectedServices] : [];
                              const idx = current.findIndex((x) => x.MaDichVu === s.MaDichVu);
                              const curQty = idx === -1 ? 0 : Number(current[idx].SoLuong || 0);
                              const newQty = Math.max(0, curQty - 1);
                              if (newQty <= 0) {
                                if (idx !== -1) current.splice(idx, 1);
                              } else {
                                const item = { MaDichVu: s.MaDichVu, TenDichVu: s.TenDichVu, GiaDichVu: price, SoLuong: newQty };
                                if (idx === -1) current.push(item);
                                else current[idx] = item;
                              }
                              updateBookingDetails({ DichVuDaChon: current });
                            }}
                          >
                            −
                          </button>
                          <div className="qty-display">{qty}</div>
                          <button
                            type="button"
                            className="qty-btn"
                            disabled={qty >= 10}
                            onClick={() => {
                              const current = Array.isArray(selectedServices) ? [...selectedServices] : [];
                              const idx = current.findIndex((x) => x.MaDichVu === s.MaDichVu);
                              const curQty = idx === -1 ? 0 : Number(current[idx].SoLuong || 0);
                              const newQty = Math.min(10, curQty + 1);
                              const item = { MaDichVu: s.MaDichVu, TenDichVu: s.TenDichVu, GiaDichVu: price, SoLuong: newQty };
                              if (idx === -1) current.push(item);
                              else current[idx] = item;
                              updateBookingDetails({ DichVuDaChon: current });
                            }}
                          >
                            +
                          </button>
                        </div>

                        {lineTotal > 0 && (
                          <div className="temp-total">
                            {lineTotal.toLocaleString()}đ
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <hr />
      <div className="d-flex justify-content-between mb-2">
        <span>Tổng tiền phòng:</span>
        <strong>{total.toLocaleString()}đ</strong>
      </div>
      {promo && promo.title && (
        <div className="mb-2 p-2 rounded" style={{ backgroundColor: '#fff6f0' }}>
          <div className="d-flex justify-content-between">
            <small>Khuyến mãi:</small>
            <strong>{promo.title}</strong>
          </div>
          <div className="d-flex justify-content-between">
            <small>Giảm:</small>
            <strong className="text-danger">
              {promo.discountPercent ? `${promo.discountPercent}%` : promo.discountAmount ? `${Number(promo.discountAmount).toLocaleString()}đ` : ""}
            </strong>
          </div>
        </div>
      )}

      <div className="invoice-summary p-3 mt-3 rounded">
        <div className="d-flex justify-content-between mb-2">
          <small>Tổng tiền phòng</small>
          <strong>{total.toLocaleString()}đ</strong>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <small>Tổng tiền dịch vụ</small>
          <strong>{tongTienDichVu.toLocaleString()}đ</strong>
        </div>
        {discount > 0 && (
          <div className="d-flex justify-content-between text-danger mb-2">
            <small>Giảm</small>
            <strong>-{discount.toLocaleString()}đ</strong>
          </div>
        )}
        <hr />
        <div className="d-flex justify-content-between fs-5 fw-bold align-items-center">
          <span>Tổng cộng</span>
          <span className="text-primary">{totalAfterDiscount.toLocaleString()}đ</span>
        </div>
      </div>
      {discount > 0 && (
        <div className="mt-2 text-muted small">(Giảm {discount.toLocaleString()}đ từ khuyến mãi)</div>
      )}
    </div>
  );
}

export default BookingSummary;
