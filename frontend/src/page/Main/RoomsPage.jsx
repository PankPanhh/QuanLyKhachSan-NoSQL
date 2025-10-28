import React, { useState, useEffect } from 'react';
import { getAllRooms } from '../../services/roomService';
import RoomCard from '../../components/rooms/RoomCard';
import Spinner from '../../components/common/Spinner';

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const data = await getAllRooms();
        setRooms(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phòng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div className="container padding-large">
      <h1 className="display-3 fw-normal text-center mb-5">Danh sách phòng</h1>
      
      {loading ? (
        <Spinner />
      ) : (
        <div className="row g-4">
          {rooms.map(room => (
            // Sử dụng RoomCard đã tạo
            // Chú ý: RoomCard gốc có 2 phần (ảnh hover + text), 
            // có thể bạn cần 1 kiểu RoomCard khác đơn giản hơn cho trang này
            <div className="col-lg-4 col-md-6" key={room.id}>
              {/* Tạm thời dùng RoomCard gốc */}
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoomsPage;
