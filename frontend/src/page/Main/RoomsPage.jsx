// src/pages/RoomsPage.jsx
import React, { useState, useEffect } from 'react';
import { getAllRooms } from '../../services/roomService';
import RoomCard from '../../components/rooms/RoomCard';
import Spinner from '../../components/common/Spinner';
import { useNavigate } from 'react-router-dom';

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    roomType: '',
    floor: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    hasPromotion: false
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== false))
      });
      const data = await getAllRooms(params.toString());
      // Support multiple response shapes:
      // - paginated: { data: [...], pages: N }
      // - array: [...]
      if (Array.isArray(data)) {
        setRooms(data);
        setTotalPages(1);
      } else if (data && Array.isArray(data.data)) {
        setRooms(data.data);
        setTotalPages(Number(data.pages) || 1);
      } else {
        console.warn('fetchRooms: unexpected response shape', data);
        setRooms([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filters, page]);

  const handleBook = (roomId) => {
    navigate(`/booking?room=${roomId}`);
  };

  return (
    <div className="container padding-large">
      <h1 className="display-3 fw-normal text-center mb-4">Tìm phòng lý tưởng</h1>

      {/* Bộ lọc */}
      <div className="card p-4 mb-5 shadow-sm">
        <div className="row g-3">
          <div className="col-md-4">
            <input
              type="text"
              placeholder="Tìm tên/mã phòng..."
              className="form-control"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={filters.roomType} onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}>
              <option value="">Loại phòng</option>
              <option>Standard</option>
              <option>Deluxe</option>
              <option>Suite</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={filters.floor} onChange={(e) => setFilters({ ...filters, floor: e.target.value })}>
              <option value="">Tầng</option>
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Tình trạng</option>
              <option>Available</option>
              <option>Booked</option>
            </select>
          </div>
          <div className="col-md-2">
            <div className="form-check mt-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={filters.hasPromotion}
                onChange={(e) => setFilters({ ...filters, hasPromotion: e.target.checked })}
              />
              <label className="form-check-label">Có KM</label>
            </div>
          </div>
        </div>
        <div className="row g-3 mt-2">
          <div className="col-md-3">
            <input type="number" placeholder="Giá từ" className="form-control" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
          </div>
          <div className="col-md-3">
            <input type="number" placeholder="Giá đến" className="form-control" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100" onClick={() => setPage(1)}>Áp dụng</button>
          </div>
        </div>
      </div>

      {/* Danh sách phòng */}
      {loading ? <Spinner /> : (
        <>
          <div className="row g-4">
            {rooms.map(room => (
              <div className="col-lg-4 col-md-6" key={room._id}>
                <RoomCard room={room} onBook={() => handleBook(room._id)} />
              </div>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5 gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`btn ${page === i + 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RoomsPage;