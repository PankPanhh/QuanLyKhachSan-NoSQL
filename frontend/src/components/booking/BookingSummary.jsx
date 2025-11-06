import React, { useContext, useEffect, useState } from "react";
import { BookingContext } from "../../context/BookingContext";
import { getRoomById, getRoomPrice } from "../../services/roomService";
import Spinner from "../../components/common/Spinner";
import "./BookingSummary.css";

function BookingSummary() {
  const { bookingDetails, updateBookingDetails } = useContext(BookingContext);
  const [roomData, setRoomData] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);
  const [error, setError] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [showServices, setShowServices] = useState(true);

  const { room, checkInDate, checkOutDate, guests, rooms } = bookingDetails;

  // ===============================
  // 📦 Fetch Room Info
  // ===============================
  useEffect(() => {
    if (!room) return;

    const loadRoomData = async () => {
      try {
        // Case 1: Room is full object
        if (
          typeof room === "object" &&
          (room.GiaPhong || room.TenPhong || room.price)
        ) {
          const mapped = {
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
          const svcs = Array.isArray(mapped.full?.DichVu)
            ? mapped.full.DichVu.filter((s) => s.TrangThai === "Đang hoạt động")
            : [];
          setAvailableServices(svcs);
          return;
        }

        // Case 2: Room is ID (string or object with id)
        const id =
          typeof room === "object" ? room._id || room.id || room.roomId : room;
        if (id) {
          const data = await getRoomById(id);
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
          const svcs = Array.isArray(data?.DichVu)
            ? data.DichVu.filter((s) => s.TrangThai === "Đang hoạt động")
            : [];
          setAvailableServices(svcs);
          updateBookingDetails({ DichVuDaChon: [] });
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải chi tiết phòng.");
      }
    };

    loadRoomData();
  }, [room]);

  // ===============================
  // 💰 Fetch Price
  // ===============================
  useEffect(() => {
    let cancelled = false;
    const fetchPrice = async () => {
      if (!roomData || !checkInDate || !checkOutDate) return;
      try {
        const formatLocalYMD = (d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(d.getDate()).padStart(2, "0")}`;
        const start = formatLocalYMD(checkInDate);
        const end = formatLocalYMD(checkOutDate);
        // Prepare extraServices payload: only MaDichVu and SoLuong are needed by server
        const extra = Array.isArray(bookingDetails.DichVuDaChon)
          ? bookingDetails.DichVuDaChon.map((d) => ({
              MaDichVu: d.MaDichVu,
              SoLuong: d.SoLuong || 1,
            }))
          : [];

        const resp = await getRoomPrice(
          roomData.full?._id || bookingDetails.room || room,
          start,
          end,
          bookingDetails.rooms || 1,
          extra
        );
        const data = resp && resp.data ? resp.data : resp;
        if (!cancelled) setPriceInfo(data);
      } catch (e) {
        console.error("Lỗi khi lấy giá phòng (summary):", e);
        if (!cancelled) setPriceInfo(null);
      }
    };
    fetchPrice();
    return () => {
      cancelled = true;
    };
  }, [
    roomData,
    checkInDate,
    checkOutDate,
    bookingDetails.rooms,
    bookingDetails.room,
    bookingDetails.DichVuDaChon,
    room,
  ]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!roomData || !checkInDate || !checkOutDate) return <Spinner />;

  // ===============================
  // 🕓 Tính toán giá và khuyến mãi
  // ===============================
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  if (nights <= 0) {
    return (
      <div className="alert alert-warning">
        Ngày check-out phải sau ngày check-in.
      </div>
    );
  }

  const serverPrice = priceInfo;
  const total = roomData.price * nights * rooms;
  let discount = 0;
  let totalAfterDiscount = total;
  let _activePromo = null;

  if (serverPrice && typeof serverPrice.originalTotal !== "undefined") {
    discount = serverPrice.discountAmount || 0;
    totalAfterDiscount =
      serverPrice.discountedTotal || serverPrice.originalTotal || total;
    _activePromo = serverPrice.activePromotion || null;
  } else {
    const promo = bookingDetails.promo;
    if (promo) {
      if (promo.discountPercent) {
        discount = Math.round(
          (total * Number(promo.discountPercent || 0)) / 100
        );
      } else if (promo.discountAmount) {
        discount = Number(promo.discountAmount) || 0;
        if (discount > total) discount = total;
      }
      totalAfterDiscount = total - discount;
      _activePromo = promo;
    }
  }

  // ===============================
  // 🧾 Dịch vụ bổ sung
  // ===============================
  const selectedServices = Array.isArray(bookingDetails.DichVuDaChon)
    ? bookingDetails.DichVuDaChon
    : [];
  const tongTienDichVu = selectedServices.reduce((sum, dv) => {
    const price = Number(dv.GiaDichVu || dv.Gia || 0);
    const qty = Number(dv.SoLuong || 0);
    return sum + price * qty;
  }, 0);

  const grandTotal = totalAfterDiscount + tongTienDichVu;

  // ===============================
  // 🖼️ Render UI
  // ===============================
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

      {/* ===================== Dịch vụ bổ sung ===================== */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Dịch vụ bổ sung</h5>
          <div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary toggle-btn me-2"
              onClick={() => setShowServices((v) => !v)}
            >
              {showServices ? "Ẩn dịch vụ" : "Hiện dịch vụ"}
            </button>
            <small className="text-muted">
              {availableServices.length} dịch vụ có sẵn
            </small>
          </div>
        </div>

        {availableServices.length === 0 && (
          <div className="text-muted">
            Không có dịch vụ bổ sung cho phòng này.
          </div>
        )}

        {showServices && availableServices.length > 0 && (
          <div
            className={`services-container ${
              showServices ? "expanded" : "collapsed"
            }`}
          >
            {availableServices.map((s) => {
              const selected =
                selectedServices.find((x) => x.MaDichVu === s.MaDichVu) || null;
              const qty = selected ? Number(selected.SoLuong || 0) : 0;
              const price = Number(s.GiaDichVu || 0);
              const lineTotal = price * qty;
              const imgSrc = s.HinhAnhDichVu
                ? `http://localhost:5000/assets/images/services/${s.HinhAnhDichVu}`
                : "/images/default-thumb.jpg";

              return (
                <div
                  key={s.MaDichVu}
                  className={`service-card ${selected ? "selected" : ""}`}
                  style={{ position: "relative" }}
                >
                  {selected && <div className="selected-indicator">✓</div>}
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="service-info-container">
                      <img
                        src={imgSrc}
                        alt={s.TenDichVu}
                        className="service-image"
                      />
                      <div className="service-details">
                        <div className="service-title">{s.TenDichVu}</div>
                        <div className="price-container">
                          <span className="service-price">
                            {price.toLocaleString()}đ
                          </span>
                          <span className="service-unit">
                            /{s.DonViTinh || "lần"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="controls-container">
                      <div className="qty-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          disabled={qty <= 0}
                          onClick={() => {
                            const current = [...selectedServices];
                            const idx = current.findIndex(
                              (x) => x.MaDichVu === s.MaDichVu
                            );
                            if (idx !== -1) {
                              const newQty = Math.max(
                                0,
                                Number(current[idx].SoLuong) - 1
                              );
                              if (newQty === 0) current.splice(idx, 1);
                              else current[idx].SoLuong = newQty;
                              updateBookingDetails({ DichVuDaChon: current });
                            }
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
                            const current = [...selectedServices];
                            const idx = current.findIndex(
                              (x) => x.MaDichVu === s.MaDichVu
                            );
                            const newQty = Math.min(10, qty + 1);
                            const item = {
                              MaDichVu: s.MaDichVu,
                              TenDichVu: s.TenDichVu,
                              GiaDichVu: price,
                              SoLuong: newQty,
                            };
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

      {/* ===================== Tổng kết hóa đơn ===================== */}
      <hr />
      <div
        className="invoice-summary p-3 mt-3 rounded"
        style={{ background: "#fff" }}
      >
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
          <span className="text-primary">{grandTotal.toLocaleString()}đ</span>
        </div>
      </div>

      {discount > 0 && (
        <div className="mt-2 text-muted small">
          (Giảm {discount.toLocaleString()}đ từ khuyến mãi)
        </div>
      )}
    </div>
  );
}

export default BookingSummary;
