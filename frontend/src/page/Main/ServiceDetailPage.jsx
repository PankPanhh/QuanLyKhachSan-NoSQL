import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAllServices, getServiceStats } from '../../services/servicesServices';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { FaRegClock } from 'react-icons/fa';

// Simple image gallery slider (no external dependency)
function ImageCarousel({ images = [] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (idx >= images.length) setIdx(0); }, [images, idx]);
  if (!images || images.length === 0) return <div style={{ width: '100%', height: 360, background: '#eee', borderRadius: 8 }} />;
  return (
    <div>
      <div style={{ width: '100%', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={images[idx]} alt={`service-${idx}`} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 8 }} />
      </div>
      {images.length > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}>&lt;</button>
          {images.map((_, i) => (
            <button key={i} className={`btn btn-sm ${i === idx ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setIdx(i)}>{i + 1}</button>
          ))}
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setIdx((i) => (i + 1) % images.length)}>&gt;</button>
        </div>
      )}
    </div>
  );
}

export default function ServiceDetailPage() {
  const { id } = useParams(); // may be _id or MaDichVu
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const all = await getAllServices();
        // find by _id or MaDichVu
        const found = (Array.isArray(all) && all.find(s => (s._id && s._id === id) || (s.MaDichVu && s.MaDichVu === id))) || null;
        if (!found) {
          setError('Không tìm thấy dịch vụ');
          setService(null);
          return;
        }
        setService(found);
        // related: choose other services with similar DonViTinh or same first words
        const rel = (Array.isArray(all) ? all.filter(s => s.MaDichVu !== found.MaDichVu).slice(0,4) : []);
        setRelated(rel);
        // fetch stats
        try {
          const st = await getServiceStats(found._id || found.MaDichVu);
          setStats(st || null);
        } catch (e) { setStats(null); }
      } catch (err) {
        console.error(err); setError('Lỗi khi tải dữ liệu');
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleBook = async () => {
    // Try to call booking API if present. We don't assume a specific booking client here.
    // For now show a friendly message / placeholder behavior.
    if (!service) return;
    alert(`Gọi API đặt dịch vụ: ${service.TenDichVu} (Mã ${service.MaDichVu || service._id})`);
  };

  if (loading) return <div className="text-center"><Spinner /> Đang tải...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!service) return <div className="alert alert-warning">Dịch vụ không tồn tại.</div>;

  // Build images list: HinhAnhDichVu plus any gallery array (support both HinhAnhDichVu và Gallery)
  const backendRoot = api.baseURL.replace(/\/api\/v1\/?$/,'');
  const base = service.HinhAnhDichVu ? [`${backendRoot}/assets/images/services/${service.HinhAnhDichVu}`] : [];
  const gallery = Array.isArray(service.gallery) ? service.gallery.map(g => g.url || g) : (Array.isArray(service.Gallery) ? service.Gallery : []);
  const images = [...base, ...gallery];

  return (
    <div className="container padding-side py-5">
      <div className="row">
        <div className="col-lg-7">
          <div className="card mb-4 shadow-sm">
            <div style={{ position: 'relative' }}>
              <img src={images[0] || '/images/default-thumb.jpg'} alt={service.TenDichVu} style={{ width: '100%', maxHeight: 520, objectFit: 'cover' }} />
              <div style={{ position: 'absolute', right: 12, top: 12 }}>
                <span className="badge bg-primary">{formatCurrency(service.GiaDichVu)} {service.DonViTinh || ''}</span>
              </div>
              <div style={{ position: 'absolute', left: 12, top: 12 }}>
                <span className={`badge ${service.TrangThai && service.TrangThai.includes('Đang') ? 'bg-success' : 'bg-secondary'}`}>{service.TrangThai || '—'}</span>
              </div>
            </div>
            <div className="card-body">
              <h2 className="mb-1">{service.TenDichVu}</h2>
              <p className="text-muted small">Mã: {service.MaDichVu || service._id}</p>

              {service.KhuyenMai && (
                <div className="alert alert-success">
                  <strong>Khuyến mãi:</strong> {service.KhuyenMai.TenKhuyenMai || service.KhuyenMai?.title} {service.KhuyenMai?.PhanTramGiam ? `— Giảm ${service.KhuyenMai.PhanTramGiam}%` : ''}
                </div>
              )}

              <div className="mb-3">
                <h5>Mô tả</h5>
                {(() => {
                  const full = service.MoTaDichVu || service.MoTa || 'Chưa có mô tả';
                  const parts = full.split(/\n{1,}|\r\n{1,}/).map(p => p.trim()).filter(Boolean);
                  const toShow = parts.slice(0, 3);
                  return toShow.map((p, i) => <p key={i}>{p}</p>);
                })()}
              </div>

              <div className="d-flex gap-3 align-items-center">
                <div className="small text-muted"><FaRegClock className="me-1" /> {service.ThoiGianPhucVu || '—'}</div>
              </div>

              <div className="mt-4 d-flex gap-2">
                <button className="btn btn-primary" onClick={handleBook}>Đặt dịch vụ ngay</button>
                <button className="btn btn-outline-secondary" onClick={() => alert('Thêm vào đơn phòng (tương lai)')}>Thêm vào đơn phòng</button>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="mb-4">
              <h6>Hình ảnh khác</h6>
              <div className="d-flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <img key={idx} src={img} alt={`thumb-${idx}`} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-5">
          <div className="card p-3 mb-3 shadow-sm">
            <h5>Đánh giá & nhận xét</h5>
            {stats ? (
              <div>
                <p><strong>{stats.avgRating ? `${stats.avgRating.toFixed(1)} / 5` : '—'}</strong> từ {stats.reviewsCount ?? 0} đánh giá</p>
                {Array.isArray(stats.sampleComments) && stats.sampleComments.length > 0 ? (
                  stats.sampleComments.slice(0,3).map((c,i) => <div key={i} className="mb-2"><strong>{c.author}</strong><div>{c.text}</div></div>)
                ) : (
                  <p className="text-muted">Chưa có đánh giá.</p>
                )}
              </div>
            ) : (
              <p className="text-muted">Đang tải thống kê...</p>
            )}
          </div>

          <div className="card p-3 mb-3 shadow-sm">
            <h5>Dịch vụ liên quan</h5>
            {related.length ? (
              related.map(r => (
                <div key={r.MaDichVu || r._id} className="d-flex align-items-center gap-3 mb-2">
                  <img src={r.HinhAnhDichVu ? `${backendRoot}/assets/images/services/${r.HinhAnhDichVu}` : '/images/default-thumb.jpg'} alt={r.TenDichVu} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  <div>
                    <Link to={`/service/${r._id || r.MaDichVu}`}>{r.TenDichVu}</Link>
                    <div className="text-muted small">{formatCurrency(r.GiaDichVu)} {r.DonViTinh}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">Không có gợi ý.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
