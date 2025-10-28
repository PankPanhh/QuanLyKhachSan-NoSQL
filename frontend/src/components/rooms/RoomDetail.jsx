import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaBed, FaUsers, FaRulerCombined, FaCheckCircle } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatCurrency';

// Component này chỉ để hiển thị, nhận 'room' từ trang RoomDetailPage
function RoomDetail({ room }) {
  const { title, images, description, price, details } = room;

  return (
    <div>
      {/* Slider ảnh của phòng */}
      <Swiper
        modules={[Navigation]}
        navigation
        loop
        className="room-detail-swiper mb-4 rounded"
      >
        {images.map((img, index) => (
          <SwiperSlide key={index}>
            <img src={img} alt={`${title} - ảnh ${index + 1}`} className="img-fluid w-100" style={{maxHeight: '500px', objectFit: 'cover'}} />
          </SwiperSlide>
        ))}
      </Swiper>
      
      <h1 className="display-4 fw-normal">{title}</h1>
      <h2 className="text-primary fs-1 mb-4">{formatCurrency(price)}/đêm</h2>
      
      <p className="lead">{description}</p>
      
      <hr className="my-4" />
      
      <h3 className="mb-3">Chi tiết phòng</h3>
      <div className="row g-3 fs-5">
        <div className="col-md-6 d-flex align-items-center">
            <FaUsers className="text-primary me-2" /> <span>{details.capacity}</span>
        </div>
        <div className="col-md-6 d-flex align-items-center">
            <FaBed className="text-primary me-2" /> <span>{details.bed}</span>
        </div>
        <div className="col-md-6 d-flex align-items-center">
            <FaRulerCombined className="text-primary me-2" /> <span>{details.size}</span>
        </div>
      </div>
      
      <hr className="my-4" />

      <h3 className="mb-3">Tiện nghi</h3>
      <ul className="list-unstyled row g-2">
        {details.services.split(',').map((service, index) => (
            <li key={index} className="col-md-6 d-flex align-items-center">
                <FaCheckCircle className="text-success me-2" /> {service.trim()}
            </li>
        ))}
      </ul>
    </div>
  );
}

export default RoomDetail;
