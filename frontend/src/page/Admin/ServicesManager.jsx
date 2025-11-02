import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsMap, setStatsMap] = useState({});
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'create' | 'upload' | 'delete'
  const [modalService, setModalService] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [modalFilePreview, setModalFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDeleting, setConfirmDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
  const fetchServices = async () => {
      try {
        setLoading(true);
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${base}/api/v1/services`);

        // If response is not JSON (for example index.html returned by a wrong origin), read text and show helpful error
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
        // If API returns object with data, handle both shapes
        const list = Array.isArray(data) ? data : data.data || [];
        if (mounted) setServices(list);
        // fetch stats for each service (usage count, revenue)
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
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [deletingId, setDeletingId] = useState(null);

  const deleteService = async (svc) => {
    const id = svc._id || svc.MaDichVu;
    if (!id) return alert('Không có id để xóa');
    if (!confirm(`Bạn có chắc muốn xóa dịch vụ "${svc.TenDichVu}" (${svc.MaDichVu}) không?`)) return;
    try {
      setDeletingId(id);
      const res = await fetch(`${apiBase}/api/v1/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt.slice(0,200)}`);
      }
      // remove from list
      setServices((prev) => prev.filter((p) => (p._id || p.MaDichVu) !== id));
    } catch (err) {
      alert('Xóa thất bại: ' + (err.message || String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  // Modal helpers
  const openEditModal = (s) => {
    // prepare modal service object
    const baseObj = s ? { ...s } : { MaDichVu: '', TenDichVu: '', GiaDichVu: 0, DonViTinh: '', MoTaDichVu: '', TrangThai: 'Đang hoạt động', ThoiGianPhucVu: '' };
    setModalService(baseObj);
    setModalMode(s ? 'edit' : 'create');
    // reset file state
    setModalFile(null);
    setUploadProgress(0);
    if (modalFilePreview) {
      try { URL.revokeObjectURL(modalFilePreview); } catch (e) {}
    }
    // if editing and the service already has an image, set preview to that URL
    if (s && s.HinhAnhDichVu) {
      setModalFilePreview(`${apiBase}/assets/images/services/${s.HinhAnhDichVu}`);
    } else {
      setModalFilePreview(null);
    }
    setModalOpen(true);
  };
  const openUploadModal = (s) => { setModalService(s); setModalMode('upload'); setModalFile(null); if (modalFilePreview) { try { URL.revokeObjectURL(modalFilePreview); } catch(e){} } setModalFilePreview(null); setUploadProgress(0); setModalOpen(true); };
  const openDeleteModal = (s) => { setModalService(s); setModalMode('delete'); setConfirmDeleting(true); setModalOpen(true); };
  const closeModal = () => {
    setModalOpen(false);
    setModalService(null);
    setModalFile(null);
    if (modalFilePreview) {
      try { URL.revokeObjectURL(modalFilePreview); } catch (e) {}
    }
    setModalFilePreview(null);
    setConfirmDeleting(false);
    setUploadProgress(0);
  };

  const handleSaveModal = async () => {
    if (!modalService) return;
    const token = localStorage.getItem('token');
    try {
      if (modalMode === 'create') {
        // Remove MaDichVu from payload when creating - server will generate it
        const { MaDichVu, ...serviceData } = modalService;
        const res = await fetch(`${apiBase}/api/v1/services`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(serviceData) });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const created = json.data || json;
        // add to list first so uploadImageFor can update it
        setServices((prev) => [created, ...prev]);
        // if an image file was selected in the modal, upload it now
        if (modalFile) {
          await uploadImageFor(created, modalFile, (p) => setUploadProgress(p));
        }
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
      }
      closeModal();
    } catch (err) {
      alert('Lưu thất bại: ' + (err.message || String(err)));
    }
  };

  const handleUploadModal = async () => {
    if (!modalService || !modalFile) return alert('Chưa chọn file');
    try {
      setUploadProgress(0);
      await uploadImageFor(modalService, modalFile, (p) => setUploadProgress(p));
      // small delay so progress can show 100%
      setTimeout(() => closeModal(), 300);
    } catch (err) {
      alert('Upload ảnh thất bại: ' + (err.message || String(err)));
    } finally {
      setUploadProgress(0);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!modalService) return closeModal();
    await deleteService(modalService);
    closeModal();
  };

  // price inline edit removed — editing is done via the modal now

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
    } catch (err) {
      alert('Thay đổi trạng thái thất bại: ' + (err.message || String(err)));
    } finally {
      setToggleLoadingId(null);
    }
  };

  const uploadImageFor = async (s, file, onProgress) => {
    if (!file) return;
    const id = s._id || s.MaDichVu;
    const token = localStorage.getItem('token');
    const fd = new FormData();
    // If the service already has an image and we're editing, include the existing filename
    // so backend can overwrite the file and keep the same name instead of renaming.
    if (s && s.HinhAnhDichVu) {
      try {
        fd.append('existingFilename', s.HinhAnhDichVu);
        fd.append('preserveName', '1');
      } catch (e) {}
    }
    fd.append('image', file, file.name);

    // Use XMLHttpRequest so we can report upload progress
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

  return (
    <>
    <div className="card border-0 shadow-lg">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold text-dark">Quản lý Dịch vụ</h2>
            <p className="text-muted mb-0 small">Quản lý toàn bộ dịch vụ khách sạn</p>
          </div>
          <div>
            <button className="btn btn-primary px-4 py-2 rounded-pill shadow-sm" onClick={() => openEditModal(null)}>
              <i className="fas fa-plus me-2"></i>Tạo dịch vụ mới
            </button>
          </div>
        </div>

        {loading && <div>Đang tải dịch vụ…</div>}
        {error && <div className="alert alert-danger">Lỗi: {error}</div>}

        {!loading && !error && (
          <div className="bg-white rounded-3 shadow-sm border-0 overflow-hidden">
            <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="bg-light border-0">
                <tr className="border-0">
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3 ps-4" style={{ width: 120, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Mã DV</th>
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3" style={{ width: 260, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Tên dịch vụ</th>
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3" style={{ width: 140, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Giá</th>
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3" style={{ width: 100, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Đơn vị</th>
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3" style={{ width: 140, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Giờ phục vụ</th>
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3" style={{ width: 140, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Trạng thái</th>
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3" style={{ width: 120, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Ảnh</th>
                  <th className="text-nowrap fw-semibold text-uppercase text-muted py-3 pe-4" style={{ width: 200, verticalAlign: 'bottom', fontSize: '11px', letterSpacing: '0.5px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-5 text-muted">
                    <i className="fas fa-concierge-bell fa-2x mb-3 text-muted opacity-50"></i>
                    <br />Chưa có dịch vụ nào
                  </td></tr>
                )}
                {services.map((s) => (
                  <tr key={s._id || s.MaDichVu} className="border-bottom" style={{ transition: 'all 0.2s ease' }}>
                    <td className="ps-4 py-3">
                      <span className="fw-bold text-dark font-monospace bg-light px-2 py-1 rounded">{s.MaDichVu}</span>
                    </td>
                    <td className="py-3">
                      <Link to={`/admin/services/${encodeURIComponent(s._id || s.MaDichVu)}`} title="Xem chi tiết" className="text-decoration-none">
                        <div className="fw-bold text-dark text-truncate hover-text-primary" style={{ maxWidth: 240, fontSize: '15px' }}>{s.TenDichVu}</div>
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold" style={{ fontSize: '13px' }}>
                        {priceFmt(s.GiaDichVu)}
                      </span>
                    </td>
                    <td className="text-nowrap py-3">
                      <span className="text-muted">{s.DonViTinh || '-'}</span>
                    </td>
                    <td className="text-nowrap py-3">
                      <span className="text-muted small">{s.ThoiGianPhucVu || '-'}</span>
                    </td>
                    <td className="py-3">
                      <span className={`badge px-3 py-2 rounded-pill fw-semibold ${s.TrangThai === 'Đang hoạt động' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} 
                            style={{ fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onClick={() => toggleStatus(s)} 
                            disabled={toggleLoadingId === (s._id || s.MaDichVu)}>
                        {toggleLoadingId === (s._id || s.MaDichVu) ? (
                          <><i className="fas fa-spinner fa-spin me-1"></i>Đang xử lý...</>
                        ) : (
                          <><i className={`fas ${s.TrangThai === 'Đang hoạt động' ? 'fa-check-circle' : 'fa-pause-circle'} me-1`}></i>
                          {s.TrangThai === 'Đang hoạt động' ? 'Hoạt động' : 'Tạm ngưng'}</>
                        )}
                      </span>
                    </td>
                    <td className="py-3">
                      {s.HinhAnhDichVu ? (
                        <img src={`${apiBase}/assets/images/services/${s.HinhAnhDichVu}`} alt={s.TenDichVu} 
                             style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 8 }} 
                             className="shadow-sm" />
                      ) : (
                        <div className="bg-light text-center shadow-sm" style={{ width: 80, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                          <i className="fas fa-image text-muted small"></i>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pe-4">
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary btn-sm px-3 rounded-pill" onClick={() => openEditModal(s)} title="Chỉnh sửa dịch vụ">
                          <i className="fas fa-edit me-1"></i>Chỉnh sửa
                        </button>
                        <button className="btn btn-outline-danger btn-sm px-3 rounded-pill" onClick={() => openDeleteModal(s)} disabled={deletingId === (s._id || s.MaDichVu)} title="Xóa dịch vụ">
                          {deletingId === (s._id || s.MaDichVu) ? (
                            <><i className="fas fa-spinner fa-spin me-1"></i>Đang xóa...</>
                          ) : (
                            <><i className="fas fa-trash me-1"></i>Xóa</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* Modal markup */}
    {modalOpen && (
      <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
        <div className="card border-0 shadow-lg" style={{ width: 800, maxWidth: '95%', borderRadius: '16px' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0 fw-bold text-dark">{modalMode === 'create' ? '✨ Tạo dịch vụ mới' : modalMode === 'edit' ? '✏️ Chỉnh sửa dịch vụ' : modalMode === 'upload' ? '📷 Upload ảnh dịch vụ' : '🗑️ Xác nhận xóa'}</h4>
              <button className="btn btn-light rounded-circle p-2" onClick={closeModal} style={{ width: '40px', height: '40px' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {modalMode === 'delete' ? (
              <div className="text-center py-4">
                <div className="mb-4">
                  <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                  <h5 className="fw-bold text-dark">Xác nhận xóa dịch vụ</h5>
                  <p className="text-muted mb-0">Bạn có chắc muốn xóa dịch vụ <strong className="text-dark">"{modalService?.TenDichVu}"</strong> ({modalService?.MaDichVu}) không?</p>
                  <small className="text-danger">Hành động này không thể hoàn tác!</small>
                </div>
                <div className="d-flex gap-3 justify-content-center">
                  <button className="btn btn-danger px-4 rounded-pill" onClick={handleDeleteConfirm}>
                    <i className="fas fa-trash me-2"></i>Xác nhận xóa
                  </button>
                  <button className="btn btn-outline-secondary px-4 rounded-pill" onClick={closeModal}>
                    <i className="fas fa-times me-2"></i>Hủy bỏ
                  </button>
                </div>
              </div>
            ) : modalMode === 'upload' ? (
              <div>
                <p>Upload ảnh cho <strong>{modalService?.TenDichVu}</strong></p>
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setModalFile(f);
                  if (modalFilePreview) { try { URL.revokeObjectURL(modalFilePreview); } catch (e) {} }
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setModalFilePreview(url);
                  } else {
                    setModalFilePreview(null);
                  }
                }} />

                {modalFilePreview && (
                  <div className="mt-3 d-flex align-items-center gap-3">
                    <img src={modalFilePreview} alt="preview" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                    <div>
                      <div><strong>{modalFile?.name}</strong></div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{modalFile ? `${(modalFile.size/1024|0)} KB` : ''}</div>
                    </div>
                  </div>
                )}

                {uploadProgress > 0 && (
                  <div className="mt-3">
                    <div className="progress" style={{ height: 10 }}>
                      <div className="progress-bar" role="progressbar" style={{ width: `${Math.round(uploadProgress*100)}%` }} aria-valuenow={Math.round(uploadProgress*100)} aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div className="small text-muted mt-1">Đang upload: {Math.round(uploadProgress*100)}%</div>
                  </div>
                )}

                <div className="mt-3 d-flex gap-2">
                  <button className="btn btn-primary" onClick={handleUploadModal} disabled={!modalFile || uploadProgress > 0}>Upload</button>
                  <button className="btn btn-outline-secondary" onClick={closeModal}>Hủy</button>
                </div>
              </div>
            ) : (
              <div>
                {modalMode === 'edit' && (
                  <div className="mb-2">
                    <label className="form-label">Mã dịch vụ</label>
                    <input
                      className="form-control bg-light text-muted"
                      value={modalService?.MaDichVu || ''}
                      readOnly
                    />
                    <div className="form-text small text-muted">Mã dịch vụ được tự động sinh ra và không thể chỉnh sửa.</div>
                  </div>
                )}
                <div className="mb-2">
                  <label className="form-label">Tên dịch vụ</label>
                  <input className="form-control" value={modalService?.TenDichVu || ''} onChange={(e) => setModalService((m) => ({ ...m, TenDichVu: e.target.value }))} />
                </div>
                <div className="row">
                  <div className="col-6 mb-2">
                    <label className="form-label">Giá</label>
                    <input className="form-control" type="number" value={modalService?.GiaDichVu ?? 0} onChange={(e) => setModalService((m) => ({ ...m, GiaDichVu: Number(e.target.value) }))} />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="form-label">Đơn vị tính</label>
                    <select className="form-select" value={modalService?.DonViTinh || ''} onChange={(e) => setModalService((m) => ({ ...m, DonViTinh: e.target.value }))}>
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
                </div>
                <div className="mb-2">
                  <label className="form-label">Mô tả ngắn</label>
                  <textarea className="form-control" rows={3} value={modalService?.MoTaDichVu || ''} onChange={(e) => setModalService((m) => ({ ...m, MoTaDichVu: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Hình ảnh</label>
                  <input type="file" accept="image/*" className="form-control" onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setModalFile(f);
                    // revoke previous preview if it was an object URL
                    if (modalFilePreview) { try { URL.revokeObjectURL(modalFilePreview); } catch (er) {} }
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setModalFilePreview(url);
                    } else {
                      // if no local file selected and editing existing service, keep existing HinhAnhDichVu preview
                      if (modalService?.HinhAnhDichVu) {
                        setModalFilePreview(`${apiBase}/assets/images/services/${modalService.HinhAnhDichVu}`);
                      } else {
                        setModalFilePreview(null);
                      }
                    }
                  }} />

                  {modalFilePreview && (
                    <div className="mt-2 d-flex align-items-center gap-3">
                      <img src={modalFilePreview} alt="preview" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                      <div className="small text-muted">{modalFile ? modalFile.name : (modalService?.HinhAnhDichVu || '')}</div>
                    </div>
                  )}
                </div>
                <div className="row">
                  <div className="col-6 mb-2">
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
                  <div className="col-6 mb-2">
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
                </div>
                <div className="row">
                  <div className="col-6 mb-2">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={modalService?.TrangThai || 'Đang hoạt động'} onChange={(e) => setModalService((m) => ({ ...m, TrangThai: e.target.value }))}>
                      <option>Đang hoạt động</option>
                      <option>Tạm ngưng</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 d-flex gap-3 justify-content-end">
                  <button className="btn btn-primary px-4 py-2 rounded-pill" onClick={handleSaveModal}>
                    <i className={`fas ${modalMode === 'create' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                    {modalMode === 'create' ? 'Tạo dịch vụ' : 'Lưu thay đổi'}
                  </button>
                  <button className="btn btn-outline-secondary px-4 py-2 rounded-pill" onClick={closeModal}>
                    <i className="fas fa-times me-2"></i>Hủy bỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ServicesManager;
