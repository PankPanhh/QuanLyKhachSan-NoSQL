// components/rooms/RoomDetail.jsx
import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { 
  FaBed, FaUsers, FaRulerCombined, FaCheckCircle, 
  FaWifi, FaTv, FaBath, FaSnowflake, FaCocktail 
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatCurrency';
import { getRoomImageUrl } from '../../config/constants';
import { BookingContext } from '../../context/BookingContext';
import RoomRatingDisplay from './RoomRatingDisplay';

function RoomDetail({ room }) {
  if (!room) return null;

  // Chuẩn hoá dữ liệu phòng theo schema tiếng Việt
  const roomData = {
    title: room.TenPhong || 'Phòng không tên',
    description: room.MoTa || 'Không có mô tả',
    pricePerNight: room.GiaPhong || 0,
    roomType: room.LoaiPhong || 'Standard',
    floor: room.Tang || 1,
    bedType: room.LoaiGiuong || 'Standard',
    maxGuests: room.SoGiuong || 1,
    area: room.DienTich || 0,
    roomCode: room.MaPhong || 'Unknown',
    status: room.TinhTrang || 'Trống',
    images: [
      {
        url: getRoomImageUrl(room.HinhAnh),
        altText: room.TenPhong || 'Room Image',
      },
    ],
    // Ưu tiên dùng object TienNghi (schema mới)
    amenities: Array.isArray(room.TienNghi)
      ? room.TienNghi.filter(t => String((t.TrangThai || '')).trim() === 'Hoạt động')
        .map(t => ({
          name: t.TenTienNghi || getAmenityName(t.MaTienNghi),
          icon: getAmenityIcon(t.MaTienNghi, t.TenTienNghi),
        }))
      : (room.MaTienNghi || []).map((ma) => ({
          name: getAmenityName(ma),
          icon: getAmenityIcon(ma),
        })),
    // Ưu tiên schema KhuyenMai dạng object
    promotions: Array.isArray(room.KhuyenMai) && room.KhuyenMai.length > 0
      ? room.KhuyenMai
      : (room.MaKhuyenMai || []).map((ma) => ({
          MaKhuyenMai: ma,
          TenChuongTrinh: `Khuyến mãi ${ma}`,
          LoaiGiamGia: 'Phần trăm',
          GiaTriGiam: 10,
          TrangThai: 'Hoạt động',
        })),
  };

  // Đọc ngày nhận/trả phòng từ context
  const { bookingDetails } = useContext(BookingContext);
  const checkIn = bookingDetails?.checkInDate ? new Date(bookingDetails.checkInDate) : null;
  const checkOut = bookingDetails?.checkOutDate ? new Date(bookingDetails.checkOutDate) : null;

  // Chuẩn hoá danh sách khuyến mãi
  const now = new Date();
  const normalizedPromos = (roomData.promotions || []).map((p) => ({
    MaKhuyenMai: p.MaKhuyenMai || p.MaKM || p.Ma || null,
    TenChuongTrinh: p.TenChuongTrinh || p.Ten || p.TenKM || null,
    LoaiGiamGia: p.LoaiGiamGia || '',
    GiaTriGiam: p.GiaTriGiam != null ? p.GiaTriGiam : p.GiaTri || 0,
    NgayBatDau: p.NgayBatDau ? new Date(p.NgayBatDau) : null,
    NgayKetThuc: p.NgayKetThuc ? new Date(p.NgayKetThuc) : null,
    TrangThai: p.TrangThai || '',
    MoTa: p.MoTa || '',
    DieuKien: p.DieuKien || '',
  }));

  // Lọc ra khuyến mãi đang hoạt động
  const activePromo =
    normalizedPromos.find((p) => {
      if (String((p.TrangThai || '')).trim() !== 'Hoạt động') return false;
      if (p.NgayBatDau && p.NgayBatDau > now) return false;
      if (p.NgayKetThuc && p.NgayKetThuc < now) return false;
      return true;
    }) || null;

  // Kiểm tra ngày đặt phòng có nằm trong thời gian khuyến mãi
  let promoAppliesToSelectedDates = true;
  if (activePromo && (checkIn || checkOut)) {
    if (activePromo.NgayBatDau && checkIn && checkIn < activePromo.NgayBatDau)
      promoAppliesToSelectedDates = false;
    if (activePromo.NgayKetThuc && checkOut && checkOut > activePromo.NgayKetThuc)
      promoAppliesToSelectedDates = false;
  }

  return (
    <div>
      {/* Slider ảnh phòng */}
      <Swiper modules={[Navigation]} navigation loop className="mb-4 rounded-4 overflow-hidden">
        {roomData.images.map((img, index) => (
          <SwiperSlide key={index}>
            <img
              src={img.url}
              alt={img.altText}
              className="img-fluid w-100"
              style={{ height: '500px', objectFit: 'cover' }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Tiêu đề & Giá */}
      <h1 className="display-4 fw-normal mb-3">{roomData.title}</h1>
      <h2 className="text-primary fs-1 mb-4">
        {activePromo ? (
          promoAppliesToSelectedDates ? (
            <>
              <span
                style={{
                  textDecoration: 'line-through',
                  color: '#888',
                  fontSize: '0.9em',
                  marginRight: 10,
                }}
              >
                {formatCurrency(roomData.pricePerNight)}/đêm
              </span>
              <span>
                {formatCurrency(
                  activePromo.LoaiGiamGia.toLowerCase().includes('phần')
                    ? Math.max(0, roomData.pricePerNight * (1 - activePromo.GiaTriGiam / 100))
                    : Math.max(0, roomData.pricePerNight - activePromo.GiaTriGiam)
                )}/đêm
              </span>
              <span className="badge bg-danger ms-3">
                {activePromo.TenChuongTrinh || activePromo.MaKhuyenMai || 'Khuyến mãi'}
              </span>
            </>
          ) : (
            <>
              {formatCurrency(roomData.pricePerNight)}/đêm
              <span className="ms-3 text-warning">Chương trình không còn hiệu lực</span>
            </>
          )
        ) : (
          <>{formatCurrency(roomData.pricePerNight)}/đêm</>
        )}
      </h2>

      {/* Mô tả phòng */}
      <p className="lead mb-4">{roomData.description}</p>

      {/* Đánh giá phòng */}
      <div className="mb-4 p-4 bg-light rounded-3 border">
        <h5 className="mb-3">⭐ Đánh giá của khách hàng</h5>
        <RoomRatingDisplay roomCode={room.MaPhong} showDetails />
      </div>

      {/* Thông tin chi tiết */}
      <hr className="my-4" />
      <h3 className="mb-3">Thông tin chi tiết</h3>
      <div className="row g-4 mb-4 text-center">
        <div className="col-md-4">
          <FaUsers className="text-primary fs-1 mb-2" />
          <h5>{roomData.maxGuests} người</h5>
        </div>
        <div className="col-md-4">
          <FaBed className="text-primary fs-1 mb-2" />
          <h5>{roomData.bedType}</h5>
        </div>
        <div className="col-md-4">
          <FaRulerCombined className="text-primary fs-1 mb-2" />
          <h5>
            {roomData.floor}F - {roomData.roomType}
          </h5>
        </div>
      </div>

      {/* Tiện nghi */}
      <hr className="my-4" />
      <h3 className="mb-3">Tiện nghi</h3>
      <div className="row g-3">
        {roomData.amenities.map((amenity, index) => (
          <div key={index} className="col-md-6 col-lg-4 d-flex align-items-center">
            <span className="text-success me-2 fs-4">{amenity.icon}</span>
            <span>{amenity.name}</span>
          </div>
        ))}
      </div>

      {/* Dịch vụ đi kèm */}
      {room.extraServices?.length > 0 && (
        <>
          <hr className="my-4" />
          <h3 className="mb-3">Dịch vụ đi kèm</h3>
          <div className="row g-3">
            {room.extraServices.map((service, index) => (
              <div key={index} className="col-md-6">
                <div className="card p-3">
                  <h6>{service.name}</h6>
                  <span className="text-primary">{formatCurrency(service.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Khuyến mãi */}
      {activePromo && (
        <>
          <hr className="my-4" />
          <h3 className="mb-3">Khuyến mãi</h3>
          <div className="alert alert-success">
            <strong>
              {activePromo.TenChuongTrinh || activePromo.MaKhuyenMai || 'Khuyến mãi'}:
            </strong>{' '}
            {activePromo.MoTa || activePromo.DieuKien || 'Áp dụng cho khách đặt trực tuyến.'}
          </div>
        </>
      )}
    </div>
  );
}

// 🧠 Hàm phụ trợ: tên & icon tiện nghi
const getAmenityName = (ma) => {
  const map = {
    TN001: 'Wi-Fi miễn phí',
    TN002: 'TV màn hình phẳng',
    TN003: 'Điều hòa',
    TN004: 'Minibar',
    TN005: 'Phòng tắm riêng',
  };
  return map[ma] || `Tiện nghi ${ma}`;
};

const getAmenityIcon = (ma, name) => {
  switch (ma) {
    case 'TN001': return <FaWifi />;
    case 'TN002': return <FaTv />;
    case 'TN003': return <FaSnowflake />;
    case 'TN004': return <FaCocktail />;
    case 'TN005': return <FaBath />;
  }
  const n = String(name || '').toLowerCase();
  if (n.includes('wifi')) return <FaWifi />;
  if (n.includes('tv')) return <FaTv />;
  if (n.includes('điều hòa')) return <FaSnowflake />;
  if (n.includes('minibar') || n.includes('bar')) return <FaCocktail />;
  if (n.includes('tắm')) return <FaBath />;
  return <FaCheckCircle />;
};

export default RoomDetail;
