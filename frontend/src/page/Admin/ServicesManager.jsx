import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Import các component UI chung
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null); // Đã có state error mới
  const [statsMap, setStatsMap] = useState({});
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'create' | 'delete'
  const [modalService, setModalService] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [modalFilePreview, setModalFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  // const [confirmDeleting, setConfirmDeleting] = useState(false); // Đã loại bỏ, dùng modalMode

  // State thông báo chuẩn
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // --- LOGIC GỐC (GIỮ NGUYÊN, CHỈ THAY THẾ ALERT) ---

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null); // Reset lỗi
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${base}/api/v1/services`);

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} - ${text.slice(0, 200)}`);
        }

        if (!contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error('Server did not return JSON. Response preview: ' + text.slice(0, 500));
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        if (mounted) setServices(list);
        
        try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const statsPromises = list.map((s) => fetch(`${base}/api/v1/services/${encodeURIComponent(s._id || s.MaDichVu)}/stats`, { headers }).then((r) => r.ok ? r.json() : { success: false }).catch(() => ({ success: false })));
          const statsResults = await Promise.allSettled(statsPromises);
          const map = {};
          statsResults.forEach((res, idx) => {
            if (res.status === 'fulfilled' && res.value && res.value.success !== false) {
              map[list[idx]._id || list[idx].MaDichVu] = res.value.data || res.value;
            } else {
              map[list[idx]._id || list[idx].MaDichVu] = { bookingsCount: 0, totalQuantity: 0, totalRevenue: 0 };
            }
          });
          if (mounted) setStatsMap(map);
        } catch (e) {
          // ignore stats errors
        }
      } catch (err) {
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchServices();
    return () => { mounted = false; };
  }, []);

  const priceFmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

  const [deletingId, setDeletingId] = useState(null);

  const deleteService = async (svc) => {
    const id = svc._id || svc.MaDichVu;
    if (!id) return setError('Không có id để xóa');
    // if (!confirm(`Bạn có chắc muốn xóa dịch vụ "${svc.TenDichVu}" (${svc.MaDichVu}) không?`)) return; // Đã chuyển sang Modal
    try {
      setDeletingId(id);
      const res = await fetch(`${apiBase}/api/v1/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt.slice(0,200)}`);
      }
      setServices((prev) => prev.filter((p) => (p._id || p.MaDichVu) !== id));
      showSuccessMessage(`Đã xóa dịch vụ "${svc.TenDichVu}".`);
    } catch (err) {
      setError('Xóa thất bại: ' + (err.message || String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  // Modal helpers (Đã cập nhật)
  const openEditModal = (s) => {
    const baseObj = s ? { ...s } : { MaDichVu: '', TenDichVu: '', GiaDichVu: 0, DonViTinh: '', MoTaDichVu: '', TrangThai: 'Đang hoạt động', ThoiGianPhucVu: '' };
    setModalService(baseObj);
    setModalMode(s ? 'edit' : 'create');
    setModalFile(null);
    setUploadProgress(0);
    if (modalFilePreview) {
      try { URL.revokeObjectURL(modalFilePreview); } catch (e) {}
    }
    if (s && s.HinhAnhDichVu) {
      setModalFilePreview(`${apiBase}/assets/images/services/${s.HinhAnhDichVu}`);
    } else {
      setModalFilePreview(null);
    }
    setModalOpen(true);
  };
  
  // openUploadModal đã được tích hợp vào openEditModal
  
  const openDeleteModal = (s) => { 
    setModalService(s); 
    setModalMode('delete'); 
    setModalOpen(true); 
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setModalService(null);
    setModalFile(null);
    if (modalFilePreview) {
      try { URL.revokeObjectURL(modalFilePreview); } catch (e) {}
    }
    setModalFilePreview(null);
    // setConfirmDeleting(false); // Đã loại bỏ
    setUploadProgress(0);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault(); // Ngăn form submit
    if (!modalService) return;
    const token = localStorage.getItem('token');
    try {
      if (modalMode === 'create') {
        const { MaDichVu, ...serviceData } = modalService;
        const res = await fetch(`${apiBase}/api/v1/services`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(serviceData) });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const created = json.data || json;
        setServices((prev) => [created, ...prev]);
        if (modalFile) {
          await uploadImageFor(created, modalFile, (p) => setUploadProgress(p));
        }
        showSuccessMessage("Tạo dịch vụ mới thành công.");
      } else if (modalMode === 'edit') {
        const id = modalService._id || modalService.MaDichVu;
        const res = await fetch(`${apiBase}/api/v1/services/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(modalService) });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const updated = json.data || json;
        setServices((prev) => prev.map((p) => ((p._id || p.MaDichVu) === (updated._id || updated.MaDichVu) ? { ...p, ...updated } : p)));
        if (modalFile) {
          await uploadImageFor(updated, modalFile, (p) => setUploadProgress(p));
        }
        showSuccessMessage("Cập nhật dịch vụ thành công.");
      }
      closeModal();
    } catch (err) {
      setError('Lưu thất bại: ' + (err.message || String(err)));
    }
  };

  // handleUploadModal đã được tích hợp vào handleSaveModal

  const handleDeleteConfirm = async () => {
    if (!modalService) return closeModal();
    await deleteService(modalService);
    closeModal();
  };

  const toggleStatus = async (s) => {
    const id = s._id || s.MaDichVu;
    const token = localStorage.getItem('token');
    const next = (s.TrangThai === 'Đang hoạt động' ? 'Tạm ngưng' : 'Đang hoạt động');
    setToggleLoadingId(id);
    try {
      const res = await fetch(`${apiBase}/api/v1/services/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ TrangThai: next }) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt.slice(0,200)}`);
      }
      const data = await res.json();
      const updated = data.data || data;
      setServices((prev) => prev.map((p) => ((p._id || p.MaDichVu) === id ? { ...p, TrangThai: updated.TrangThai || next } : p)));
      showSuccessMessage(`Đã cập nhật trạng thái: ${next}`);
    } catch (err) {
      setError('Thay đổi trạng thái thất bại: ' + (err.message || String(err)));
    } finally {
      setToggleLoadingId(null);
    }
  };

  const uploadImageFor = async (s, file, onProgress) => {
    // ... (LOGIC XHR GỐC GIỮ NGUYÊN) ...
    if (!file) return;
    const id = s._id || s.MaDichVu;
    const token = localStorage.getItem('token');
    const fd = new FormData();
    if (s && s.HinhAnhDichVu) {
      try {
        fd.append('existingFilename', s.HinhAnhDichVu);
        fd.append('preserveName', '1');
      } catch (e) {}
    }
    fd.append('image', file, file.name);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', `${apiBase}/api/v1/services/${encodeURIComponent(id)}/image`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          const p = e.loaded / e.total;
          setUploadProgress(p);
          if (typeof onProgress === 'function') onProgress(p);
        }
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText || '{}');
            const newFilename = json.data?.HinhAnhDichVu || (json.data && json.data.HinhAnhDichVu) || json.HinhAnhDichVu;
            if (newFilename) {
              setServices((prev) => prev.map((p) => ((p._id || p.MaDichVu) === id ? { ...p, HinhAnhDichVu: newFilename } : p)));
            }
            resolve(json);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`HTTP ${xhr.status} - ${xhr.responseText.slice ? xhr.responseText.slice(0,200) : xhr.responseText}`));
        }
      };
      xhr.onerror = function () { reject(new Error('Network error')); };
      xhr.send(fd);
    });
  };

  // Helper render trạng thái (mới)
  const getStatusColor = (status) => {
    if (status === 'Đang hoạt động') return { bg: 'bg-label-success', text: 'Hoạt động' };
    if (status === 'Tạm ngưng') return { bg: 'bg-label-danger', text: 'Tạm ngưng' };
    return { bg: 'bg-label-secondary', text: status };
  };

  // Tính toán stats (mới)
  const stats = services.reduce((acc, s) => {
    acc.total++;
    if (s.TrangThai === 'Đang hoạt động') acc.active++;
    else acc.paused++;
    const sStats = statsMap[s._id || s.MaDichVu];
    if (sStats) {
      acc.revenue += sStats.totalRevenue || 0;
    }
    return acc;
  }, { total: 0, active: 0, paused: 0, revenue: 0 });


  // --- JSX ĐÃ CẬP NHẬT ---
  return (
    <div className="container-fluid px-0">
      {/* Thông báo */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Thẻ thống kê */}
      {!loading && (
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-list-ul"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Tổng dịch vụ</span>
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
                      <i className="bx bx-check-circle"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Đang hoạt động</span>
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
                      <i className="bx bx-pause-circle"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Tạm ngưng</span>
                <h3 className="card-title mb-2">{stats.paused}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-dollar-circle"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Doanh thu (ước tính)</span>
                <h3 className="card-title mb-2">{priceFmt(stats.revenue)}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thẻ Bảng chính */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Quản lý Dịch vụ</h5>
          <Button className="btn btn-primary" onClick={() => openEditModal(null)}>
            <i className="bx bx-plus me-1"></i>Tạo dịch vụ mới
          </Button>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Spinner />
            <p className="mt-2 ms-2">Đang tải dịch vụ...</p>
          </div>
        ) : (
          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Mã DV</th>
                  <th>Tên dịch vụ</th>
                  <th>Giá</th>
                  <th>Đơn vị</th>
                  <th>Giờ phục vụ</th>
                  <th>Trạng thái</th>
                  <th>Ảnh</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {services.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <h5 className="text-muted">Chưa có dịch vụ nào</h5>
                    </td>
                  </tr>
                )}
                {services.map((s) => {
                  const statusInfo = getStatusColor(s.TrangThai);
                  return (
                    <tr key={s._id || s.MaDichVu}>
                      <td><span className="fw-semibold">{s.MaDichVu}</span></td>
                      <td>
                        <Link to={`/admin/services/${encodeURIComponent(s._id || s.MaDichVu)}`}>{s.TenDichVu}</Link>
                      </td>
                      <td>
                        <span className="fw-semibold text-dark">{priceFmt(s.GiaDichVu)}</span>
                      </td>
                      <td className="text-nowrap">{s.DonViTinh || '-'}</td>
                      <td className="text-nowrap">{s.ThoiGianPhucVu || '-'}</td>
                      <td>
                        <span 
                          className={`badge ${statusInfo.bg}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleStatus(s)} 
                          disabled={toggleLoadingId === (s._id || s.MaDichVu)}
                        >
                          {toggleLoadingId === (s._id || s.MaDichVu) ? (
                            <Spinner size="sm" />
                          ) : (
                            statusInfo.text
                          )}
                        </span>
                      </td>
                      <td>
                        {s.HinhAnhDichVu ? (
                          <img src={`${apiBase}/assets/images/services/${s.HinhAnhDichVu}`} alt={s.TenDichVu} 
                               style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} 
                               className="shadow-sm" />
                        ) : (
                          <span className="text-muted small">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button className="btn btn-icon btn-sm btn-outline-primary" onClick={() => openEditModal(s)} title="Chỉnh sửa dịch vụ">
                            <i className="bx bx-edit-alt"></i>
                          </Button>
                          <Button className="btn btn-icon btn-sm btn-outline-danger" onClick={() => openDeleteModal(s)} disabled={deletingId === (s._id || s.MaDichVu)} title="Xóa dịch vụ">
                            {deletingId === (s._id || s.MaDichVu) ? (
                              <Spinner size="sm" />
                            ) : (
                              <i className="bx bx-trash"></i>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODALS (Đã chuyển đổi sang Modal chung) --- */}

      {/* Modal Edit/Create */}
      <Modal 
        isOpen={modalOpen && (modalMode === 'edit' || modalMode === 'create')}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Tạo dịch vụ mới' : 'Chỉnh sửa dịch vụ'}
        dialogClassName="modal-lg"
      >
        <form onSubmit={handleSaveModal}>
          <div className="row g-3">
            {modalMode === 'edit' && (
              <div className="col-12">
                <label className="form-label">Mã dịch vụ</label>
                <input
                  className="form-control"
                  value={modalService?.MaDichVu || ''}
                  readOnly
                  disabled
                />
              </div>
            )}
            <div className="col-12">
              <label className="form-label">Tên dịch vụ</label>
              <input className="form-control" value={modalService?.TenDichVu || ''} onChange={(e) => setModalService((m) => ({ ...m, TenDichVu: e.target.value }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Giá</label>
              <input className="form-control" type="number" value={modalService?.GiaDichVu ?? 0} onChange={(e) => setModalService((m) => ({ ...m, GiaDichVu: Number(e.target.value) }))} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Đơn vị tính</label>
              <select className="form-select" value={modalService?.DonViTinh || ''} onChange={(e) => setModalService((m) => ({ ...m, DonViTinh: e.target.value }))} required>
                <option value="">-- Chọn đơn vị --</option>
                <option value="Lần">Lần</option>
                <option value="Giờ">Giờ</option>
                <option value="Ngày">Ngày</option>
                <option value="Kg">Kg</option>
                <option value="Phần">Phần</option>
                <option value="Suất">Suất</option>
                <option value="Chuyến">Chuyến</option>
                <option value="Bộ">Bộ</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Mô tả ngắn</label>
              <textarea className="form-control" rows={3} value={modalService?.MoTaDichVu || ''} onChange={(e) => setModalService((m) => ({ ...m, MoTaDichVu: e.target.value }))} />
            </div>
            <div className="col-12">
              <label className="form-label">Hình ảnh</label>
              <input type="file" accept="image/*" className="form-control" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setModalFile(f);
                if (modalFilePreview) { try { URL.revokeObjectURL(modalFilePreview); } catch (er) {} }
                if (f) {
                  const url = URL.createObjectURL(f);
                  setModalFilePreview(url);
                } else {
                  if (modalService?.HinhAnhDichVu) {
                    setModalFilePreview(`${apiBase}/assets/images/services/${modalService.HinhAnhDichVu}`);
                  } else {
                    setModalFilePreview(null);
                  }
                }
              }} />

              {modalFilePreview && (
                <div className="mt-2">
                  <img src={modalFilePreview} alt="preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                  <div className="small text-muted mt-1">{modalFile ? modalFile.name : (modalService?.HinhAnhDichVu || '')}</div>
                </div>
              )}
              
              {uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="progress" style={{ height: 10 }}>
                    <div className="progress-bar" role="progressbar" style={{ width: `${Math.round(uploadProgress*100)}%` }} aria-valuenow={Math.round(uploadProgress*100)} aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <div className="small text-muted mt-1">Đang upload: {Math.round(uploadProgress*100)}%</div>
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">Giờ bắt đầu phục vụ</label>
              <input 
                type="time" 
                className="form-control" 
                value={modalService?.ThoiGianPhucVu ? modalService.ThoiGianPhucVu.split(' - ')[0] || '' : ''} 
                onChange={(e) => {
                  const startTime = e.target.value;
                  const endTime = modalService?.ThoiGianPhucVu ? modalService.ThoiGianPhucVu.split(' - ')[1] || '' : '';
                  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime;
                  setModalService((m) => ({ ...m, ThoiGianPhucVu: timeRange }));
                }} 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Giờ kết thúc phục vụ</label>
              <input 
                type="time" 
                className="form-control" 
                value={modalService?.ThoiGianPhucVu ? modalService.ThoiGianPhucVu.split(' - ')[1] || '' : ''} 
                onChange={(e) => {
                  const endTime = e.target.value;
                  const startTime = modalService?.ThoiGianPhucVu ? modalService.ThoiGianPhucVu.split(' - ')[0] || '' : '';
                  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : endTime;
                  setModalService((m) => ({ ...m, ThoiGianPhucVu: timeRange }));
                }} 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={modalService?.TrangThai || 'Đang hoạt động'} onChange={(e) => setModalService((m) => ({ ...m, TrangThai: e.target.value }))}>
                <option>Đang hoạt động</option>
                <option>Tạm ngưng</option>
              </select>
            </div>
          </div>
          
          <div className="text-end mt-4 pt-3 border-top">
            <Button type="button" className="btn btn-outline-secondary me-2" onClick={closeModal}>Hủy</Button>
            <Button type="submit" className="btn btn-primary">
              <i className={`fas ${modalMode === 'create' ? 'fa-plus' : 'fa-save'} me-2`}></i>
              {modalMode === 'create' ? 'Tạo dịch vụ' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete */}
      <Modal
        isOpen={modalOpen && modalMode === 'delete'}
        onClose={closeModal}
        title="Xác nhận xóa dịch vụ"
      >
        <div>
          <p>Bạn có chắc muốn xóa dịch vụ <strong className="text-dark">"{modalService?.TenDichVu}"</strong> ({modalService?.MaDichVu}) không?</p>
          <small className="text-danger">Hành động này không thể hoàn tác!</small>
        </div>
        <div className="text-end mt-4 pt-3 border-top">
          <Button type="button" className="btn btn-outline-secondary me-2" onClick={closeModal}>
            Hủy bỏ
          </Button>
          <Button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>
            Xác nhận xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default ServicesManager;