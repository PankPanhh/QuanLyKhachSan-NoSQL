// components/rooms/RoomDetail.jsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { 
  FaBed, FaUsers, FaRulerCombined, FaCheckCircle, 
  FaWifi, FaTv, FaBath, FaSnowflake, FaCocktail 
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatCurrency';
import { getRoomImageUrl } from '../../config/constants';

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
    amenities: (room.MaTienNghi || []).map((ma) => ({
      name: getAmenityName(ma),
      icon: getAmenityIcon(ma)
    })),
    promotions: (room.MaKhuyenMai || []).map((ma) => ({
      code: ma,
      description: `Khuyến mãi ${ma}`,
      discountPercent: 10
    }))
  };

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
        {formatCurrency(roomData.pricePerNight)}/đêm
        {roomData.promotions?.[0] && (
          <span className="badge bg-danger ms-3">
            -{roomData.promotions[0].discountPercent}% KM
          </span>
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
                {amenity.icon === 'wifi' && <FaWifi />}
                {amenity.icon === 'tv' && <FaTv />}
                {amenity.icon === 'bath' && <FaBath />}
                {amenity.icon === 'ac' && <FaSnowflake />}
                {amenity.icon === 'bar' && <FaCocktail />}
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

      {/* Khuyến mãi */}
      {roomData.promotions?.[0] && (
        <>
          <hr className="my-4" />
          <h3 className="mb-3">Khuyến mãi</h3>
          <div className="alert alert-success">
            <strong>{roomData.promotions[0].code}:</strong> {roomData.promotions[0].description} 
            <br /><small>Khuyến mãi đặc biệt</small>
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

const getAmenityIcon = (ma) => {
  const iconMap = {
    'TN001': 'wifi',
    'TN002': 'tv', 
    'TN003': 'ac',
    'TN004': 'bar',
    'TN005': 'bath',
  };
  return iconMap[ma] || 'wifi';
};

export default RoomDetail;