import React, { useEffect, useState } from 'react';
import { getAllServices } from '../../services/servicesServices';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import { FaRegClock } from 'react-icons/fa';

export default function ServicesListPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const data = await getAllServices();
        setServices(data || []);
      } catch (e) { console.error(e); setError('Không thể tải dịch vụ'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="text-center"><Spinner /> Đang tải...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container padding-side py-5">
      <h2 className="mb-4">Tất cả dịch vụ</h2>
      <div className="row align-items-stretch">
        {services.map(s => {
          const backendRoot = api.baseURL.replace(/\/api\/v1\/?$/,'');
          const imgSrc = s.HinhAnhDichVu ? `${backendRoot}/assets/images/services/${s.HinhAnhDichVu}` : '/images/default-thumb.jpg';
          const desc = (s.MoTaDichVu || s.MoTa || '').trim();
          const shortDesc = desc.length > 120 ? `${desc.slice(0, 120).trim()}…` : desc;
          const statusActive = (s.TrangThai || '').toLowerCase().includes('đang');

          return (
            <div className="col-md-6 col-lg-4 mb-4" key={s._id || s.MaDichVu}>
              <div className="card h-100 d-flex flex-column shadow-sm">
                <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                  <img src={imgSrc} alt={s.TenDichVu} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Price badge overlay */}
                  <div style={{ position: 'absolute', right: 8, top: 8 }}>
                    <span className="badge bg-primary">{formatCurrency(s.GiaDichVu)}</span>
                  </div>
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <h5 className="card-title mb-0">{s.TenDichVu}</h5>
                    <span className={`badge ${statusActive ? 'bg-success' : 'bg-secondary'}`}>{s.TrangThai || (statusActive ? 'Đang hoạt động' : 'Tạm ngưng')}</span>
                  </div>
                  <p className="text-muted small mb-2">{shortDesc || 'Chưa có mô tả'}</p>

                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="small text-muted"><FaRegClock className="me-1" /> {s.ThoiGianPhucVu || '—'}</div>
                      <div className="small text-muted">{s.DonViTinh || ''}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Link to={`/service/${s._id || s.MaDichVu}`} className="btn btn-sm btn-outline-primary">Xem chi tiết</Link>
                      <Link to={`/service/${s._id || s.MaDichVu}`} className="btn btn-sm btn-primary">Đặt ngay</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
