import React, { useEffect } from 'react';

export default function PromotionModal({ open, data, onClose, onApply, roomsLimit = 12 }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !data) return null;

  const promo = data.promo || {};
  const title = data.title || promo.TenChuongTrinh || promo.TenKM || promo.Ten || data.id || 'Chi tiết khuyến mãi';
  const isActive = promo && promo.TrangThai === "Hoạt động" && (!promo.NgayBatDau || !promo.NgayKetThuc || (new Date(promo.NgayBatDau) <= new Date() && new Date(promo.NgayKetThuc) >= new Date()));

  function renderDiscountLabel(p) {
    const loai = p.LoaiGiamGia || p.loaiGiamGia || p.type || '';
    const val = p.GiaTriGiam ?? p.giaTriGiam ?? p.GiaTri ?? p.value ?? 0;
    if (!loai || !val) return '—';
    if (String(loai).toLowerCase().includes('phần') || String(loai).toLowerCase().includes('percent')) return `${val}% (Phần trăm)`;
    return `${Number(val).toLocaleString('vi-VN')}đ`;
  }

  return (
    <div className="promo-modal">
      <div className="promo-modal-backdrop" onClick={onClose} />
      <div className="promo-modal-dialog card shadow-lg">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4 className="mb-1">{title}</h4>
              <div className="small text-muted">Mã: {data.id || (promo && (promo.MaKhuyenMai || promo.id)) || '—'}</div>
            </div>
            <div>
              <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Đóng</button>
            </div>
          </div>

          <div className="mb-3 d-flex align-items-center justify-content-between">
            <div>
              <div className="mb-2"><strong>💸 Mức giảm:</strong> {renderDiscountLabel(promo)}</div>
              <div className="mb-2"><strong>� Điều kiện:</strong> {promo.DieuKien || promo.dieuKien || promo.condition || 'Không có'}</div>
              <div className="mb-2"><strong>📝 Mô tả:</strong> {promo.MoTa || promo.MoTaChiTiet || promo.description || '—'}</div>
            </div>
            <div className="text-end">
              <div className="badge bg-primary mb-2" title={`Thời gian: ${promo.NgayBatDau ? new Date(promo.NgayBatDau).toLocaleDateString('vi-VN') : ''} — ${promo.NgayKetThuc ? new Date(promo.NgayKetThuc).toLocaleDateString('vi-VN') : ''}`}>
                {renderDiscountLabel(promo)} • {title}
              </div>
              <div className="small text-muted">{promo.NgayBatDau ? new Date(promo.NgayBatDau).toLocaleDateString('vi-VN') : ''} — {promo.NgayKetThuc ? new Date(promo.NgayKetThuc).toLocaleDateString('vi-VN') : ''}</div>
            </div>
          </div>

          <div>
            <h5>Các phòng đang áp dụng</h5>
            <div className="row g-2">
              {(data.rooms || []).slice(0, roomsLimit).map((r, i) => {
                const room = r.room || r;
                const roomId = r.roomId || r.MaPhong || r._id || r.id;
                const base = room.GiaPhong ?? room.giaPhong ?? room.Gia ?? room.price ?? 0;
                const loai = promo && (promo.LoaiGiamGia || promo.loaiGiamGia || promo.type || '');
                const val = promo && (promo.GiaTriGiam ?? promo.giaTriGiam ?? promo.GiaTri ?? promo.value ?? null);
                const isActive = promo && promo.TrangThai === "Hoạt động" && (!promo.NgayBatDau || !promo.NgayKetThuc || (new Date(promo.NgayBatDau) <= new Date() && new Date(promo.NgayKetThuc) >= new Date()));
                let discPrice = base;
                if (isActive && val != null && loai) {
                  if (String(loai).toLowerCase().includes('phần') || String(loai).toLowerCase().includes('percent')) discPrice = Math.max(0, Math.round(base * (1 - Number(val) / 100)));
                  else discPrice = Math.max(0, Math.round(base - Number(val)));
                }
                const img = room.HinhAnh ? `http://localhost:5000/assets/images/room/${room.HinhAnh}` : room.image || null;
                return (
                  <div className="col-6 col-md-4" key={i}>
                    <div className="card h-100">
                      {img && <img src={img} alt={room.TenPhong || room.name} style={{ height: 100, objectFit: 'cover', width: '100%' }} />}
                      <div className="card-body p-2">
                        <div className="fw-bold small">{room.TenPhong || room.name || `Phòng ${roomId}`}</div>
                        <div className="small text-muted">{room.LoaiPhong || room.type || ''}</div>
                        <div className="mt-2 small"><s>{Number(base).toLocaleString('vi-VN')}đ</s> <span className="fw-bold text-danger">{Number(discPrice).toLocaleString('vi-VN')}đ</span></div>
                        {r.promoInstanceStatus === "Hoạt động" && (
                          <div className="mt-2">
                            <button className="btn btn-sm btn-primary" onClick={() => onApply && onApply(roomId)}>Đặt ngay</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .promo-modal{ position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .promo-modal-backdrop{ position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
        .promo-modal-dialog{ position: relative; width: min(980px, 96%); max-height: 88vh; overflow: auto; }
      `}</style>
    </div>
  );
}
