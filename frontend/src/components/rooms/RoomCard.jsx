// components/rooms/RoomCard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { getRoomImageUrl } from '../../config/constants';
import { FaBed, FaUsers } from 'react-icons/fa';

function RoomCard({ room, onBook }) {
  const navigate = useNavigate();
  
  // Map dữ liệu Vietnamese DB schema → frontend display (with defensive checks)
  const mappedRoom = {
    id: room._id,
    slug: room.MaPhong || 'unknown', // MaPhong làm slug
    title: room.TenPhong || 'Untitled Room',
    imageUrl: getRoomImageUrl(room.HinhAnh),
    description: room.MoTa || 'No description available',
    price: room.GiaPhong || 0,
    roomType: room.LoaiPhong || 'Standard',
    floor: room.Tang || 1,
    bedType: room.LoaiGiuong || 'Standard',
    maxGuests: room.SoGiuong || 1, // Assuming SoGiuong relates to capacity
    status: room.TinhTrang || 'Trống',
    amenities: room.MaTienNghi || [],
    promotions: room.MaKhuyenMai || []
  };

  const handleBook = () => {
    if (onBook) onBook(room._id);
    else navigate(`/booking?room=${room._id}`);
  };

  return (
    <div className="card h-100 shadow-sm border-0 overflow-hidden">
      <img 
        src={mappedRoom.imageUrl} 
        alt={mappedRoom.title} 
        className="card-img-top" 
        style={{ height: '200px', objectFit: 'cover' }} 
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{mappedRoom.title}</h5>
        <p className="card-text text-muted small mb-3">
          {mappedRoom.description.length > 100 
            ? `${mappedRoom.description.substring(0, 100)}...` 
            : mappedRoom.description}
        </p>
        
        {/* Chi tiết ngắn gọn */}
        <div className="d-flex justify-content-between mb-3 text-muted small">
          <span><FaUsers /> {mappedRoom.maxGuests}</span>
          <span><FaBed /> {mappedRoom.bedType}</span>
        </div>

        {/* Giá + Khuyến mãi */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="text-primary mb-0">{formatCurrency(mappedRoom.price)}/đêm</h4>
          {mappedRoom.promotions.length > 0 && (
            <span className="badge bg-danger">
              KM
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2 mt-auto">
          <Link to={`/room/${room._id}`} className="btn btn-outline-primary flex-fill">
            Xem chi tiết
          </Link>
          {mappedRoom.status === 'Trống' && (
            <button className="btn btn-primary flex-fill" onClick={handleBook}>
              Đặt ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomCard;