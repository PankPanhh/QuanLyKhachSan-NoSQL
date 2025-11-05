// src/page/Admin/UsersManager.jsx
import React, { useEffect, useState } from 'react';
import {
  apiAdminListUsers,
  apiAdminUpdateUserStatus,
  apiAdminAddPoints,
  apiAdminAddPointsByRevenue,
  apiAdminAddPointsByBookings,
  apiAdminRecalcTier
} from '../../services/adminUsers.js'; // Đã sửa đường dẫn

// Import các component UI chung
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
// Xóa import react-icons/fa

function UsersManager() {
  // const accent = '#D16806'; // Xóa

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [rank, setRank] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Giữ nguyên limit, logic phân trang (nếu có) không bị ảnh hưởng
  const [loading, setLoading] = useState(false);
  
  // State thông báo chuẩn
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const resetFilters = () => {
    setQ('');
    setRole('');
    setRank('');
    setStatus('');
    setSort('date_desc');
    setMinPoints('');
    setMaxPoints('');
    setPage(1);
  };

  const load = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const data = await apiAdminListUsers({
        q, role, rank, status, sort, page, limit,
        ...(minPoints ? { minPoints } : {}),
        ...(maxPoints ? { maxPoints } : {})
      });
      setRows(data.items || []);
    } catch (e) {
      setError(e?.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, role, rank, status, sort, page]);

  // --- Logic hàm xử lý (Giữ nguyên, chỉ đổi thông báo) ---
  const doStatus = async (id, TrangThai) => {
    try {
      await apiAdminUpdateUserStatus(id, TrangThai);
      showSuccessMessage('Cập nhật trạng thái thành công');
      load();
    } catch (e) {
      setError(e?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const doAddPoints = async (id) => {
    const delta = Number(prompt('Nhập số điểm cộng thêm:', '100'));
    if (!delta || Number.isNaN(delta)) return;
    try {
      await apiAdminAddPoints(id, delta);
      showSuccessMessage(`Đã cộng ${delta} điểm`);
      load();
    } catch (e) {
      setError(e?.message || 'Lỗi cộng điểm');
    }
  };

  const doAddRevenue = async (id) => {
    const amt = Number(prompt('Nhập doanh thu (VND):', '1000000'));
    if (!amt || Number.isNaN(amt)) return;
    try {
      await apiAdminAddPointsByRevenue(id, amt);
      showSuccessMessage(`Đã cộng điểm theo doanh thu ${amt.toLocaleString('vi-VN')} VND`);
      load();
    } catch (e) {
      setError(e?.message || 'Lỗi cộng điểm theo doanh thu');
    }
  };

  const doAddBookings = async (id) => {
    const cnt = Number(prompt('Nhập số lần đặt phòng:', '1'));
    if (!cnt || Number.isNaN(cnt)) return;
    try {
      await apiAdminAddPointsByBookings(id, cnt);
      showSuccessMessage(`Đã cộng điểm theo ${cnt} lần đặt phòng`);
      load();
    } catch (e) {
      setError(e?.message || 'Lỗi cộng điểm theo lượt đặt');
    }
  };

  const doRecalc = async (id) => {
    try {
      await apiAdminRecalcTier(id);
      showSuccessMessage('Đã tính lại hạng theo điểm hiện tại');
      load();
    } catch (e) {
      setError(e?.message || 'Lỗi tính lại hạng');
    }
  };

  // --- Hàm render (Cập nhật sang bg-label-*) ---
  
  const renderStatus = (s) => {
    if (s === 'Hoạt động') return <span className="badge bg-label-success">Hoạt động</span>;
    if (s === 'Bị khóa') return <span className="badge bg-label-danger">Bị khóa</span>;
    return <span className="badge bg-label-secondary">{s || '—'}</span>;
  };

  const renderRole = (r) => {
    if (r === 'Admin') return <span className="badge bg-label-primary">Admin</span>;
    if (r === 'NhanVien') return <span className="badge bg-label-info">Nhân viên</span>;
    return <span className="badge bg-label-secondary">Khách hàng</span>;
  };

  const renderRank = (r) => {
    if (r === 'Platinum') return <span className="badge bg-label-dark">Platinum</span>;
    if (r === 'Gold') return <span className="badge bg-label-warning">Gold</span>;
    return <span className="badge bg-label-secondary">Silver</span>;
  };

  // Tính toán stats
  const stats = {
    total: rows.length,
    active: rows.filter(r => r.TrangThai === 'Hoạt động').length,
    locked: rows.filter(r => r.TrangThai === 'Bị khóa').length,
    staff: rows.filter(r => r.VaiTro === 'Admin' || r.VaiTro === 'NhanVien').length,
  };

  return (
    <div className="container-fluid px-0">
      {/* Xóa thẻ <style> tùy chỉnh */}

      {/* Thông báo chuẩn */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <i className="bx bx-check-circle me-2"></i>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bx bx-error-circle me-2"></i>
          {error}
        </div>
      )}
      
      {/* Thẻ thống kê (Mới) */}
      {!loading && (
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-group"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Tổng người dùng</span>
                <h3 className="card-title mb-2">{stats.total}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="bx bx-user-check"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Hoạt động</span>
                <h3 className="card-title mb-2">{stats.active}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-danger">
                      <i className="bx bx-user-x"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Bị khóa</span>
                <h3 className="card-title mb-2">{stats.locked}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-briefcase-alt"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Nhân viên/Admin</span>
                <h3 className="card-title mb-2">{stats.staff}</h3>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Thẻ Filter (Cập nhật) */}
      <div className="card mb-4">
        <div className="card-header">
           <h5 className="card-title mb-0">Bộ lọc và Tìm kiếm</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6">
              <label className="form-label">Tìm kiếm</label>
              <input
                className="form-control"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Tìm tên / email / SĐT"
              />
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label">Vai trò</label>
              <select className="form-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
                <option value="">Tất cả vai trò</option>
                <option value="KhachHang">Khách hàng</option>
                <option value="NhanVien">Nhân viên</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label">Hạng</label>
              <select className="form-select" value={rank} onChange={(e) => { setRank(e.target.value); setPage(1); }}>
                <option value="">Tất cả hạng</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">Tất cả trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Bị khóa">Bị khóa</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">Sắp xếp</label>
              <select className="form-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="date_desc">Mới nhất</option>
                <option value="date_asc">Cũ nhất</option>
                <option value="name_asc">Tên A-Z</option>
                <option value="name_desc">Tên Z-A</option>
                <option value="points_desc">Điểm cao → thấp</option>
                <option value="points_asc">Điểm thấp → cao</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">Điểm tối thiểu</label>
              <input
                className="form-control"
                type="number"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                placeholder="Min điểm"
              />
            </div>
            
            <div className="col-lg-3 col-md-6">
              <label className="form-label">Điểm tối đa</label>
              <input
                className="form-control"
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                placeholder="Max điểm"
              />
            </div>

            <div className="col-lg-3 col-md-12 d-flex gap-2">
              <Button className="btn btn-primary flex-fill" onClick={() => { setPage(1); load(); }} disabled={loading}>
                <i className="bx bx-filter-alt me-1"></i> Lọc
              </Button>
              <Button className="btn btn-outline-secondary flex-fill" onClick={resetFilters} disabled={loading}>
                <i className="bx bx-x me-1"></i> Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Thẻ Bảng (Cập nhật) */}
      <div className="card">
        <div className="card-header">
           <h5 className="card-title mb-0">Danh sách người dùng</h5>
        </div>
        
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
            <Spinner />
          </div>
        ) : (
          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Hạng</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th style={{ minWidth: 280 }}>Hành động</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {(rows || []).map((r) => (
                  <tr key={r._id}>
                    <td><span className="fw-semibold">{r.HoTen}</span></td>
                    <td>{r.Email}</td>
                    <td>{renderRole(r.VaiTro)}</td>
                    <td>{renderRank(r.HangThanhVien)}</td>
                    <td>{(r.DiemTichLuy || 0).toLocaleString('vi-VN')}</td>
                    <td>{renderStatus(r.TrangThai)}</td>
                    <td>
                      {/* Cập nhật Action buttons */}
                      <div className="d-flex gap-1">
                        {r.TrangThai === 'Hoạt động' ? (
                          <Button
                            className="btn btn-icon btn-sm btn-outline-danger"
                            title="Khoá tài khoản"
                            onClick={() => doStatus(r._id, 'Bị khóa')}
                          >
                            <i className="bx bx-lock-alt" />
                          </Button>
                        ) : (
                          <Button
                            className="btn btn-icon btn-sm btn-outline-success"
                            title="Mở khoá tài khoản"
                            onClick={() => doStatus(r._id, 'Hoạt động')}
                          >
                            <i className="bx bx-unlock-alt" />
                          </Button>
                        )}

                        <Button
                          className="btn btn-icon btn-sm btn-outline-primary"
                          title="+ Điểm"
                          onClick={() => doAddPoints(r._id)}
                        >
                          <i className="bx bx-plus" />
                        </Button>

                        <Button
                          className="btn btn-icon btn-sm btn-outline-warning"
                          title="+ Doanh thu"
                          onClick={() => doAddRevenue(r._id)}
                        >
                          <i className="bx bx-dollar" />
                        </Button>

                        <Button
                          className="btn btn-icon btn-sm btn-outline-info"
                          title="+ Lượt đặt"
                          onClick={() => doAddBookings(r._id)}
                        >
                          <i className="bx bx-bell" />
                        </Button>

                        <Button
                          className="btn btn-icon btn-sm btn-outline-dark"
                          title="Tính lại hạng"
                          onClick={() => doRecalc(r._id)}
                        >
                          <i className="bx bx-sync" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <h5 className="text-muted">Không có dữ liệu</h5>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersManager;