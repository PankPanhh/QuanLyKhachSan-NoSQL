// src/page/Admin/UsersManager.jsx
import React, { useEffect, useState } from 'react';
import {
  apiAdminListUsers,
  apiAdminUpdateUserStatus,
  apiAdminAddPoints,
  apiAdminAddPointsByRevenue,
  apiAdminAddPointsByBookings,
  apiAdminRecalcTier
} from '/src/services/adminUsers.js';
import {
  FaSearch,
  FaFilter,
  FaRedo,
  FaLock,
  FaUnlock,
  FaPlus,
  FaMoneyBillWave,
  FaConciergeBell,
  FaSyncAlt,
  FaUsers
} from 'react-icons/fa';

function UsersManager() {
  const accent = '#D16806';

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [rank, setRank] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

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
    setMsg(null);
    setErr(null);
    try {
      const data = await apiAdminListUsers({
        q, role, rank, status, sort, page, limit,
        ...(minPoints ? { minPoints } : {}),
        ...(maxPoints ? { maxPoints } : {})
      });
      setRows(data.items || []);
    } catch (e) {
      setErr(e?.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, role, rank, status, sort, page]);

  const doStatus = async (id, TrangThai) => {
    try {
      await apiAdminUpdateUserStatus(id, TrangThai);
      setMsg('Cập nhật trạng thái thành công');
      load();
    } catch (e) {
      setErr(e?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const doAddPoints = async (id) => {
    const delta = Number(prompt('Nhập số điểm cộng thêm:', '100'));
    if (!delta || Number.isNaN(delta)) return;
    try {
      await apiAdminAddPoints(id, delta);
      setMsg(`Đã cộng ${delta} điểm`);
      load();
    } catch (e) {
      setErr(e?.message || 'Lỗi cộng điểm');
    }
  };

  const doAddRevenue = async (id) => {
    const amt = Number(prompt('Nhập doanh thu (VND):', '1000000'));
    if (!amt || Number.isNaN(amt)) return;
    try {
      await apiAdminAddPointsByRevenue(id, amt);
      setMsg(`Đã cộng điểm theo doanh thu ${amt.toLocaleString('vi-VN')} VND`);
      load();
    } catch (e) {
      setErr(e?.message || 'Lỗi cộng điểm theo doanh thu');
    }
  };

  const doAddBookings = async (id) => {
    const cnt = Number(prompt('Nhập số lần đặt phòng:', '1'));
    if (!cnt || Number.isNaN(cnt)) return;
    try {
      await apiAdminAddPointsByBookings(id, cnt);
      setMsg(`Đã cộng điểm theo ${cnt} lần đặt phòng`);
      load();
    } catch (e) {
      setErr(e?.message || 'Lỗi cộng điểm theo lượt đặt');
    }
  };

  const doRecalc = async (id) => {
    try {
      await apiAdminRecalcTier(id);
      setMsg('Đã tính lại hạng theo điểm hiện tại');
      load();
    } catch (e) {
      setErr(e?.message || 'Lỗi tính lại hạng');
    }
  };

  const badge = (text, colorBg, colorText = '#fff') => (
    <span className="badge" style={{ background: colorBg, color: colorText }}>{text}</span>
  );

  const renderStatus = (s) => {
    if (s === 'Hoạt động') return badge('Hoạt động', 'linear-gradient(135deg,#16a34a,#22c55e)');
    if (s === 'Bị khóa') return badge('Bị khóa', 'linear-gradient(135deg,#ef4444,#dc2626)');
    return badge(s || '—', '#64748b');
  };

  const renderRole = (r) => {
    if (r === 'Admin') return badge('Admin', 'linear-gradient(135deg,#0ea5e9,#0284c7)');
    if (r === 'NhanVien') return badge('Nhân viên', 'linear-gradient(135deg,#f59e0b,#d97706)');
    return badge('Khách hàng', '#6366f1');
  };

  const renderRank = (r) => {
    if (r === 'Platinum') return badge('Platinum', 'linear-gradient(135deg,#a1a1aa,#fafafa)', '#1f2937');
    if (r === 'Gold') return badge('Gold', 'linear-gradient(135deg,#fbbf24,#f59e0b)', '#111827');
    return badge('Silver', 'linear-gradient(135deg,#e5e7eb,#cbd5e1)', '#111827');
  };

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        .card {
          background: #fff;
          border: 1px solid rgba(209,104,6,0.12);
          border-radius: 16px;
          box-shadow: 0 12px 30px rgba(209,104,6,0.08);
        }
        .toolbar {
          display: grid;
          gap: 10px;
          grid-template-columns: 1.6fr repeat(4, 1fr) 1fr 1fr 140px 120px;
        }
        @media (max-width: 1200px) {
          .toolbar { grid-template-columns: 1fr 1fr; }
        }
        .input, .select {
          width: 100%;
          border: 2px solid #f3f4f6;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: all .2s ease;
          background: #fff;
          color: #111827;
        }
        .input:focus, .select:focus {
          border-color: ${accent};
          box-shadow: 0 0 0 4px rgba(209,104,6,.12);
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 700;
          transition: transform .15s ease, box-shadow .2s ease, opacity .2s;
          color: #fff;
          background: linear-gradient(135deg, ${accent}, #e67e22);
          box-shadow: 0 6px 18px rgba(209,104,6,0.25);
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(209,104,6,0.35); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .btn-ghost {
          background: transparent; color: #111827; border: 1px solid #e5e7eb;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #111827;
        }
        .title h2 { margin: 0; font-size: 22px; }
        .sub { color: #6b7280; font-size: 13px; }
        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          display: inline-block;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
        }
        .table-wrap { overflow: auto; border-radius: 14px; border: 1px solid #eef2f7; }
        table { width: 100%; border-collapse: collapse; background: #fff; }
        thead th {
          position: sticky; top: 0; z-index: 5;
          background: linear-gradient(180deg,#fafafa,#f3f4f6);
          color: #374151; text-align: left; font-size: 13px; letter-spacing: .3px;
          border-bottom: 1px solid #e5e7eb; padding: 12px 14px;
        }
        tbody td { padding: 13px 14px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827; }
        tbody tr:hover { background: #fafafa; }

        /* Action buttons compact + tooltip (MỚI) */
        .actions-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          position: relative;
        }
        .btn-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: none;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          background: #64748b;
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
          transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
        }
        .btn-icon:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(0,0,0,0.15);
          filter: brightness(1.02);
        }
        .btn-icon .icon { font-size: 14px; }

        .btn-icon[data-tip] { position: relative; }
        .btn-icon[data-tip]::after {
          content: attr(data-tip);
          position: absolute;
          bottom: 44px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          background: #111827;
          border-radius: 8px;
          white-space: nowrap;
          box-shadow: 0 8px 18px rgba(17,24,39,0.25);
          opacity: 0;
          pointer-events: none;
          transition: opacity .12s ease, transform .12s ease;
          transform-origin: bottom center;
        }
        .btn-icon[data-tip]:hover::after {
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }

        .c-green { background: linear-gradient(135deg,#16a34a,#22c55e); }
        .c-red   { background: linear-gradient(135deg,#ef4444,#dc2626); }
        .c-indigo{ background: linear-gradient(135deg,#6366f1,#4f46e5); }
        .c-amber { background: linear-gradient(135deg,#f59e0b,#d97706); }
        .c-cyan  { background: linear-gradient(135deg,#06b6d4,#0891b2); }
        .c-dark  { background: linear-gradient(135deg,#374151,#111827); }

        .info, .error {
          padding: 10px 14px; border-radius: 12px; margin: 10px 0 14px;
          font-size: 13px; font-weight: 600;
        }
        .info  { background: rgba(22,163,74,.08); color: #166534; border: 1px solid rgba(22,163,74,.2); }
        .error { background: rgba(239,68,68,.08); color: #991b1b; border: 1px solid rgba(239,68,68,.2); }

        .loading {
          position: absolute; inset: 0; background: rgba(255,255,255,.5);
          display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);
          border-radius: 16px;
        }
        .spin {
          width: 28px; height: 28px; border: 3px solid rgba(0,0,0,0.1); border-top-color: ${accent};
          border-radius: 50%; animation: s .9s linear infinite;
        }
        @keyframes s { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .actions-compact { gap: 6px; }
          .btn-icon { width: 34px; height: 34px; border-radius: 10px; }
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="title">
          <FaUsers color={accent} size={22} />
          <div>
            <h2>Quản trị người dùng</h2>
            <div className="sub">Quản lý trạng thái, lọc danh sách, tích điểm & nâng hạng</div>
          </div>
        </div>
      </div>

      {/* Filter card */}
      <div className="card" style={{ padding: 16, position: 'relative', marginBottom: 16 }}>
        <div className="toolbar">
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', top: 13, left: 12, color: '#9ca3af' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Tìm tên / email / SĐT"
            />
          </div>

          <select className="select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">Vai trò</option>
            <option value="KhachHang">Khách hàng</option>
            <option value="NhanVien">Nhân viên</option>
            <option value="Admin">Admin</option>
          </select>

          <select className="select" value={rank} onChange={(e) => { setRank(e.target.value); setPage(1); }}>
            <option value="">Hạng</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>

          <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Bị khóa">Bị khóa</option>
          </select>

          <select className="select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="date_desc">Mới nhất</option>
            <option value="date_asc">Cũ nhất</option>
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
            <option value="points_desc">Điểm cao → thấp</option>
            <option value="points_asc">Điểm thấp → cao</option>
          </select>

          <input
            className="input"
            type="number"
            value={minPoints}
            onChange={(e) => setMinPoints(e.target.value)}
            placeholder="Min điểm"
          />
          <input
            className="input"
            type="number"
            value={maxPoints}
            onChange={(e) => setMaxPoints(e.target.value)}
            placeholder="Max điểm"
          />

          <button className="btn" onClick={() => { setPage(1); load(); }}>
            <FaFilter /> Lọc
          </button>
          <button className="btn btn-ghost" onClick={resetFilters}>
            <FaRedo /> Reset
          </button>
        </div>

        {loading && (
          <div className="loading">
            <div className="spin" />
          </div>
        )}
      </div>

      {msg && <div className="info">{msg}</div>}
      {err && <div className="error">{err}</div>}

      {/* Table card */}
      <div className="card" style={{ padding: 12 }}>
        <div className="table-wrap">
          <table>
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
            <tbody>
              {(rows || []).map((r) => (
                <tr key={r._id}>
                  <td>{r.HoTen}</td>
                  <td>{r.Email}</td>
                  <td>{renderRole(r.VaiTro)}</td>
                  <td>{renderRank(r.HangThanhVien)}</td>
                  <td>{(r.DiemTichLuy || 0).toLocaleString('vi-VN')}</td>
                  <td>{renderStatus(r.TrangThai)}</td>
                  <td>
                    <div className="actions-compact">
                      {r.TrangThai === 'Hoạt động' ? (
                        <button
                          className="btn-icon c-red"
                          data-tip="Khoá tài khoản"
                          aria-label="Khoá tài khoản"
                          onClick={() => doStatus(r._id, 'Bị khóa')}
                        >
                          <FaLock className="icon" />
                        </button>
                      ) : (
                        <button
                          className="btn-icon c-green"
                          data-tip="Mở khoá tài khoản"
                          aria-label="Mở khoá tài khoản"
                          onClick={() => doStatus(r._id, 'Hoạt động')}
                        >
                          <FaUnlock className="icon" />
                        </button>
                      )}

                      <button
                        className="btn-icon c-indigo"
                        data-tip="+ Điểm"
                        aria-label="Cộng điểm"
                        onClick={() => doAddPoints(r._id)}
                      >
                        <FaPlus className="icon" />
                      </button>

                      <button
                        className="btn-icon c-amber"
                        data-tip="+ Doanh thu"
                        aria-label="Cộng điểm theo doanh thu"
                        onClick={() => doAddRevenue(r._id)}
                      >
                        <FaMoneyBillWave className="icon" />
                      </button>

                      <button
                        className="btn-icon c-cyan"
                        data-tip="+ Lượt đặt"
                        aria-label="Cộng điểm theo lượt đặt"
                        onClick={() => doAddBookings(r._id)}
                      >
                        <FaConciergeBell className="icon" />
                      </button>

                      <button
                        className="btn-icon c-dark"
                        data-tip="Tính lại hạng"
                        aria-label="Tính lại hạng"
                        onClick={() => doRecalc(r._id)}
                      >
                        <FaSyncAlt className="icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UsersManager;