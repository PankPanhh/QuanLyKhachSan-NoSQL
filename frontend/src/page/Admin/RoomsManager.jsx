import React, { useState, useEffect } from 'react';
import { adminGetAllRooms } from '../../services/roomService';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal'; // Import Modal
import InputField from '../../components/common/InputField';
import { formatCurrency } from '../../utils/formatCurrency'; // Import utils

function RoomsManager() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Để edit

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await adminGetAllRooms();
      setRooms(data);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedRoom(null); // Đảm bảo là modal "Add"
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (room) => {
    setSelectedRoom(room); // Set phòng đang chọn
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSaveRoom = (e) => {
    e.preventDefault();
    // Logic lưu phòng (thêm mới hoặc cập nhật)
    // ... (Gọi API service) ...
    console.log('Đang lưu phòng...', selectedRoom);
    handleCloseModal();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Quản lý Phòng</h1>
        <Button className="btn btn-primary" onClick={handleOpenAddModal}>
          Thêm phòng mới
        </Button>
      </div>
      
      {loading ? (
        <Spinner />
      ) : (
        <table className="table table-striped table-hover bg-white rounded shadow-sm">
          <thead className="thead-light">
            <tr>
              <th>ID</th>
              <th>Tên phòng</th>
              <th>Giá</th>
              <th>Sức chứa</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td>{room.id}</td>
                <td>{room.title}</td>
                <td>{formatCurrency(room.price)}</td>
                <td>{room.details.capacity}</td>
                <td>
                  <Button className="btn btn-sm btn-warning me-2" onClick={() => handleOpenEditModal(room)}>
                    Sửa
                  </Button>
                  <Button className="btn btn-sm btn-danger">
                    Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Thêm/Sửa phòng */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={selectedRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
      >
        <form onSubmit={handleSaveRoom}>
          <InputField 
            label="Tên phòng" 
            id="roomName" 
            defaultValue={selectedRoom?.title || ''} 
          />
          <InputField 
            label="Giá" 
            type="number" 
            id="roomPrice" 
            defaultValue={selectedRoom?.price || ''}
          />
          <InputField 
            label="Ảnh (URL)" 
            id="imageUrl" 
            defaultValue={selectedRoom?.imageUrl || ''}
          />
          {/* Thêm các trường khác (mô tả, chi tiết...) */}
          <div className="text-end mt-4">
            <Button type="button" className="btn btn-secondary me-2" onClick={handleCloseModal}>
                Hủy
            </Button>
            <Button type="submit" className="btn btn-primary">
                Lưu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RoomsManager;
