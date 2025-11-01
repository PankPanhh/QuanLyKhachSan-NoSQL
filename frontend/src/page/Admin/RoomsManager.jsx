import React, { useState, useEffect } from 'react';
import { 
  adminGetAllRooms, 
  adminUpdateRoom 
} from '../../services/roomService';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField'; // Giả định InputField có thể nhận 'name', 'value', 'onChange'
import { formatCurrency } from '../../utils/formatCurrency';
import { API_BASE_URL, ASSETS_BASE_URL, getRoomImageUrl } from '../../config/constants';

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
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // Chỉ để edit, không add
  const [selectedRooms, setSelectedRooms] = useState([]); // For bulk operations
  const [error, setError] = useState(null); 
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filtering and search states
  const [filters, setFilters] = useState({
    roomType: '',
    status: '',
    floor: '',
    search: ''
  });
  
  // State để quản lý form (chỉ dùng cho edit)
  const [formData, setFormData] = useState(emptyRoom);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rooms, filters]);

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

  const applyFilters = () => {
    let filtered = [...rooms];

    // Filter by room type
    if (filters.roomType) {
      filtered = filtered.filter(room => 
        room.LoaiPhong.toLowerCase().includes(filters.roomType.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(room => room.TinhTrang === filters.status);
    }

    // Filter by floor
    if (filters.floor) {
      filtered = filtered.filter(room => room.Tang.toString() === filters.floor);
    }

    // Search by room code or name
    if (filters.search) {
      filtered = filtered.filter(room => 
        room.MaPhong.toLowerCase().includes(filters.search.toLowerCase()) ||
        room.TenPhong.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      roomType: '',
      status: '',
      floor: '',
      search: ''
    });
  };

  // Show success message
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Get unique values for filters
  const getUniqueRoomTypes = () => [...new Set(rooms.map(room => room.LoaiPhong))];
  const getUniqueFloors = () => [...new Set(rooms.map(room => room.Tang))].sort((a, b) => a - b);

  // Status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      'Trống': { bg: 'rgba(40, 167, 69, 0.2)', color: '#28a745', icon: 'fa-check-circle', text: 'Sẵn sàng' },
      'Đang sử dụng': { bg: 'rgba(23, 162, 184, 0.2)', color: '#17a2b8', icon: 'fa-user', text: 'Có khách' },
      'Đang dọn dẹp': { bg: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', icon: 'fa-broom', text: 'Đang dọn' },
      'Bảo trì': { bg: 'rgba(108, 117, 125, 0.2)', color: '#6c757d', icon: 'fa-tools', text: 'Bảo trì' },
      'Hư': { bg: 'rgba(220, 53, 69, 0.2)', color: '#dc3545', icon: 'fa-times-circle', text: 'Hư hỏng' },
      'Đã đặt': { bg: 'rgba(23, 162, 184, 0.2)', color: '#17a2b8', icon: 'fa-calendar-check', text: 'Đã đặt' }
    };
    return statusColors[status] || { bg: 'rgba(108, 117, 125, 0.2)', color: '#6c757d', icon: 'fa-question', text: status };
  };

  // Cập nhật state của form khi người dùng nhập
  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  // Bulk selection handlers
  const handleSelectRoom = (roomId) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRooms.length === filteredRooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(filteredRooms.map(room => room._id));
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedRooms.length === 0) return;
    
    const confirmMessage = `Bạn có chắc chắn muốn cập nhật trạng thái ${selectedRooms.length} phòng thành "${newStatus}"?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        setError(null);
        
        // Update all selected rooms
        await Promise.all(
          selectedRooms.map(roomId => 
            adminUpdateRoom(roomId, { TinhTrang: newStatus })
          )
        );
        
        setSelectedRooms([]);
        await fetchRooms();
        showSuccessMessage(`Đã cập nhật trạng thái ${selectedRooms.length} phòng thành công!`);
        
      } catch (error) {
        console.error('Lỗi khi cập nhật hàng loạt:', error);
        setError("Cập nhật hàng loạt thất bại: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Chỉ còn function để mở modal edit
  const handleOpenEditModal = (room) => {
    setSelectedRoom(room);
    setFormData(room); // Nạp dữ liệu của phòng vào form
    setError(null); 
    setIsModalOpen(true);
  };

  // View room details
  const handleViewDetails = (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null); 
    setError(null); 
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRoom(null);
  };
  
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    
    // Chỉ cho phép cập nhật phòng
    if (!selectedRoom) {
      setError("Không thể lưu - không có phòng được chọn");
      return;
    }
    
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
      
      // Chỉ cập nhật
      await adminUpdateRoom(selectedRoom._id, payload);
      
      handleCloseModal(); 
      await fetchRooms();   
      showSuccessMessage(`Phòng ${selectedRoom.MaPhong} đã được cập nhật thành công!`);
      
    } catch (error) {
      console.error('Lỗi khi lưu phòng:', error);
      setError("Lưu phòng thất bại: " + error.message);
      setLoading(false);
    } 
  };

  // Quick status update function
  const handleQuickStatusUpdate = async (roomId, newStatus, roomCode) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      
      await adminUpdateRoom(roomId, { TinhTrang: newStatus });
      await fetchRooms();
      showSuccessMessage(`Phòng ${roomCode} đã được cập nhật thành "${newStatus}"!`);
      
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      setError("Cập nhật trạng thái thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{backgroundColor: '#0b1426', minHeight: '100vh', color: '#ffffff'}}>
      <div className="container-fluid px-4 py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <nav aria-label="breadcrumb" className="mb-3">
              <ol className="breadcrumb mb-0" style={{backgroundColor: 'transparent'}}>
                <li className="breadcrumb-item">
                  <span style={{color: '#a0aec0', fontSize: '0.9rem'}}>Pages</span>
                </li>
                <li className="breadcrumb-item">
                  <span style={{color: '#a0aec0', fontSize: '0.9rem'}}>Admin</span>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  <span className="text-white fw-semibold">Quản lý Phòng</span>
                </li>
              </ol>
            </nav>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="fw-bold text-white mb-2" style={{fontSize: '2rem'}}>Danh Sách Phòng</h1>
                <p style={{color: '#a0aec0', fontSize: '1rem'}} className="mb-0">
                  Quản lý thông tin và trạng thái các phòng trong khách sạn
                </p>
              </div>
              <div className="text-end">
                <div style={{
                  backgroundColor: '#111c44',
                  border: '1px solid #1f2a4f',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem'
                }}>
                  <div className="text-white fw-bold">Tổng số phòng</div>
                  <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>
                    {rooms.length} phòng ({filteredRooms.length} hiển thị)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert border-0 mb-4" style={{
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            color: '#28a745',
            border: '1px solid #28a745'
          }} role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger border-0 mb-4" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div style={{
          backgroundColor: '#111c44',
          borderRadius: '16px',
          border: '1px solid #1f2a4f',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6">
              <label className="form-label" style={{color: '#a0aec0', fontSize: '0.9rem', fontWeight: '600'}}>
                <i className="fas fa-search me-2"></i>Tìm kiếm
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo mã phòng hoặc tên phòng..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  backgroundColor: '#0f1734',
                  border: '1px solid #1f2a4f',
                  color: '#ffffff',
                  padding: '0.75rem'
                }}
              />
            </div>
            
            <div className="col-lg-2 col-md-6">
              <label className="form-label" style={{color: '#a0aec0', fontSize: '0.9rem', fontWeight: '600'}}>
                <i className="fas fa-bed me-2"></i>Loại phòng
              </label>
              <select
                className="form-select"
                value={filters.roomType}
                onChange={(e) => handleFilterChange('roomType', e.target.value)}
                style={{
                  backgroundColor: '#0f1734',
                  border: '1px solid #1f2a4f',
                  color: '#ffffff',
                  padding: '0.75rem'
                }}
              >
                <option value="">Tất cả loại</option>
                {getUniqueRoomTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="col-lg-2 col-md-6">
              <label className="form-label" style={{color: '#a0aec0', fontSize: '0.9rem', fontWeight: '600'}}>
                <i className="fas fa-circle me-2"></i>Trạng thái
              </label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  backgroundColor: '#0f1734',
                  border: '1px solid #1f2a4f',
                  color: '#ffffff',
                  padding: '0.75rem'
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Trống">🟢 Sẵn sàng</option>
                <option value="Đang dọn dẹp">🟡 Đang dọn</option>
                <option value="Đang sử dụng">🔵 Có khách</option>
                <option value="Bảo trì">⚙️ Bảo trì</option>
                <option value="Hư">🔴 Hư hỏng</option>
              </select>
            </div>
            
            <div className="col-lg-2 col-md-6">
              <label className="form-label" style={{color: '#a0aec0', fontSize: '0.9rem', fontWeight: '600'}}>
                <i className="fas fa-building me-2"></i>Tầng
              </label>
              <select
                className="form-select"
                value={filters.floor}
                onChange={(e) => handleFilterChange('floor', e.target.value)}
                style={{
                  backgroundColor: '#0f1734',
                  border: '1px solid #1f2a4f',
                  color: '#ffffff',
                  padding: '0.75rem'
                }}
              >
                <option value="">Tất cả tầng</option>
                {getUniqueFloors().map(floor => (
                  <option key={floor} value={floor}>Tầng {floor}</option>
                ))}
              </select>
            </div>
            
            <div className="col-lg-3 col-md-12">
              <div className="d-flex gap-2">
                <Button
                  className="btn flex-fill"
                  onClick={clearFilters}
                  style={{
                    backgroundColor: 'rgba(108, 117, 125, 0.2)',
                    border: '1px solid #6c757d',
                    color: '#6c757d',
                    padding: '0.75rem'
                  }}
                >
                  <i className="fas fa-times me-2"></i>Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRooms.length > 0 && (
          <div style={{
            backgroundColor: '#111c44',
            borderRadius: '12px',
            border: '1px solid #1f2a4f',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-white fw-bold">
                  <i className="fas fa-check-square me-2" style={{color: '#3b82f6'}}></i>
                  Đã chọn {selectedRooms.length} phòng
                </span>
              </div>
              <div className="d-flex gap-2">
                <div className="dropdown">
                  <button 
                    className="btn dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown"
                    style={{
                      backgroundColor: '#3b82f6',
                      border: '1px solid #3b82f6',
                      color: '#ffffff'
                    }}
                  >
                    <i className="fas fa-edit me-2"></i>Cập nhật trạng thái
                  </button>
                  <ul className="dropdown-menu" style={{
                    backgroundColor: '#111c44',
                    border: '1px solid #1f2a4f'
                  }}>
                    <li><a className="dropdown-item text-white" href="#" onClick={() => handleBulkStatusUpdate('Trống')}>🟢 Sẵn sàng</a></li>
                    <li><a className="dropdown-item text-white" href="#" onClick={() => handleBulkStatusUpdate('Đang dọn dẹp')}>🟡 Đang dọn</a></li>
                    <li><a className="dropdown-item text-white" href="#" onClick={() => handleBulkStatusUpdate('Bảo trì')}>⚙️ Bảo trì</a></li>
                    <li><a className="dropdown-item text-white" href="#" onClick={() => handleBulkStatusUpdate('Hư')}>🔴 Hư hỏng</a></li>
                  </ul>
                </div>
                <Button
                  className="btn"
                  onClick={() => setSelectedRooms([])}
                  style={{
                    backgroundColor: 'rgba(108, 117, 125, 0.2)',
                    border: '1px solid #6c757d',
                    color: '#6c757d'
                  }}
                >
                  <i className="fas fa-times me-2"></i>Hủy chọn
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && rooms.length > 0 && (
          <div className="row g-4 mb-5">
            <div className="col-xl-3 col-lg-6 col-md-6">
              <div style={{
                backgroundColor: '#111c44',
                padding: '2rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid #1f2a4f',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{
                      color: '#a0aec0',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      marginBottom: '0.75rem',
                      letterSpacing: '0.5px'
                    }}>🟢 Sẵn sàng</h4>
                    <p style={{
                      color: '#ffffff',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      margin: 0,
                      lineHeight: '1'
                    }}>{filteredRooms.filter(r => r.TinhTrang === 'Trống').length}</p>
                    <small style={{color: '#28a745', fontWeight: '600'}}>
                      +{Math.round((filteredRooms.filter(r => r.TinhTrang === 'Trống').length / (filteredRooms.length || 1)) * 100)}% hiển thị
                    </small>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 20px rgba(40, 167, 69, 0.3)'
                  }}>
                    <i className="fas fa-door-open"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <div style={{
                backgroundColor: '#111c44',
                padding: '2rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid #1f2a4f',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{
                      color: '#a0aec0',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      marginBottom: '0.75rem',
                      letterSpacing: '0.5px'
                    }}>🔵 Có khách</h4>
                    <p style={{
                      color: '#ffffff',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      margin: 0,
                      lineHeight: '1'
                    }}>{filteredRooms.filter(r => r.TinhTrang === 'Đang sử dụng').length}</p>
                    <small style={{color: '#17a2b8', fontWeight: '600'}}>
                      +{Math.round((filteredRooms.filter(r => r.TinhTrang === 'Đang sử dụng').length / (filteredRooms.length || 1)) * 100)}% hiển thị
                    </small>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 20px rgba(23, 162, 184, 0.3)'
                  }}>
                    <i className="fas fa-user-friends"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <div style={{
                backgroundColor: '#111c44',
                padding: '2rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid #1f2a4f',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{
                      color: '#a0aec0',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      marginBottom: '0.75rem',
                      letterSpacing: '0.5px'
                    }}>🟡 Bảo trì</h4>
                    <p style={{
                      color: '#ffffff',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      margin: 0,
                      lineHeight: '1'
                    }}>{filteredRooms.filter(r => ['Bảo trì', 'Hư', 'Đang dọn dẹp'].includes(r.TinhTrang)).length}</p>
                    <small style={{color: '#ffc107', fontWeight: '600'}}>
                      +{Math.round((filteredRooms.filter(r => ['Bảo trì', 'Hư', 'Đang dọn dẹp'].includes(r.TinhTrang)).length / (filteredRooms.length || 1)) * 100)}% hiển thị
                    </small>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffc107',
                    color: 'white',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 20px rgba(255, 193, 7, 0.3)'
                  }}>
                    <i className="fas fa-tools"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <div style={{
                backgroundColor: '#111c44',
                padding: '2rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid #1f2a4f',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{
                      color: '#a0aec0',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      marginBottom: '0.75rem',
                      letterSpacing: '0.5px'
                    }}>📋 Đã đặt</h4>
                    <p style={{
                      color: '#ffffff',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      margin: 0,
                      lineHeight: '1'
                    }}>{filteredRooms.filter(r => r.TinhTrang === 'Đã đặt').length}</p>
                    <small style={{color: '#17a2b8', fontWeight: '600'}}>
                      +{Math.round((filteredRooms.filter(r => r.TinhTrang === 'Đã đặt').length / (filteredRooms.length || 1)) * 100)}% hiển thị
                    </small>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 20px rgba(23, 162, 184, 0.3)'
                  }}>
                    <i className="fas fa-calendar-check"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading && !isModalOpen ? ( 
          <div className="d-flex justify-content-center align-items-center" style={{minHeight: '400px'}}>
            <div className="text-center">
              <Spinner />
              <p style={{color: '#a0aec0', fontSize: '1.1rem'}} className="mt-3">Đang tải danh sách phòng...</p>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#111c44',
            borderRadius: '16px',
            border: '1px solid #1f2a4f',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Table Header */}
            <div style={{
              backgroundColor: '#0f1734',
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #1f2a4f'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="text-white fw-bold mb-0" style={{fontSize: '1.3rem'}}>
                  <i className="fas fa-table me-2" style={{color: '#3b82f6'}}></i>
                  Danh sách phòng
                </h3>
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    backgroundColor: '#111c44',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #1f2a4f'
                  }}>
                    <small style={{color: '#a0aec0'}}>Hiển thị: </small>
                    <span className="text-white fw-bold">{filteredRooms.length}/{rooms.length} phòng</span>
                  </div>
                  {filteredRooms.length > 0 && (
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="selectAll"
                        checked={selectedRooms.length === filteredRooms.length}
                        onChange={handleSelectAll}
                        style={{
                          backgroundColor: selectedRooms.length === filteredRooms.length ? '#3b82f6' : 'transparent',
                          borderColor: '#3b82f6'
                        }}
                      />
                      <label className="form-check-label text-white ms-2" htmlFor="selectAll">
                        Chọn tất cả
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr style={{borderBottom: '2px solid #1f2a4f', backgroundColor: '#0f1734'}}>
                      <th className="border-0 py-4" style={{width: '50px', backgroundColor: 'rgb(15, 23, 52)'}}>
                        <i className="fas fa-check-square" style={{color: '#3b82f6'}}></i>
                      </th>
                      <th className="border-0 py-4" style={{
                        backgroundColor: 'transparent', 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-hashtag me-2" style={{color: '#3b82f6'}}></i>
                        Mã phòng
                      </th>
                      <th className="border-0 py-4" style={{
                        backgroundColor: 'transparent', 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-bed me-2" style={{color: '#3b82f6'}}></i>
                        Tên phòng
                      </th>
                      <th className="border-0 py-4" style={{
                        backgroundColor: 'transparent', 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-tag me-2" style={{color: '#3b82f6'}}></i>
                        Loại phòng
                      </th>
                      <th className="border-0 py-4" style={{
                        backgroundColor: 'transparent', 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-money-bill-wave me-2" style={{color: '#3b82f6'}}></i>
                        Giá
                      </th>
                      <th className="border-0 py-4" style={{
                        backgroundColor: 'transparent', 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-building me-2" style={{color: '#3b82f6'}}></i>
                        Tầng
                      </th>
                      <th className="border-0 py-4" style={{
                        backgroundColor: 'transparent', 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-circle me-2" style={{color: '#3b82f6'}}></i>
                        Trạng thái
                      </th>
                      <th className="border-0 pe-4 py-4 text-center" style={{
                        backgroundColor: 'transparent', 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-cogs me-2" style={{color: '#3b82f6'}}></i>
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <div className="py-5">
                            <div className="mb-4">
                              <i className="fas fa-search" style={{fontSize: '5rem', color: '#3b82f6', opacity: 0.2}}></i>
                            </div>
                            <h4 className="text-white mb-3">
                              {rooms.length === 0 ? 'Chưa có phòng nào' : 'Không tìm thấy phòng phù hợp'}
                            </h4>
                            <p style={{color: '#a0aec0', fontSize: '1.1rem'}} className="mb-0">
                              {rooms.length === 0 
                                ? 'Hệ thống chưa có phòng nào được cấu hình. Vui lòng thêm phòng mới.'
                                : 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để xem kết quả khác.'
                              }
                            </p>
                            {rooms.length > 0 && (
                              <Button
                                className="btn mt-3"
                                onClick={clearFilters}
                                style={{
                                  backgroundColor: '#3b82f6',
                                  border: '1px solid #3b82f6',
                                  color: '#ffffff'
                                }}
                              >
                                <i className="fas fa-times me-2"></i>Xóa bộ lọc
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRooms.map((room, index) => {
                        const statusInfo = getStatusColor(room.TinhTrang);
                        return (
                          <tr key={room._id} style={{
                            borderBottom: '1px solid #1f2a4f',
                            transition: 'all 0.3s ease',
                            backgroundColor: selectedRooms.includes(room._id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                          }} className="hover-row"> 
                            <td className="ps-4 py-4">
                              <div className="form-check">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  checked={selectedRooms.includes(room._id)}
                                  onChange={() => handleSelectRoom(room._id)}
                                  style={{
                                    backgroundColor: selectedRooms.includes(room._id) ? '#3b82f6' : 'transparent',
                                    borderColor: '#3b82f6'
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="d-flex align-items-center">
                                <div style={{
                                  position: 'relative',
                                  marginRight: '1rem'
                                }}>
                                  <img 
                                    src={getRoomImageUrl(room.HinhAnh)} 
                                    alt={room.TenPhong}
                                    className="rounded-3"
                                    style={{
                                      width: '40px', 
                                      height: '40px', 
                                      objectFit: 'cover',
                                      border: '2px solid #1f2a4f'
                                    }}
                                    onError={(e) => {
                                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjM2I4MmY2Ii8+Cjx0ZXh0IHg9IjIwIiB5PSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UjwvdGV4dD4KPHN2Zz4K";
                                    }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '-3px',
                                    right: '-3px',
                                    width: '15px',
                                    height: '15px',
                                    backgroundColor: statusInfo.color,
                                    borderRadius: '50%',
                                    border: '2px solid #111c44'
                                  }}></div>
                                </div>
                                <div>
                                  <div style={{color: '#000000', fontWeight: 'bold', fontSize: '1.1rem'}}>
                                    {room.MaPhong}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="text-dark mb-1" style={{color: '#000000 !important'}}>{room.TenPhong}</div>
                              {room.MoTa && (
                                <small style={{color: '#666666', fontSize: '0.85rem'}}>
                                  {room.MoTa.length > 30 ? `${room.MoTa.substring(0, 30)}...` : room.MoTa}
                                </small>
                              )}
                            </td>
                            <td className="py-4">
                              <span style={{
                                backgroundColor: '#0f1734',
                                color: '#3b82f6',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                border: '1px solid #1f2a4f'
                              }}>
                                {room.LoaiPhong}
                              </span>
                            </td>
                            <td className="py-4">
                              <div style={{color: '#000000', fontWeight: 'bold', fontSize: '1.1rem'}}>
                                {formatCurrency(room.GiaPhong)}
                              </div>
                              {room.DienTich && (
                                <small style={{color: '#666666'}}>
                                  <i className="fas fa-expand-arrows-alt me-1"></i>
                                  {room.DienTich}m²
                                </small>
                              )}
                            </td>
                            <td className="py-4">
                              <div style={{color: '#000000', fontWeight: '600'}}>
                                <i className="fas fa-building me-2" style={{color: '#3b82f6'}}></i>
                                Tầng {room.Tang}
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="dropdown">
                                <span 
                                  style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    backgroundColor: statusInfo.bg,
                                    color: statusInfo.color,
                                    border: `1px solid ${statusInfo.color}`,
                                    cursor: 'pointer'
                                  }}
                                  data-bs-toggle="dropdown"
                                  title="Click để thay đổi trạng thái"
                                >
                                  <i className={`fas ${statusInfo.icon} me-1`}></i>
                                  {statusInfo.text}
                                  <i className="fas fa-chevron-down ms-2" style={{fontSize: '0.7rem'}}></i>
                                </span>
                                <ul className="dropdown-menu" style={{
                                  backgroundColor: '#111c44',
                                  border: '1px solid #1f2a4f'
                                }}>
                                  <li><a className="dropdown-item text-white" href="#" onClick={() => handleQuickStatusUpdate(room._id, 'Trống', room.MaPhong)}>🟢 Sẵn sàng</a></li>
                                  <li><a className="dropdown-item text-white" href="#" onClick={() => handleQuickStatusUpdate(room._id, 'Đang dọn dẹp', room.MaPhong)}>🟡 Đang dọn</a></li>
                                  <li><a className="dropdown-item text-white" href="#" onClick={() => handleQuickStatusUpdate(room._id, 'Đang sử dụng', room.MaPhong)}>🔵 Có khách</a></li>
                                  <li><a className="dropdown-item text-white" href="#" onClick={() => handleQuickStatusUpdate(room._id, 'Bảo trì', room.MaPhong)}>⚙️ Bảo trì</a></li>
                                  <li><a className="dropdown-item text-white" href="#" onClick={() => handleQuickStatusUpdate(room._id, 'Hư', room.MaPhong)}>🔴 Hư hỏng</a></li>
                                </ul>
                              </div>
                            </td>
                            <td className="pe-4 py-4 text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <Button 
                                  className="btn border-0 px-3 py-2" 
                                  onClick={() => handleViewDetails(room)}
                                  disabled={loading} 
                                  title="Xem chi tiết phòng"
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#28a745',
                                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                    border: '1px solid rgba(40, 167, 69, 0.3)',
                                    borderRadius: '6px',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                </Button>
                                <Button 
                                  className="btn border-0 px-3 py-2" 
                                  onClick={() => handleOpenEditModal(room)}
                                  disabled={loading} 
                                  title="Chỉnh sửa thông tin phòng"
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#3b82f6',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '6px',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chỉnh sửa phòng */}
      {/* Modal Chỉnh sửa phòng (ĐÃ CẬP NHẬT BỐ CỤC) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={`Chỉnh sửa thông tin phòng: ${selectedRoom?.TenPhong || ''}`}
        style={{
          content: {
            backgroundColor: '#111c44',
            border: '1px solid #1f2a4f',
            color: '#ffffff',
            maxWidth: '800px', // Làm modal rộng hơn
            width: '90%'
          }
        }}
      >
        <div style={{backgroundColor: '#111c44', color: '#ffffff'}}>
          <form onSubmit={handleSaveRoom}>
            
            {/* Bố cục 2 cột mới */}
            <div className="row g-4">
              
              {/* CỘT TRÁI: Ảnh và Mô tả */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label" style={{color: '#a0aec0'}}>Xem trước ảnh</label>
                  <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #1f2a4f',
                    backgroundColor: '#0f1734',
                    height: '250px' // Đặt chiều cao cố định
                  }}>
                    <img 
                      src={formData.HinhAnh ? `${API_BASE_URL}/assets/images/room/${formData.HinhAnh}` : `${API_BASE_URL}/assets/images/room/default.jpg`} 
                      alt="Xem trước"
                      style={{
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Ảnh dự phòng khi lỗi
                        e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIwLjMiLz4KPHRleHQgeD0iMjAwIiB5PSIxMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwg" +
                                         "c2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFuaCBwaMOybmc8L3RleHQ+Cjwvc3ZnPg==";
                      }}
                    />
                  </div>
                </div>
                
                <InputField 
                  label="Tên tệp ảnh (ví dụ: deluxe_p203.jpg)" 
                  name="HinhAnh" 
                  value={formData.HinhAnh}
                  onChange={handleFormChange}
                  style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
                />
                
                <div className="mt-3">
                  <InputField 
                    label="Mô tả" 
                    name="MoTa" 
                    type="textarea"
                    rows={5} // Tăng số dòng
                    value={formData.MoTa}
                    onChange={handleFormChange}
                    style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
                  />
                </div>
              </div>

              {/* CỘT PHẢI: Thông tin chính */}
              <div className="col-md-6">
                {/* Tên phòng */}
                <div className="mb-3">
                  <InputField 
                    label="Tên phòng" 
                    name="TenPhong" 
                    value={formData.TenPhong}
                    onChange={handleFormChange}
                    required
                    style={{
                      backgroundColor: '#0f1734', 
                      color: '#ffffff', 
                      border: '1px solid #1f2a4f',
                      fontSize: '1.2rem', // Làm nổi bật
                      fontWeight: 'bold'
                    }}
                  />
                </div>

                {/* Khối thông tin chi tiết */}
                <div style={{
                  backgroundColor: '#0f1734',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #1f2a4f',
                  marginBottom: '1.5rem'
                }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <InputField 
                        label="Mã phòng" 
                        name="MaPhong"
                        value={formData.MaPhong} 
                        onChange={handleFormChange}
                        required
                        disabled // Không cho sửa mã phòng
                        style={{backgroundColor: '#0b1426', color: '#a0aec0', border: '1px solid #1f2a4f'}}
                      />
                    </div>
                    <div className="col-md-6">
                      <InputField 
                        label="Loại phòng" 
                        name="LoaiPhong"
                        value={formData.LoaiPhong}
                        onChange={handleFormChange}
                        required
                        style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
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
                        style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
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
                        style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
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
                        style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
                      />
                    </div>
                    <div className="col-md-6">
                      <InputField 
                        label="Loại giường" 
                        name="LoaiGiuong"
                        value={formData.LoaiGiuong} 
                        onChange={handleFormChange}
                        style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
                      />
                    </div>
                    <div className="col-12">
                      <InputField 
                        label="Diện tích (m²)" 
                        type="number" 
                        name="DienTich" 
                        value={formData.DienTich}
                        onChange={handleFormChange}
                        style={{backgroundColor: '#0f1734', color: '#ffffff', border: '1px solid #1f2a4f'}}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Trạng thái phòng */}
                <div>
                  <h5 className="text-white mb-3">
                    <i className="fas fa-edit me-2" style={{color: '#3b82f6'}}></i>
                    Trạng thái phòng
                  </h5>
                  <select 
                    className="form-select"
                    name="TinhTrang"
                    value={formData.TinhTrang}
                    onChange={handleFormChange}
                    style={{
                      backgroundColor: '#0f1734', 
                      color: '#ffffff', 
                      border: '1px solid #1f2a4f',
                      padding: '0.75rem' // Làm cho to hơn
                    }}
                  >
                    <option value="Trống">🟢 Trống (Sẵn sàng)</option>
                    <option value="Đang dọn dẹp">🟡 Đang dọn dẹp</option>
                    <option value="Đang sử dụng">🔵 Đang sử dụng</option>
                    <option value="Đã đặt">📋 Đã đặt</option>
                    <option value="Bảo trì">⚙️ Bảo trì</option>
                    <option value="Hư">🔴 Hư hỏng</option>
                  </select>
                </div>
              </div>
            </div>
            
            {error && <div className="alert alert-danger mt-4">{error}</div>}

            <div className="text-end mt-4 pt-4" style={{borderTop: '1px solid #1f2a4f'}}>
              <Button 
                type="button" 
                className="btn me-2" 
                onClick={handleCloseModal} 
                disabled={loading}
                style={{
                  backgroundColor: '#6c757d',
                  border: '1px solid #6c757d',
                  color: '#ffffff'
                }}
              >
                  Hủy
              </Button>
              <Button 
                type="submit" 
                className="btn" 
                disabled={loading}
                style={{
                  backgroundColor: '#3b82f6',
                  border: '1px solid #3b82f6',
                  color: '#ffffff'
                }}
              >
                  {loading ? <Spinner size="sm" /> : 'Cập nhật thông tin'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Chi Tiết Phòng */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={handleCloseDetailModal} 
        title={`Chi tiết phòng: ${selectedRoom?.TenPhong || ''}`}
        style={{
          content: {
            backgroundColor: '#111c44',
            border: '1px solid #1f2a4f',
            color: '#ffffff',
            maxWidth: '800px',
            width: '90%'
          }
        }}
      >
        {selectedRoom && (
          <div style={{backgroundColor: '#111c44', color: '#ffffff'}}>
            <div className="row">
              {/* Room Image */}
              <div className="col-md-6 mb-4">
                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid #1f2a4f'
                }}>
                  <img 
                    src={getRoomImageUrl(selectedRoom.HinhAnh)} 
                    alt={selectedRoom.TenPhong}
                    style={{
                      width: '100%', 
                      height: '300px', 
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM2I4MmY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Sb29tIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: getStatusColor(selectedRoom.TinhTrang).bg,
                    color: getStatusColor(selectedRoom.TinhTrang).color,
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    border: `1px solid ${getStatusColor(selectedRoom.TinhTrang).color}`
                  }}>
                    <i className={`fas ${getStatusColor(selectedRoom.TinhTrang).icon} me-2`}></i>
                    {getStatusColor(selectedRoom.TinhTrang).text}
                  </div>
                </div>
              </div>

              {/* Room Details */}
              <div className="col-md-6">
                <div className="mb-4">
                  <h3 className="text-white fw-bold mb-3">
                    <i className="fas fa-bed me-2" style={{color: '#3b82f6'}}></i>
                    {selectedRoom.TenPhong}
                  </h3>
                  <div style={{
                    backgroundColor: '#0f1734',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #1f2a4f'
                  }}>
                    <div className="row g-3">
                      <div className="col-6">
                        <small style={{color: '#a0aec0'}}>Mã phòng</small>
                        <div className="text-white fw-bold">{selectedRoom.MaPhong}</div>
                      </div>
                      <div className="col-6">
                        <small style={{color: '#a0aec0'}}>Loại phòng</small>
                        <div className="text-white fw-bold">{selectedRoom.LoaiPhong}</div>
                      </div>
                      <div className="col-6">
                        <small style={{color: '#a0aec0'}}>Tầng</small>
                        <div className="text-white fw-bold">
                          <i className="fas fa-building me-1"></i>
                          Tầng {selectedRoom.Tang}
                        </div>
                      </div>
                      <div className="col-6">
                        <small style={{color: '#a0aec0'}}>Giá phòng</small>
                        <div className="text-white fw-bold" style={{color: '#28a745'}}>
                          {formatCurrency(selectedRoom.GiaPhong)}
                        </div>
                      </div>
                      <div className="col-6">
                        <small style={{color: '#a0aec0'}}>Số giường</small>
                        <div className="text-white fw-bold">
                          <i className="fas fa-bed me-1"></i>
                          {selectedRoom.SoGiuong} giường
                        </div>
                      </div>
                      <div className="col-6">
                        <small style={{color: '#a0aec0'}}>Loại giường</small>
                        <div className="text-white fw-bold">{selectedRoom.LoaiGiuong || 'Không xác định'}</div>
                      </div>
                      <div className="col-12">
                        <small style={{color: '#a0aec0'}}>Diện tích</small>
                        <div className="text-white fw-bold">
                          <i className="fas fa-expand-arrows-alt me-1"></i>
                          {selectedRoom.DienTich || 'Không xác định'}m²
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room Amenities */}
                <div className="mb-4">
                  <h5 className="text-white mb-3">
                    <i className="fas fa-star me-2" style={{color: '#ffc107'}}></i>
                    Tiện nghi phòng
                  </h5>
                  <div className="d-flex flex-wrap gap-2">
                    <span style={{
                      backgroundColor: 'rgba(40, 167, 69, 0.2)',
                      color: '#28a745',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      border: '1px solid #28a745'
                    }}>
                      <i className="fas fa-wifi me-1"></i>WiFi miễn phí
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(23, 162, 184, 0.2)',
                      color: '#17a2b8',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      border: '1px solid #17a2b8'
                    }}>
                      <i className="fas fa-tv me-1"></i>TV màn hình phẳng
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(255, 193, 7, 0.2)',
                      color: '#ffc107',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      border: '1px solid #ffc107'
                    }}>
                      <i className="fas fa-snowflake me-1"></i>Điều hòa
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(220, 53, 69, 0.2)',
                      color: '#dc3545',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      border: '1px solid #dc3545'
                    }}>
                      <i className="fas fa-bath me-1"></i>Phòng tắm riêng
                    </span>
                  </div>
                </div>

                {/* Quick Status Update */}
                <div>
                  <h5 className="text-white mb-3">
                    <i className="fas fa-edit me-2" style={{color: '#3b82f6'}}></i>
                    Cập nhật trạng thái
                  </h5>
                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      className="btn btn-sm"
                      onClick={() => handleQuickStatusUpdate(selectedRoom._id, 'Trống', selectedRoom.MaPhong)}
                      style={{
                        backgroundColor: selectedRoom.TinhTrang === 'Trống' ? '#28a745' : 'rgba(40, 167, 69, 0.2)',
                        border: '1px solid #28a745',
                        color: selectedRoom.TinhTrang === 'Trống' ? '#ffffff' : '#28a745'
                      }}
                    >
                      🟢 Sẵn sàng
                    </Button>
                    <Button
                      className="btn btn-sm"
                      onClick={() => handleQuickStatusUpdate(selectedRoom._id, 'Đang dọn dẹp', selectedRoom.MaPhong)}
                      style={{
                        backgroundColor: selectedRoom.TinhTrang === 'Đang dọn dẹp' ? '#ffc107' : 'rgba(255, 193, 7, 0.2)',
                        border: '1px solid #ffc107',
                        color: selectedRoom.TinhTrang === 'Đang dọn dẹp' ? '#ffffff' : '#ffc107'
                      }}
                    >
                      🟡 Đang dọn
                    </Button>
                    <Button
                      className="btn btn-sm"
                      onClick={() => handleQuickStatusUpdate(selectedRoom._id, 'Đang sử dụng', selectedRoom.MaPhong)}
                      style={{
                        backgroundColor: selectedRoom.TinhTrang === 'Đang sử dụng' ? '#17a2b8' : 'rgba(23, 162, 184, 0.2)',
                        border: '1px solid #17a2b8',
                        color: selectedRoom.TinhTrang === 'Đang sử dụng' ? '#ffffff' : '#17a2b8'
                      }}
                    >
                      🔵 Có khách
                    </Button>
                    <Button
                      className="btn btn-sm"
                      onClick={() => handleQuickStatusUpdate(selectedRoom._id, 'Bảo trì', selectedRoom.MaPhong)}
                      style={{
                        backgroundColor: selectedRoom.TinhTrang === 'Bảo trì' ? '#6c757d' : 'rgba(108, 117, 125, 0.2)',
                        border: '1px solid #6c757d',
                        color: selectedRoom.TinhTrang === 'Bảo trì' ? '#ffffff' : '#6c757d'
                      }}
                    >
                      ⚙️ Bảo trì
                    </Button>
                    <Button
                      className="btn btn-sm"
                      onClick={() => handleQuickStatusUpdate(selectedRoom._id, 'Hư', selectedRoom.MaPhong)}
                      style={{
                        backgroundColor: selectedRoom.TinhTrang === 'Hư' ? '#dc3545' : 'rgba(220, 53, 69, 0.2)',
                        border: '1px solid #dc3545',
                        color: selectedRoom.TinhTrang === 'Hư' ? '#ffffff' : '#dc3545'
                      }}
                    >
                      🔴 Hư hỏng
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Description */}
            {selectedRoom.MoTa && (
              <div className="mt-4">
                <h5 className="text-white mb-3">
                  <i className="fas fa-info-circle me-2" style={{color: '#17a2b8'}}></i>
                  Mô tả phòng
                </h5>
                <div style={{
                  backgroundColor: '#0f1734',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #1f2a4f'
                }}>
                  <p style={{color: '#a0aec0', margin: 0, lineHeight: '1.6'}}>
                    {selectedRoom.MoTa}
                  </p>
                </div>
              </div>
            )}

            <div className="text-end mt-4">
              <Button 
                type="button" 
                className="btn me-2" 
                onClick={handleCloseDetailModal}
                style={{
                  backgroundColor: '#6c757d',
                  border: '1px solid #6c757d',
                  color: '#ffffff'
                }}
              >
                  Đóng
              </Button>
              <Button 
                type="button" 
                className="btn" 
                onClick={() => {
                  handleCloseDetailModal();
                  handleOpenEditModal(selectedRoom);
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  border: '1px solid #3b82f6',
                  color: '#ffffff'
                }}
              >
                <i className="fas fa-edit me-2"></i>
                Chỉnh sửa thông tin
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// CSS styles for enhanced interactions
const styles = `
  .hover-row:hover {
    background-color: rgba(59, 130, 246, 0.05) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .dropdown-item:hover {
    background-color: rgba(59, 130, 246, 0.1) !important;
    color: #ffffff !important;
  }
  
  .form-check-input:checked {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }
  
  .table-responsive {
    border-radius: 0 0 16px 16px;
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default RoomsManager;