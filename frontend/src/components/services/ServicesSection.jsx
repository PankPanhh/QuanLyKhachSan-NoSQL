import React, { useEffect, useState } from 'react';
import { getAllServices } from '../../services/servicesServices';
import api from '../../services/api';
import { GiMeditation, GiChefToque } from 'react-icons/gi';
import { FaSwimmer, FaDumbbell, FaChair, FaWifi, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import { formatCurrency } from '../../utils/formatCurrency';

function ServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true); setError(null);
        const data = await getAllServices();
        setServices(data || []);
      } catch (err) {
        console.error('Failed loading services', err);
        setError('Không thể tải dịch vụ.');
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <section id="services" className="padding-medium">
      <div className="container-fluid padding-side" data-aos="fade-up">
        <h3 className="display-3 text-center fw-normal col-lg-4 offset-lg-4">Our services &amp; facilities</h3>

  <div className="row mt-5 align-items-stretch">
          {loading ? (
            <div className="col-12 text-center">Đang tải dịch vụ...</div>
          ) : error ? (
            <div className="col-12"><div className="alert alert-danger">{error}</div></div>
          ) : services.length === 0 ? (
            <div className="col-12"><p className="text-muted">Không có dịch vụ nào.</p></div>
          ) : (
                services.slice(0, 6).map((s) => {
              const backendRoot = api.baseURL.replace(/\/api\/v1\/?$/,'');
              const img = s.HinhAnhDichVu ? `${backendRoot}/assets/images/services/${s.HinhAnhDichVu}` : '/images/default-thumb.jpg';
              const shortDesc = (s.MoTaDichVu || s.MoTa || '').split('\n')[0] || 'Mô tả đang cập nhật.';
              return (
                <div className="col-md-6 col-xl-4 d-flex" key={s._id || s.MaDichVu}>
                  <div className="service mb-4 rounded-4 shadow-sm p-0 flex-fill d-flex flex-column">
                    <div style={{ height: 220, overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                      <img src={img} alt={s.TenDichVu || 'Dịch vụ'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="p-4 text-start d-flex flex-column" style={{ flex: 1 }}>
                      <div>
                        <h5 className="fw-semibold">{s.TenDichVu}</h5>
                        <p className="text-muted small mb-2">{shortDesc}</p>
                        <p className="mb-2"><strong>Giá:</strong> Từ {formatCurrency(s.GiaDichVu)} {s.DonViTinh || ''}</p>
                        <p className="mb-2"><strong>Thời gian:</strong> {s.ThoiGianPhucVu || '—'}</p>
                        {s.KhuyenMai && s.KhuyenMai.TenKhuyenMai && (
                          <div className="mb-2 text-success small">🎁 {s.KhuyenMai.TenKhuyenMai}</div>
                        )}
                      </div>
                      {/* Footer with fixed height so action buttons align across cards */}
                      <div className="service-footer mt-auto d-flex justify-content-between align-items-center" style={{ minHeight: 72 }}>
                        <Link to={`/service/${s._id || s.MaDichVu}`} className="btn btn-sm btn-outline-primary">Xem chi tiết</Link>
                        <Link to={`/service/${s._id || s.MaDichVu}`} className="btn btn-sm btn-primary">Đặt ngay</Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
