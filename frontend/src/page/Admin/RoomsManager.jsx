import React, { useState, useEffect } from 'react';
import { 
  adminGetAllRooms, 
  adminCreateRoom, 
  adminUpdateRoom, 
  adminDeleteRoom 
} from '../../services/roomService';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField'; // Giả định InputField có thể nhận 'name', 'value', 'onChange'
import { formatCurrency } from '../../utils/formatCurrency';

// Giá trị mặc định cho một phòng mới
const emptyRoom = {
  MaPhong: '',
  TenPhong: '',
  LoaiPhong: '',
  Tang: 1,
  GiaPhong: 0,
  SoGiuong: 1,
  LoaiGiuong: '',
  DienTich: 0,
  MoTa: '',
  HinhAnh: '',
  TinhTrang: 'Trống',
};

function RoomsManager() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Để biết đang edit hay add
  const [error, setError] = useState(null); 
  
  // *** SỬA LỖI TYPEERROR: Dùng state để quản lý form ***
  const [formData, setFormData] = useState(emptyRoom);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null); 
      const data = await adminGetAllRooms();
      setRooms(data);
    } catch (error) {
      console.error("Lỗi khi tải phòng:", error);
      setError("Không thể tải danh sách phòng. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật state của form khi người dùng nhập
  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleOpenAddModal = () => {
    setSelectedRoom(null);
    setFormData(emptyRoom); // Reset form về rỗng
    setError(null); 
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (room) => {
    setSelectedRoom(room);
    setFormData(room); // Nạp dữ liệu của phòng vào form
    setError(null); 
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null); 
    setError(null); 
  };
  
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    
    // *** SỬA LỖI TYPEERROR: Lấy payload từ state 'formData' ***
    const payload = {
      ...formData,
      // Đảm bảo các trường số được gửi đi là số
      Tang: Number(formData.Tang) || 1,
      GiaPhong: Number(formData.GiaPhong) || 0,
      SoGiuong: Number(formData.SoGiuong) || 1,
      DienTich: Number(formData.DienTich) || 0,
    };

    try {
      setLoading(true); 
      setError(null);   
      
      if (selectedRoom) {
        // Cập nhật
        await adminUpdateRoom(selectedRoom._id, payload);
      } else {
        // Thêm mới
        await adminCreateRoom(payload);
      }
      
      handleCloseModal(); 
      await fetchRooms();   
      
    } catch (error) {
      console.error('Lỗi khi lưu phòng:', error);
      setError("Lưu phòng thất bại: " + error.message);
      setLoading(false); // *** Phải tắt loading khi lỗi ***
    } 
  };

  const handleDeleteRoom = async (roomId) => {
    if (loading) return; 

    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      try {
        setLoading(true);
        setError(null);
        await adminDeleteRoom(roomId);
        await fetchRooms(); 
      } catch (error) {
        console.error('Lỗi khi xóa phòng:', error);
        setError("Xóa phòng thất bại: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Quản lý Phòng</h1>
        <Button className="btn btn-primary" onClick={handleOpenAddModal} disabled={loading}>
          Thêm phòng mới
        </Button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}

      {loading && !isModalOpen ? ( 
        <Spinner />
      ) : (
        <table className="table table-striped table-hover bg-white rounded shadow-sm">
          <thead className="thead-light">
            <tr>
              <th>Mã Phòng</th>
              <th>Tên phòng</th>
              <th>Loại phòng</th>
              <th>Giá</th>
              <th>Số giường</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room._id}> 
                <td>{room.MaPhong}</td>
                <td>{room.TenPhong}</td>
                <td>{room.LoaiPhong}</td>
                <td>{formatCurrency(room.GiaPhong)}</td>
                <td>{room.SoGiuong}</td>
                <td>
                  <Button 
                    className="btn btn-sm btn-warning me-2" 
                    onClick={() => handleOpenEditModal(room)}
                    disabled={loading} 
                  >
                    Sửa
                  </Button>
                  <Button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDeleteRoom(room._id)}
                    disabled={loading}
                  >
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
        {/* *** SỬA LỖI TYPEERROR: Chuyển sang Controlled Form *** */}
        <form onSubmit={handleSaveRoom}>
          <div className="row">
            <div className="col-md-6">
              <InputField 
                label="Mã phòng" 
                name="MaPhong"
                value={formData.MaPhong} 
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-md-6">
              <InputField 
                label="Tên phòng" 
                name="TenPhong" 
                value={formData.TenPhong}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-md-6">
              <InputField 
                label="Loại phòng" 
                name="LoaiPhong"
                value={formData.LoaiPhong}
                onChange={handleFormChange}
                required
              />
            </div>
             <div className="col-md-6">
              <InputField 
                label="Tầng" 
                name="Tang" 
                type="number"
                value={formData.Tang}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-md-6">
              <InputField 
                label="Giá (VND)" 
                type="number" 
                name="GiaPhong" 
                value={formData.GiaPhong}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-md-6">
              <InputField 
                label="Số giường" 
                type="number" 
                name="SoGiuong" 
                value={formData.SoGiuong}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-md-6">
              <InputField 
                label="Loại giường" 
                name="LoaiGiuong"
                value={formData.LoaiGiuong} 
                onChange={handleFormChange}
              />
            </div>
            <div className="col-md-6">
              <InputField 
                label="Diện tích (m²)" 
                type="number" 
                name="DienTich" 
                value={formData.DienTich}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <InputField 
            label="Ảnh (URL)" 
            name="HinhAnh" 
            value={formData.HinhAnh}
            onChange={handleFormChange}
          />
          <InputField 
            label="Mô tả" 
            name="MoTa" 
            type="textarea"
            rows={3}
            value={formData.MoTa}
            onChange={handleFormChange}
          />
          
          {error && <div className="alert alert-danger mt-3">{error}</div>}

          <div className="text-end mt-4">
            <Button type="button" className="btn btn-secondary me-2" onClick={handleCloseModal} disabled={loading}>
                Hủy
            </Button>
            <Button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RoomsManager;