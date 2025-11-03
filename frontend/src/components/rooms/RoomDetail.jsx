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

function RoomDetail({ room }) {
  if (!room) return null;

  // Sử dụng trực tiếp Vietnamese schema
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
    images: [{
      url: getRoomImageUrl(room.HinhAnh),
      altText: room.TenPhong || 'Room Image'
    }],
    // Prefer the rich `TienNghi` objects (which include TenTienNghi and TrangThai).
    // Show only amenities whose TrangThai === 'Hoạt động'. Fall back to the legacy
    // `MaTienNghi` array when `TienNghi` is not present.
    amenities: (Array.isArray(room.TienNghi) ? room.TienNghi
      .filter(t => String((t.TrangThai || '')).trim() === 'Hoạt động')
      .map(t => ({
        name: t.TenTienNghi || getAmenityName(t.MaTienNghi),
        icon: getAmenityIcon(t.MaTienNghi)
      })) : (room.MaTienNghi || []).map((ma) => ({
        name: getAmenityName(ma),
        icon: getAmenityIcon(ma)
      }))),
    // Use embedded KhuyenMai array when present (newer schema). Fallback to MaKhuyenMai.
    promotions: Array.isArray(room.KhuyenMai) && room.KhuyenMai.length > 0
      ? room.KhuyenMai
      : (room.MaKhuyenMai || []).map((ma) => ({
          MaKhuyenMai: ma,
          TenChuongTrinh: `Khuyến mãi ${ma}`,
          LoaiGiamGia: 'Phần trăm',
          GiaTriGiam: 10,
          TrangThai: 'Hoạt động'
        }))
  };

  // Read booking dates from BookingContext so we can determine whether a promo
  // applies to the currently selected stay range.
  const { bookingDetails } = useContext(BookingContext);
  const checkIn = bookingDetails?.checkInDate ? new Date(bookingDetails.checkInDate) : null;
  const checkOut = bookingDetails?.checkOutDate ? new Date(bookingDetails.checkOutDate) : null;

  // Find the first promotion that is marked 'Hoạt động' and whose date range
  // contains today's date. We'll also check booking dates later to see if the
  // selected stay falls inside the promo window.
  const now = new Date();
  const normalizedPromos = (roomData.promotions || []).map((p) => ({
    MaKhuyenMai: p.MaKhuyenMai || p.MaKM || p.Ma || null,
    TenChuongTrinh: p.TenChuongTrinh || p.Ten || p.TenKM || null,
    LoaiGiamGia: p.LoaiGiamGia || p.LoaiGiam || '',
    GiaTriGiam: p.GiaTriGiam != null ? p.GiaTriGiam : (p.GiaTri != null ? p.GiaTri : p.value),
    NgayBatDau: p.NgayBatDau ? new Date(p.NgayBatDau) : null,
    NgayKetThuc: p.NgayKetThuc ? new Date(p.NgayKetThuc) : null,
    DieuKien: p.DieuKien || p.DieuKhoan || p.Condition || '',
    MoTa: p.MoTa || p.Description || '',
    TrangThai: p.TrangThai || p.Status || '',
  }));

  const activePromo = normalizedPromos.find((p) => {
    if (!p) return false;
    if (String((p.TrangThai || '')).trim() !== 'Hoạt động') return false;
    if (p.NgayBatDau && p.NgayBatDau > now) return false;
    if (p.NgayKetThuc && p.NgayKetThuc < now) return false;
    return true;
  }) || null;

  // Determine whether the currently selected booking dates fall inside the
  // promotion period. We require the entire stay to be within the promo window
  // for the discount to apply. If no dates are selected, treat as potentially applicable.
  let promoAppliesToSelectedDates = true;
  if (activePromo && (checkIn || checkOut)) {
    if (activePromo.NgayBatDau && checkIn && checkIn < activePromo.NgayBatDau) promoAppliesToSelectedDates = false;
    if (activePromo.NgayKetThuc && checkOut && checkOut > activePromo.NgayKetThuc) promoAppliesToSelectedDates = false;
  }

  return (
    <div>
      {/* Slider ảnh */}
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
          <>
            {/* If promo applies to selected dates, show crossed price and discounted price */}
            {promoAppliesToSelectedDates ? (
              <>
                <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.9em', marginRight: 10 }}>{formatCurrency(roomData.pricePerNight)}/đêm</span>
                <span>{formatCurrency(
                  activePromo.LoaiGiamGia && String(activePromo.LoaiGiamGia).toLowerCase().includes('phần')
                    ? Math.max(0, roomData.pricePerNight * (1 - (Number(activePromo.GiaTriGiam || 0) / 100)))
                    : Math.max(0, roomData.pricePerNight - Number(activePromo.GiaTriGiam || 0))
                )}/đêm</span>
              </>
            ) : (
              <>
                {formatCurrency(roomData.pricePerNight)}/đêm
                <span className="ms-3 text-warning">Chương trình không còn hiệu lực</span>
              </>
            )}
            <span className="badge bg-danger ms-3">
              {activePromo.TenChuongTrinh ? `${activePromo.TenChuongTrinh}` : (activePromo.MaKhuyenMai || 'KM')}
            </span>
          </>
        ) : (
          <>{formatCurrency(roomData.pricePerNight)}/đêm</>
        )}
      </h2>

      {/* Mô tả */}
      <p className="lead mb-4">{roomData.description}</p>

      {/* Chi tiết phòng */}
      <hr className="my-4" />
      <h3 className="mb-3">Thông tin chi tiết</h3>
      <div className="row g-4 mb-4">
        <div className="col-md-4 text-center">
          <FaUsers className="text-primary fs-1 mb-2" />
          <h5>{roomData.maxGuests} người</h5>
        </div>
        <div className="col-md-4 text-center">
          <FaBed className="text-primary fs-1 mb-2" />
          <h5>{roomData.bedType}</h5>
        </div>
        <div className="col-md-4 text-center">
          <FaRulerCombined className="text-primary fs-1 mb-2" />
          <h5>{roomData.floor}F - {roomData.roomType}</h5>
        </div>
      </div>

      {/* Tiện nghi với ICON */}
      <hr className="my-4" />
      <h3 className="mb-3">Tiện nghi</h3>
        <div className="row g-3">
          {roomData.amenities.map((amenity, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              <div className="d-flex align-items-center">
                <span className="text-success me-2 fs-4">
                  {amenity.icon}
                </span>
                <span>{amenity.name}</span>
              </div>
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

      {/* Khuyến mãi: hiển thị chi tiết khi có khuyến mãi đặc biệt hợp lệ */}
      {activePromo && (
        <>
          <hr className="my-4" />
          <h3 className="mb-3">Khuyến mãi</h3>
          <div className="alert alert-success">
            <strong>{activePromo.TenChuongTrinh || activePromo.MaKhuyenMai || 'Khuyến mãi'}:</strong>{' '}
            {activePromo.MoTa || activePromo.DieuKien || ''}
            <br />
            <small>Khuyến mãi đặc biệt</small>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions để map mã tiện nghi
const getAmenityName = (ma) => {
  const amenityMap = {
    'TN001': 'Wi-Fi miễn phí',
    'TN002': 'TV màn hình phẳng',
    'TN003': 'Điều hòa',
    'TN004': 'Minibar',
    'TN005': 'Phòng tắm riêng',
  };
  return amenityMap[ma] || `Tiện nghi ${ma}`;
};

const getAmenityIcon = (ma, name) => {
  // Return a React node (icon component). Try by code first, then by name keywords.
  switch (ma) {
    case 'TN001': return <FaWifi />;
    case 'TN002': return <FaTv />;
    case 'TN003': return <FaSnowflake />; // điều hòa
    case 'TN004': return <FaCocktail />; // minibar/bar
    case 'TN005': return <FaBath />; // phòng tắm
    default: break;
  }

  const n = String(name || '').toLowerCase();
  if (n.includes('wifi') || n.includes('wi-fi')) return <FaWifi />;
  if (n.includes('tv') || n.includes('tivi')) return <FaTv />;
  if (n.includes('điều hòa') || n.includes('đieu hoa') || n.includes('ac') || n.includes('air')) return <FaSnowflake />;
  if (n.includes('minibar') || n.includes('bar') || n.includes('mini')) return <FaCocktail />;
  if (n.includes('tắm') || n.includes('bath') || n.includes('bathroom')) return <FaBath />;

  // fallback generic check icon
  return <FaCheckCircle />;
};

export default RoomDetail;