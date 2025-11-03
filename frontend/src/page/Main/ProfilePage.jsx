import React, { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaEdit,
  FaPhone,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaMedal,
  FaCoins,
  FaIdBadge,
  FaSave,
  FaTimes,
  FaImage
} from 'react-icons/fa';

function ProfilePage() {
  const { user } = useContext(AuthContext);

  // ====== THÊM: trạng thái chỉnh sửa + form ======
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [localUser, setLocalUser] = useState(null);

  // Lấy base user hiển thị (ưu tiên localUser sau khi update)
  const u = useMemo(() => localUser || user, [localUser, user]);

  // Fallback an toàn
  const fullName = u?.HoTen || u?.name || 'Không có thông tin';
  const email = u?.Email || u?.email || 'Không có thông tin';
  const joinedAt = u?.NgayDangKy || u?.createdAt;
  const joinDate = joinedAt ? new Date(joinedAt).toLocaleDateString('vi-VN') : 'Không có thông tin';
  const phone = u?.SoDienThoai || u?.phone || '';
  const address = u?.DiaChi || u?.address || '';
  const birth = u?.NgaySinh ? new Date(u.NgaySinh).toLocaleDateString('vi-VN') : (u?.birthDate || '');
  const roleVN = u?.isAdmin
    ? 'Quản trị viên'
    : u?.VaiTro === 'Admin'
    ? 'Quản trị viên'
    : u?.VaiTro === 'NhanVien'
    ? 'Nhân viên'
    : 'Khách hàng';
  const hang = u?.HangThanhVien || u?.hangThanhVien || 'Silver';
  const diem = typeof u?.DiemTichLuy === 'number' ? u.DiemTichLuy : (u?.diemTichLuy ?? 0);
  const idNguoiDung = u?.IDNguoiDung || u?.idNguoiDung || u?._id || '—';
  const avatarSrc = u?.AnhDaiDien || u?.avatar || null;

  if (!user) {
    return (
      <div className="container padding-large text-center">
        <h2>Vui lòng đăng nhập để xem thông tin tài khoản</h2>
      </div>
    );
  }

  // ====== THÊM: state form edit ======
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fBirth, setFBirth] = useState(''); // yyyy-MM-dd
  const [fAvatarPreview, setFAvatarPreview] = useState(null);
  const [fAvatarBase64, setFAvatarBase64] = useState('');

  const toInputDate = (d) => {
    try {
      if (!d) return '';
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      const y = dt.getFullYear();
      const m = `${dt.getMonth() + 1}`.padStart(2, '0');
      const dd = `${dt.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${dd}`;
    } catch {
      return '';
    }
  };

  const onClickEdit = () => {
    setErr(null);
    setMsg(null);
    setIsEditing(true);
    setFName(u?.HoTen || u?.name || '');
    setFPhone(phone || '');
    setFAddress(address || '');
    setFBirth(toInputDate(u?.NgaySinh));
    setFAvatarPreview(avatarSrc || null);
    setFAvatarBase64('');
  };

  const onCancel = () => {
    setIsEditing(false);
    setErr(null);
    setMsg(null);
    // không reset localUser để vẫn giữ hiển thị hiện tại
  };

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFAvatarPreview(null);
      setFAvatarBase64('');
      return;
    }
    const preview = URL.createObjectURL(file);
    setFAvatarPreview(preview);
    const b64 = await readFileAsBase64(file);
    setFAvatarBase64(b64);
  };

  const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

  const onSave = async () => {
    try {
      setSaving(true);
      setErr(null);
      setMsg(null);

      const payload = {
        HoTen: fName,
        SoDienThoai: fPhone,
        DiaChi: fAddress,
        NgaySinh: fBirth || undefined,
        ...(fAvatarBase64 ? { AnhDaiDien: fAvatarBase64 } : {})
      };

      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `${res.status} ${res.statusText}`);
      }

      // Backend trả { message, user }
      const newUser = data?.user || null;
      if (newUser) setLocalUser(newUser);

      setMsg('Cập nhật thành công');
      setIsEditing(false);
    } catch (e) {
      setErr(e?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container padding-large">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fdf9f4 100%)',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 15px 50px rgba(209, 104, 6, 0.1)',
              border: '1px solid rgba(209, 104, 6, 0.1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '40px',
                paddingBottom: '30px',
                borderBottom: '2px solid rgba(209, 104, 6, 0.1)'
              }}
            >
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #D16806, #e67e22)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 10px 30px rgba(209, 104, 6, 0.3)',
                  position: 'relative'
                }}
              >
                <FaUser style={{ color: 'white', fontSize: '40px' }} />
                {(fAvatarPreview || avatarSrc) && (
                  <img
                    src={fAvatarPreview || avatarSrc}
                    alt="avatar"
                    style={{
                      position: 'absolute',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #fff',
                      boxShadow: '0 6px 20px rgba(209, 104, 6, 0.35)',
                      top: 0,
                      left: 0
                    }}
                  />
                )}
              </div>
              <h1
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#2c3e50',
                  margin: '0 0 10px 0'
                }}
              >
                Thông tin tài khoản
              </h1>
              <p
                style={{
                  color: '#6c757d',
                  fontSize: '1.1rem',
                  margin: 0
                }}
              >
                Quản lý thông tin cá nhân của bạn
              </p>
            </div>

            {/* THÊM: thông báo */}
            {msg && (
              <div
                style={{
                  background: 'rgba(22, 163, 74, 0.1)',
                  border: '1px solid rgba(22, 163, 74, 0.3)',
                  color: '#16a34a',
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 16
                }}
              >
                {msg}
              </div>
            )}
            {err && (
              <div
                style={{
                  background: 'rgba(220, 53, 69, 0.1)',
                  border: '1px solid rgba(220, 53, 69, 0.3)',
                  color: '#dc3545',
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 16
                }}
              >
                {err}
              </div>
            )}

            {/* VIEW MODE */}
            {!isEditing && (
              <>
                <div className="row g-4">
                  {/* Họ tên */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaUser style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Họ và tên
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{fullName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaEnvelope style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Email
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ngày tham gia */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaCalendar style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Ngày tham gia
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{joinDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loại tài khoản */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaUser style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Loại tài khoản
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{roleVN}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ngày sinh */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaBirthdayCake style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Ngày sinh
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                            {birth || 'Không có thông tin'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaPhone style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Số điện thoại
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                            {phone || 'Không có thông tin'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="col-md-12">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaMapMarkerAlt style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Địa chỉ
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.05rem', fontWeight: '600' }}>
                            {address || 'Không có thông tin'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hạng */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaMedal style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Hạng thành viên
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{hang}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Điểm */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaCoins style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Điểm tích lũy
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                            {diem.toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mã người dùng */}
                  <div className="col-md-12">
                    <div
                      style={{
                        background: 'rgba(209, 104, 6, 0.05)',
                        borderRadius: '15px',
                        padding: '25px',
                        border: '1px solid rgba(209, 104, 6, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div
                          style={{
                            width: '45px',
                            height: '45px',
                            background: 'linear-gradient(135deg, #D16806, #e67e22)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaIdBadge style={{ color: 'white', fontSize: '18px' }} />
                        </div>
                        <div>
                          <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                            Mã người dùng
                          </h6>
                          <p style={{ color: '#34495e', margin: 0, fontSize: '1.05rem', fontWeight: '600' }}>
                            {idNguoiDung}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons (giữ nút cũ, thêm onClick) */}
                <div
                  style={{
                    marginTop: '40px',
                    paddingTop: '30px',
                    borderTop: '2px solid rgba(209, 104, 6, 0.1)',
                    textAlign: 'center'
                  }}
                >
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #D16806, #e67e22)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 30px',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 15px rgba(209, 104, 6, 0.3)',
                      transition: 'all 0.3s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(209, 104, 6, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(209, 104, 6, 0.3)';
                    }}
                    onClick={onClickEdit}
                  >
                    <FaEdit />
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </>
            )}

            {/* EDIT MODE */}
            {isEditing && (
              <div
                style={{
                  background: 'rgba(209, 104, 6, 0.04)',
                  border: '1px solid rgba(209, 104, 6, 0.15)',
                  borderRadius: 16,
                  padding: 20,
                  marginTop: 10
                }}
              >
                <div className="row g-3">
                  {/* Họ tên */}
                  <div className="col-md-6">
                    <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Họ và tên</label>
                    <input
                      type="text"
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      className="form-control"
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  {/* Email (readonly) */}
                  <div className="col-md-6">
                    <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Email</label>
                    <input type="email" value={email} className="form-control" disabled />
                  </div>

                  {/* Ngày sinh */}
                  <div className="col-md-6">
                    <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Ngày sinh</label>
                    <input
                      type="date"
                      value={fBirth}
                      onChange={(e) => setFBirth(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  {/* SĐT */}
                  <div className="col-md-6">
                    <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Số điện thoại</label>
                    <input
                      type="tel"
                      value={fPhone}
                      onChange={(e) => setFPhone(e.target.value)}
                      className="form-control"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  {/* Địa chỉ */}
                  <div className="col-md-12">
                    <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Địa chỉ</label>
                    <input
                      type="text"
                      value={fAddress}
                      onChange={(e) => setFAddress(e.target.value)}
                      className="form-control"
                      placeholder="Nhập địa chỉ"
                    />
                  </div>

                  {/* Avatar */}
                  <div className="col-md-12">
                    <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                      Ảnh đại diện (tùy chọn)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="file" accept="image/*" onChange={onAvatarChange} />
                      <FaImage color="#D16806" />
                      {(fAvatarPreview || avatarSrc) && (
                        <img
                          src={fAvatarPreview || avatarSrc}
                          alt="preview"
                          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Action save/cancel */}
                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    style={{
                      background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 18px',
                      color: '#fff',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <FaSave />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>

                  <button
                    onClick={onCancel}
                    type="button"
                    style={{
                      background: 'transparent',
                      border: '1px solid #e9ecef',
                      borderRadius: 10,
                      padding: '10px 18px',
                      color: '#353535',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <FaTimes />
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;