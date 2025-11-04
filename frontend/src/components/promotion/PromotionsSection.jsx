import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRooms, getRoomById } from "../../services/roomService";
import api from '../../services/api';
import { BookingContext } from "../../context/BookingContext";
import PromotionModal from './PromotionModal';

function normalizePromo(raw) {
  if (!raw) return null;
  // Support multiple promo shapes, including the requested Vietnamese format
  const loai = raw.LoaiGiamGia || raw.loaiGiamGia || raw.type || "Phần trăm";
  // Use nullish coalescing consistently to avoid mixing '||' and '??' which TypeScript disallows
  const giaTri = raw.GiaTriGiam ?? raw.giaTriGiam ?? raw.GiaTri ?? raw.value ?? raw.GiamGiaPhanTram ?? raw.discount ?? 0;

  const startDate = raw.NgayBatDau ? new Date(raw.NgayBatDau) : raw.startDate ? new Date(raw.startDate) : null;
  const endDate = raw.NgayKetThuc ? new Date(raw.NgayKetThuc) : raw.endDate ? new Date(raw.endDate) : null;
  const now = new Date();

  // Prefer an explicit TrangThai field from backend/admin UI when present.
  // Accept both 'Ngưng hoạt động' and legacy 'Tạm dừng' as manual inactive states.
  const manualStatus = (raw.TrangThai || raw.trangThai || raw.status || "").toString();
  let status = "Hoạt động";
  if (manualStatus) {
    if (/ngưng|tạm dừng|tam d?ng/i.test(manualStatus)) {
      status = 'Ngưng hoạt động';
    } else if (/hết hạn/i.test(manualStatus)) {
      status = 'Hết hạn';
    } else if (/sắp/i.test(manualStatus)) {
      status = 'Sắp diễn ra';
    } else if (/hoạt/i.test(manualStatus)) {
      status = 'Hoạt động';
    } else {
      // fallback to date logic if unrecognized
    }
  }

  // If no manual status was provided or it was unrecognized, determine by dates
  if (!manualStatus) {
    if (endDate && endDate < now) status = "Hết hạn";
    else if (startDate && startDate > now) status = "Sắp diễn ra";
    else if (startDate && endDate && startDate <= now && endDate >= now) status = "Hoạt động";
    else status = "Hoạt động";
  }

  const result = {
    id: raw.MaKhuyenMai || raw.MaKM || raw._id || raw.id || null,
    title: raw.TenChuongTrinh || raw.TenKM || raw.title || raw.name || "Ưu đãi",
    description: raw.MoTa || raw.MoTa || raw.description || raw.note || "",
    // Normalize both percent and fixed amount
    discountPercent: loai && String(loai).toLowerCase().includes("phần") ? Number(giaTri) : null,
    discountAmount: loai && String(loai).toLowerCase().includes("phần") ? null : Number(giaTri),
    condition: raw.DieuKien || raw.dieuKien || raw.condition || "",
    startDate,
    endDate,
    status,
    raw,
  };

  return result;
}

function PromotionsSection() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { updateBookingDetails } = useContext(BookingContext);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Prefer backend aggregated promotions endpoint; fall back to client-side aggregation
    api.get('/promotions?status=all')
      .then((resp) => {
        if (!mounted) return;
        // api.get returns parsed JSON. Expect shape { success: true, data: [...] } or array
        const payload = resp && resp.data ? resp.data : resp;
        if (Array.isArray(payload)) {
          // payload entries: { id, title, promo, rooms }
          const mapped = payload.map((p) => ({
            promo: normalizePromo(p.promo || p),
            rooms: (p.rooms || []).map((r) => ({
              room: { TenPhong: r.TenPhong, LoaiPhong: r.LoaiPhong, HinhAnh: r.HinhAnh, GiaPhong: r.GiaPhong ?? r.GiaPhong },
              roomId: r.roomId || r._id || r.MaPhong,
            })),
            raw: p,
          }));
          setPromos(mapped);
          setLoading(false);
          return;
        }

        // Fallback: query rooms and aggregate on client
        return getAllRooms()
          .then((rooms) => {
            if (!mounted) return;
            const map = new Map();
            rooms.forEach((room) => {
              if (room.LoaiPhong) {
                // collect roomTypes earlier via setPromos consumer
              }
              const promosRaw = room.KhuyenMai || room.khuyenMai || room.promotions || room.KM || [];
              if (!Array.isArray(promosRaw)) return;
              promosRaw.forEach((p) => {
                const norm = normalizePromo(p);
                if (!norm) return;
                const key = norm.id || norm.title;
                if (!map.has(key)) map.set(key, { promo: norm, rooms: [{ room, roomId: room._id || room.id || room.MaPhong }] });
                else map.get(key).rooms.push({ room, roomId: room._id || room.id || room.MaPhong });
              });
            });
            setPromos(Array.from(map.values()).map(x => ({ ...x })));
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải chương trình khuyến mãi.");
        setLoading(false);
      });
    return () => (mounted = false);
  }, []);

  const now = new Date();

  const filtered = promos
    .map((p) => {
      const promo = p.promo;
      const rooms = p.rooms;
  const isActive = promo.status === "Hoạt động";
  const isExpired = promo.endDate && (promo.endDate instanceof Date ? promo.endDate : new Date(promo.endDate)) < now;
  const isUpcoming = promo.startDate && (promo.startDate instanceof Date ? promo.startDate : new Date(promo.startDate)) > now;
      const daysLeft = promo.endDate ? Math.ceil(((promo.endDate instanceof Date ? promo.endDate : new Date(promo.endDate)) - now) / (1000 * 3600 * 24)) : Infinity;
      const isExpiringSoon = isActive && daysLeft <= 7;
  return { ...p, meta: { isActive, isExpired, isExpiringSoon, daysLeft, isUpcoming } };
    })
    .filter(({ promo, rooms, meta }) => {
      // Always hide promos that were manually disabled (canonical label)
      if ((promo && promo.status && String(promo.status).toLowerCase().includes('ngưng')) || (promo && promo.status === 'Ngưng hoạt động')) return false;

      // Default: show only active/current promos
  if (statusFilter === "active" && !meta.isActive) return false;
  if (statusFilter === "upcoming" && !meta.isUpcoming) return false;
  if (statusFilter === "expired" && !meta.isExpired) return false;
      // 'all' shows both

      if (roomTypeFilter !== "all") {
        const match = rooms.some((r) => (r.room.LoaiPhong || "") === roomTypeFilter);
        if (!match) return false;
      }

      if (discountTypeFilter === "percent" && !promo.discountPercent) return false;
      if (discountTypeFilter === "amount" && !promo.discountAmount) return false;

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const inTitle = (promo.title || "").toLowerCase().includes(q);
        const inId = (promo.id || "").toLowerCase().includes(q);
        if (!inTitle && !inId) return false;
      }

      return true;
    })
    // sort: active/expiring first, expired last
    .sort((a, b) => {
      if (a.meta.isExpired && !b.meta.isExpired) return 1;
      if (!a.meta.isExpired && b.meta.isExpired) return -1;
      // both same expired state: show those expiring sooner first
      return (a.meta.daysLeft || Infinity) - (b.meta.daysLeft || Infinity);
    });

  const roomTypes = Array.from(new Set(promos.flatMap((p) => p.rooms.map((r) => r.room.LoaiPhong).filter(Boolean))));

  function applyPromoAndGo(promoItem, targetRoomId) {
    // Attach minimal promo info into booking details and navigate
    const promoToApply = {
      id: promoItem.promo.id,
      title: promoItem.promo.title,
      discountPercent: promoItem.promo.discountPercent,
      discountAmount: promoItem.promo.discountAmount,
      startDate: promoItem.promo.startDate,
      endDate: promoItem.promo.endDate,
      condition: promoItem.promo.condition,
    };

    updateBookingDetails({ promo: promoToApply, room: targetRoomId });
    navigate(`/room/${targetRoomId}`);
  }

  // Modal state & handlers
  const [modalData, setModalData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function openPromoModal(item) {
    // Do not open modal for manually disabled promos
    const status = item && item.promo && item.promo.status;
    if (status && String(status).toLowerCase().includes('ngưng')) {
      // Optionally show a toast/alert — keepUX simple: ignore open
      console.info('Attempted to open modal for inactive promo, ignoring');
      return;
    }
    // Try to fetch fresh detail from backend, fallback to item.raw
    try {
      const key = item.promo.id || item.promo.title;
      const resp = await api.get(`/promotions/${encodeURIComponent(key)}`);
      if (resp && resp.data) {
        setModalData(resp.data);
      } else {
        setModalData(item.raw || { promo: item.promo, rooms: item.rooms });
      }
    } catch (e) {
      console.warn('Promo detail fetch failed, using cached', e);
      setModalData(item.raw || { promo: item.promo, rooms: item.rooms });
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalData(null);
  }

  async function handleModalApply(roomId) {
    // apply promo from modalData and navigate to room
    if (!modalData) return;
    const promo = modalData.promo;

    // Re-check room availability on server to avoid race conditions
    try {
      const latest = await getRoomById(roomId);
      // getRoomById returns response.data or object; normalize
      const room = latest && latest.data ? latest.data : latest;
      if (!room) {
        alert('Không thể kiểm tra trạng thái phòng. Vui lòng thử lại.');
        return;
      }
      if (room.TinhTrang && room.TinhTrang !== 'Trống') {
        alert('⚠️ Phòng này hiện không còn trống, vui lòng chọn phòng khác.');
        // Close modal to force user to re-open or pick another
        // Alternatively, we could re-fetch modal data here
        setModalOpen(false);
        setModalData(null);
        return;
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra trạng thái phòng', err);
      alert('Lỗi khi kiểm tra trạng thái phòng. Vui lòng thử lại.');
      return;
    }

    const loai = promo && (promo.LoaiGiamGia || promo.loaiGiamGia || promo.type || '');
    const val = promo && (promo.GiaTriGiam ?? promo.giaTriGiam ?? promo.GiaTri ?? promo.value ?? null);
    const promoToApply = {
      id: modalData.id || (promo && (promo.MaKhuyenMai || promo.id)),
      title: modalData.title || (promo && (promo.TenChuongTrinh || promo.TenKM)),
      LoaiGiamGia: loai,
      GiaTriGiam: val,
      NgayBatDau: promo && promo.NgayBatDau,
      NgayKetThuc: promo && promo.NgayKetThuc,
      DieuKien: promo && (promo.DieuKien || promo.dieuKien || promo.condition),
    };
    // Set discountPercent or discountAmount for BookingSummary
    if (loai && val != null) {
      if (String(loai).toLowerCase().includes('phần') || String(loai).toLowerCase().includes('percent')) {
        promoToApply.discountPercent = Number(val);
      } else {
        promoToApply.discountAmount = Number(val);
      }
    }
    updateBookingDetails({ promo: promoToApply, room: roomId });
    setModalOpen(false);
    setModalData(null);
    navigate(`/room/${roomId}`);
  }

  if (loading) return <div className="text-center py-5">Đang tải ...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container px-3 py-4 promotions-page">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Chương trình khuyến mãi</h2>
        <div className="d-flex gap-2 align-items-center">
          <input className="form-control" placeholder="Tìm theo tên hoặc mã (VD: KM_HE20)" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-select" value={discountTypeFilter} onChange={(e) => setDiscountTypeFilter(e.target.value)}>
            <option value="all">Tất cả loại giảm</option>
            <option value="percent">Phần trăm</option>
            <option value="amount">Số tiền</option>
          </select>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="active">Đang hoạt động</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="all">Tất cả</option>
            <option value="expired">Đã hết hạn</option>
          </select>
          <select className="form-select" value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)}>
            <option value="all">Tất cả loại phòng</option>
            {roomTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-3">
        {filtered.length === 0 && <div className="col-12">Không có khuyến mãi phù hợp.</div>}

        {filtered.map((item, idx) => {
          const { promo, rooms } = item;
          const isActive = promo.status === "Hoạt động" && (!promo.startDate || !promo.endDate || (promo.startDate <= now && promo.endDate >= now));
          const isUpcoming = promo.startDate && promo.startDate > now;
          const isExpired = promo.endDate && promo.endDate < now;

          const sampleRoom = rooms[0]?.room || {};
          const image = sampleRoom.HinhAnh
            ? `http://localhost:5000/assets/images/room/${sampleRoom.HinhAnh}`
            : sampleRoom.image || "/public/style.css";

          return (
            <div className="col-md-6 col-lg-4" key={idx}>
              <div className={`card h-100 shadow-sm promo-card ${isExpired ? "opacity-50" : ""}`}>
                {image && (
                  <img src={image} className="card-img-top" alt={promo.title} style={{ height: 160, objectFit: "cover" }} />
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{promo.title}</h5>
                  {promo.id && <div className="text-muted small mb-1">Mã: {promo.id}</div>}
                  <p className="card-text text-truncate">{promo.description}</p>
                  {rooms.length > 0 && (
                    <div className="mb-2">
                      <strong className="small">Phòng áp dụng:</strong>
                      <div className="row g-1 mt-1">
                        {rooms.slice(0, 4).map((r, i) => (
                          <div className="col-6" key={i}>
                            <small className="text-muted">{r.room.TenPhong || r.room.MaPhong} ({r.room.LoaiPhong})</small>
                          </div>
                        ))}
                        {rooms.length > 4 && (
                          <div className="col-12">
                            <small className="text-muted">... và {rooms.length - 4} phòng khác</small>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                          <div className="mb-2 d-flex justify-content-between align-items-center">
                            <div>
                              {promo.discountPercent ? (
                                <strong className="text-danger me-2">Giảm {promo.discountPercent}%</strong>
                              ) : promo.discountAmount ? (
                                <strong className="text-danger me-2">Giảm {Number(promo.discountAmount).toLocaleString()}đ</strong>
                              ) : null}
                              <small className="text-muted">{promo.startDate ? (promo.startDate instanceof Date ? promo.startDate.toLocaleDateString('vi-VN') : new Date(promo.startDate).toLocaleDateString('vi-VN')) : ""} – {promo.endDate ? (promo.endDate instanceof Date ? promo.endDate.toLocaleDateString('vi-VN') : new Date(promo.endDate).toLocaleDateString('vi-VN')) : ""}</small>
                            </div>
                            <div>
                              {(() => {
                                const meta = (item && item.meta) || {};
                                if (meta.isExpired) {
                                  return <span className="badge bg-secondary">Đã hết hạn</span>;
                                }
                                if (meta.isUpcoming) {
                                  return <span className="badge bg-info">Sắp diễn ra</span>;
                                }
                                if (meta.isExpiringSoon) {
                                  return <span className="badge bg-warning text-dark">⏰ Sắp hết hạn</span>;
                                }
                                // active
                                return <span className="badge bg-success">Hoạt động</span>;
                              })()}
                            </div>
                          </div>

                  <div className="mt-auto d-flex">
                    <button
                      className="btn btn-info text-white w-100"
                      onClick={() => openPromoModal(item)}
                      disabled={isExpired || isUpcoming || !isActive}
                      title={isExpired ? 'Khuyến mãi đã hết hạn' : isUpcoming ? 'Khuyến mãi sắp diễn ra' : (!isActive ? 'Khuyến mãi đã ngưng hoạt động' : 'Xem chi tiết khuyến mãi')}
                    >
                      Xem chi tiết khuyến mãi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Promotion Detail Modal (now a reusable component) */}
      <PromotionModal open={modalOpen} data={modalData} onClose={closeModal} onApply={handleModalApply} />

      {/* NOTE: modal removed - promotion detail is on its own page (/promotions/:id) */}
      <style>{`
        .promo-card{ background: #fff; transition: transform .15s ease, box-shadow .15s ease; }
        .promo-card:hover{ transform: translateY(-6px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        .promotions-page { background: #f8fafb; padding: 18px; border-radius: 6px; }
      `}</style>
    </div>
  );
}

export default PromotionsSection;
