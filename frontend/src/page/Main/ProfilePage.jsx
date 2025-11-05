import React, {
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AuthContext } from "../../context/AuthContext";
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
  FaImage,
} from "react-icons/fa";
import { isPaymentSuccessful } from "../../utils/paymentUtils";

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
  const fullName = u?.HoTen || u?.name || "Không có thông tin";
  const email = u?.Email || u?.email || "Không có thông tin";
  const joinedAt = u?.NgayDangKy || u?.createdAt;
  const joinDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString("vi-VN")
    : "Không có thông tin";
  const phone = u?.SoDienThoai || u?.phone || "";
  const address = u?.DiaChi || u?.address || "";
  const birth = u?.NgaySinh
    ? new Date(u.NgaySinh).toLocaleDateString("vi-VN")
    : u?.birthDate || "";
  const roleVN = u?.isAdmin
    ? "Quản trị viên"
    : u?.VaiTro === "Admin"
    ? "Quản trị viên"
    : u?.VaiTro === "NhanVien"
    ? "Nhân viên"
    : "Khách hàng";
  const hang = u?.HangThanhVien || u?.hangThanhVien || "Silver";
  const diem =
    typeof u?.DiemTichLuy === "number" ? u.DiemTichLuy : u?.diemTichLuy ?? 0;
  const idNguoiDung = u?.IDNguoiDung || u?.idNguoiDung || u?._id || "—";
  const avatarSrc = u?.AnhDaiDien || u?.avatar || null;
  // NOTE: backend mounts routes under /api/v1
  const BASE_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";

  // Booking history state
  const [bookings, setBookings] = useState([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsLimit, setBookingsLimit] = useState(6);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState({});

  const fetchBookings = useCallback(
    async (page = bookingsPage, limit = bookingsLimit) => {
      try {
        setBookingsLoading(true);
        setBookingsError(null);
        const token = localStorage.getItem("token");
        const q = `page=${page}&limit=${limit}`;
        const res = await fetch(`${BASE_URL}/profile/me/bookings?${q}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data?.message || `${res.status} ${res.statusText}`);
        setBookings(data.items || []);
        setBookingsTotal(data.total || 0);
        setBookingsPage(data.page || page);
        setBookingsLimit(data.limit || limit);
      } catch (e) {
        setBookingsError(e?.message || "Lỗi khi tải lịch sử đặt phòng");
      } finally {
        setBookingsLoading(false);
      }
    },
    [BASE_URL, bookingsLimit, bookingsPage]
  );

  useEffect(() => {
    if (!user) return;
    fetchBookings(bookingsPage, bookingsLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bookingsPage, bookingsLimit]);

  const toggleExpand = (maDatPhong) => {
    setExpandedBooking((s) => ({ ...s, [maDatPhong]: !s[maDatPhong] }));
  };

  // ====== THÊM: state form edit ======
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fBirth, setFBirth] = useState(""); // yyyy-MM-dd
  const [fAvatarPreview, setFAvatarPreview] = useState(null);
  const [fAvatarBase64, setFAvatarBase64] = useState("");

  const toInputDate = (d) => {
    try {
      if (!d) return "";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "";
      const y = dt.getFullYear();
      const m = `${dt.getMonth() + 1}`.padStart(2, "0");
      const dd = `${dt.getDate()}`.padStart(2, "0");
      return `${y}-${m}-${dd}`;
    } catch {
      return "";
    }
  };

  const onClickEdit = () => {
    setErr(null);
    setMsg(null);
    setIsEditing(true);
    setFName(u?.HoTen || u?.name || "");
    setFPhone(phone || "");
    setFAddress(address || "");
    setFBirth(toInputDate(u?.NgaySinh));
    setFAvatarPreview(avatarSrc || null);
    setFAvatarBase64("");
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
      setFAvatarBase64("");
      return;
    }
    const preview = URL.createObjectURL(file);
    setFAvatarPreview(preview);
    const b64 = await readFileAsBase64(file);
    setFAvatarBase64(b64);
  };

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
        ...(fAvatarBase64 ? { AnhDaiDien: fAvatarBase64 } : {}),
      };

      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `${res.status} ${res.statusText}`);
      }

      // Backend trả { message, user }
      const newUser = data?.user || null;
      if (newUser) setLocalUser(newUser);

      setMsg("Cập nhật thành công");
      setIsEditing(false);
    } catch (e) {
      setErr(e?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container padding-large text-center">
        <h2>Vui lòng đăng nhập để xem thông tin tài khoản</h2>
      </div>
    );
  }

  return (
    <div className="container padding-large">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #fdf9f4 100%)",
              borderRadius: "20px",
              padding: "40px",
              boxShadow: "0 15px 50px rgba(209, 104, 6, 0.1)",
              border: "1px solid rgba(209, 104, 6, 0.1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "40px",
                paddingBottom: "30px",
                borderBottom: "2px solid rgba(209, 104, 6, 0.1)",
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  background: "linear-gradient(135deg, #D16806, #e67e22)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 10px 30px rgba(209, 104, 6, 0.3)",
                  position: "relative",
                }}
              >
                <FaUser style={{ color: "white", fontSize: "40px" }} />
                {(fAvatarPreview || avatarSrc) && (
                  <img
                    src={fAvatarPreview || avatarSrc}
                    alt="avatar"
                    style={{
                      position: "absolute",
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #fff",
                      boxShadow: "0 6px 20px rgba(209, 104, 6, 0.35)",
                      top: 0,
                      left: 0,
                    }}
                  />
                )}
              </div>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "700",
                  color: "#2c3e50",
                  margin: "0 0 10px 0",
                }}
              >
                Thông tin tài khoản
              </h1>
              <p
                style={{
                  color: "#6c757d",
                  fontSize: "1.1rem",
                  margin: 0,
                }}
              >
                Quản lý thông tin cá nhân của bạn
              </p>
            </div>

            {/* THÊM: thông báo */}
            {msg && (
              <div
                style={{
                  background: "rgba(22, 163, 74, 0.1)",
                  border: "1px solid rgba(22, 163, 74, 0.3)",
                  color: "#16a34a",
                  padding: "12px 16px",
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                {msg}
              </div>
            )}
            {err && (
              <div
                style={{
                  background: "rgba(220, 53, 69, 0.1)",
                  border: "1px solid rgba(220, 53, 69, 0.3)",
                  color: "#dc3545",
                  padding: "12px 16px",
                  borderRadius: 12,
                  marginBottom: 16,
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
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaUser
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Họ và tên
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {fullName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaEnvelope
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Email
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ngày tham gia */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaCalendar
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Ngày tham gia
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {joinDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loại tài khoản */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaUser
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Loại tài khoản
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {roleVN}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ngày sinh */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaBirthdayCake
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Ngày sinh
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {birth || "Không có thông tin"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaPhone
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Số điện thoại
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {phone || "Không có thông tin"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="col-md-12">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaMapMarkerAlt
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Địa chỉ
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.05rem",
                              fontWeight: "600",
                            }}
                          >
                            {address || "Không có thông tin"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hạng */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaMedal
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Hạng thành viên
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {hang}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Điểm */}
                  <div className="col-md-6">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaCoins
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Điểm tích lũy
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {diem.toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mã người dùng */}
                  <div className="col-md-12">
                    <div
                      style={{
                        background: "rgba(209, 104, 6, 0.05)",
                        borderRadius: "15px",
                        padding: "25px",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                        }}
                      >
                        <div
                          style={{
                            width: "45px",
                            height: "45px",
                            background:
                              "linear-gradient(135deg, #D16806, #e67e22)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FaIdBadge
                            style={{ color: "white", fontSize: "18px" }}
                          />
                        </div>
                        <div>
                          <h6
                            style={{
                              color: "#2c3e50",
                              margin: "0 0 5px",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Mã người dùng
                          </h6>
                          <p
                            style={{
                              color: "#34495e",
                              margin: 0,
                              fontSize: "1.05rem",
                              fontWeight: "600",
                            }}
                          >
                            {idNguoiDung}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lịch sử đặt phòng */}
                <div style={{ marginTop: 28 }}>
                  <h5
                    style={{
                      marginBottom: 12,
                      color: "#2c3e50",
                      fontWeight: 700,
                    }}
                  >
                    Lịch sử đặt phòng
                  </h5>

                  {bookingsLoading && (
                    <div style={{ color: "#6c757d" }}>Đang tải...</div>
                  )}
                  {bookingsError && (
                    <div style={{ color: "#dc3545", marginBottom: 8 }}>
                      {bookingsError}
                    </div>
                  )}

                  {!bookingsLoading && bookings.length === 0 && (
                    <div style={{ color: "#6c757d" }}>
                      Chưa có lịch sử đặt phòng.
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                    {bookings.map((b) => {
                      const key = b.MaDatPhong || b._id;
                      const ngayDat = b.NgayDat
                        ? new Date(b.NgayDat).toLocaleString("vi-VN")
                        : "-";
                      const ngayNhan = b.NgayNhanPhong
                        ? new Date(b.NgayNhanPhong).toLocaleDateString("vi-VN")
                        : "-";
                      const ngayTra = b.NgayTraPhong
                        ? new Date(b.NgayTraPhong).toLocaleDateString("vi-VN")
                        : "-";
                      const tong = b.HoaDon?.TongTien ?? b.TienCoc ?? 0;
                      return (
                        <div
                          key={key}
                          style={{
                            borderRadius: 12,
                            padding: 12,
                            border: "1px solid rgba(0,0,0,0.06)",
                            background: "#fff",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div
                                style={{ fontWeight: 700, color: "#2c3e50" }}
                              >
                                {b.MaDatPhong || "-"} • {b.MaPhong || "-"}
                              </div>
                              <div style={{ color: "#6c757d", fontSize: 13 }}>
                                {ngayDat}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 700 }}>
                                {tong.toLocaleString("vi-VN")} đ
                              </div>
                              <div style={{ color: "#6c757d", fontSize: 13 }}>
                                {b.TrangThai || "-"}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <div style={{ color: "#34495e", fontSize: 13 }}>
                              Nhận: {ngayNhan}
                            </div>
                            <div style={{ color: "#34495e", fontSize: 13 }}>
                              Trả: {ngayTra}
                            </div>
                            <button
                              onClick={() =>
                                toggleExpand(b.MaDatPhong || b._id)
                              }
                              style={{
                                marginLeft: "auto",
                                background: "transparent",
                                border: "none",
                                color: "#D16806",
                                cursor: "pointer",
                              }}
                            >
                              Chi tiết
                            </button>
                          </div>

                          {expandedBooking[b.MaDatPhong] && (
                            <div
                              style={{
                                marginTop: 10,
                                borderTop: "1px dashed #eee",
                                paddingTop: 10,
                              }}
                            >
                              <div style={{ fontSize: 13, color: "#34495e" }}>
                                Ghi chú: {b.GhiChu || "—"}
                              </div>
                              {b.DichVuSuDung && b.DichVuSuDung.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  <div
                                    style={{ fontWeight: 700, fontSize: 13 }}
                                  >
                                    Dịch vụ
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {b.DichVuSuDung.map((d, i) => (
                                      <li key={i} style={{ fontSize: 13 }}>
                                        {d.MaDichVu} x{d.SoLuong} —{" "}
                                        {(d.ThanhTien || 0).toLocaleString(
                                          "vi-VN"
                                        )}{" "}
                                        đ
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Hóa đơn */}
                              {b.HoaDon && (
                                <div style={{ marginTop: 8 }}>
                                  <div
                                    style={{ fontWeight: 700, fontSize: 13 }}
                                  >
                                    Hóa đơn
                                  </div>
                                  {(() => {
                                    const hd = b.HoaDon || {};
                                    const paid = (hd.LichSuThanhToan || []).reduce(
                                      (s, p) =>
                                        isPaymentSuccessful(p?.TrangThai)
                                          ? s + (Number(p?.SoTien) || 0)
                                          : s,
                                      0
                                    );

                                    const gg = hd.GiamGia;
                                    const showDiscount = (() => {
                                      if (gg == null) return false;
                                      if (typeof gg === "number")
                                        return gg !== 0;
                                      if (typeof gg === "string")
                                        return gg !== "0" && gg !== "0đ";
                                      if (typeof gg === "object") {
                                        const entries = Object.entries(
                                          gg
                                        ).filter(
                                          ([k, v]) =>
                                            k !== "_id" &&
                                            v != null &&
                                            v !== "" &&
                                            !(typeof v === "number" && v === 0)
                                        );
                                        return entries.length > 0;
                                      }
                                      return Boolean(gg);
                                    })();

                                    return (
                                      <div
                                        style={{ marginTop: 6, fontSize: 13 }}
                                      >
                                        <div>
                                          Mã hóa đơn: {hd.MaHoaDon || "-"}
                                        </div>
                                        <div>
                                          Ngày lập:{" "}
                                          {hd.NgayLap
                                            ? new Date(
                                                hd.NgayLap
                                              ).toLocaleString("vi-VN")
                                            : "-"}
                                        </div>
                                        <div>
                                          Tiền phòng:{" "}
                                          {(
                                            hd.TongTienPhong || 0
                                          ).toLocaleString("vi-VN")}{" "}
                                          đ
                                        </div>
                                        <div>
                                          Tiền dịch vụ:{" "}
                                          {(
                                            hd.TongTienDichVu || 0
                                          ).toLocaleString("vi-VN")}{" "}
                                          đ
                                        </div>
                                        {showDiscount && (
                                          <div>
                                            Giảm giá:{" "}
                                            {(() => {
                                              if (typeof gg === "number")
                                                return `${gg.toLocaleString(
                                                  "vi-VN"
                                                )} đ`;
                                              if (typeof gg === "string")
                                                return gg;
                                              if (typeof gg === "object") {
                                                const entries = Object.entries(
                                                  gg
                                                ).filter(([k]) => k !== "_id");
                                                return entries.map(
                                                  ([k, v], idx) => (
                                                    <span key={k}>
                                                      {k}:{" "}
                                                      {typeof v === "number"
                                                        ? v.toLocaleString(
                                                            "vi-VN"
                                                          ) + " đ"
                                                        : String(v)}
                                                      {idx < entries.length - 1
                                                        ? ", "
                                                        : ""}
                                                    </span>
                                                  )
                                                );
                                              }
                                              return String(gg);
                                            })()}
                                          </div>
                                        )}

                                        <div>
                                          Tổng tiền:{" "}
                                          {(hd.TongTien || 0).toLocaleString(
                                            "vi-VN"
                                          )}{" "}
                                          đ
                                        </div>

                                        <div>
                                          Số tiền đã thanh toán:{" "}
                                          {paid.toLocaleString("vi-VN")} đ
                                        </div>

                                        <div>
                                          Tình trạng: {hd.TinhTrang || "-"}
                                        </div>
                                        {hd.GhiChu && (
                                          <div>Ghi chú: {hd.GhiChu}</div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {b.HoaDon?.LichSuThanhToan &&
                                b.HoaDon.LichSuThanhToan.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    <div
                                      style={{ fontWeight: 700, fontSize: 13 }}
                                    >
                                      Lịch sử thanh toán
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                                      {b.HoaDon.LichSuThanhToan.map((p) => (
                                        <li
                                          key={p.MaThanhToan || p._id}
                                          style={{ fontSize: 13 }}
                                        >
                                          {new Date(
                                            p.NgayThanhToan
                                          ).toLocaleString("vi-VN")}{" "}
                                          —{" "}
                                          {(p.SoTien || 0).toLocaleString(
                                            "vi-VN"
                                          )}{" "}
                                          đ — {p.TrangThai}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* pagination */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 12,
                      alignItems: "center",
                    }}
                  >
                    <button
                      disabled={bookingsPage <= 1}
                      onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Trang trước
                    </button>
                    <div style={{ color: "#6c757d" }}>
                      {bookingsPage} /{" "}
                      {Math.max(
                        1,
                        Math.ceil(bookingsTotal / bookingsLimit) || 1
                      )}
                    </div>
                    <button
                      disabled={
                        bookingsPage >= Math.ceil(bookingsTotal / bookingsLimit)
                      }
                      onClick={() => setBookingsPage((p) => p + 1)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>

                {/* Action Buttons (giữ nút cũ, thêm onClick) */}
                <div
                  style={{
                    marginTop: "40px",
                    paddingTop: "30px",
                    borderTop: "2px solid rgba(209, 104, 6, 0.1)",
                    textAlign: "center",
                  }}
                >
                  <button
                    style={{
                      background: "linear-gradient(135deg, #D16806, #e67e22)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px 30px",
                      color: "white",
                      fontSize: "1rem",
                      fontWeight: "600",
                      boxShadow: "0 4px 15px rgba(209, 104, 6, 0.3)",
                      transition: "all 0.3s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0 6px 20px rgba(209, 104, 6, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 4px 15px rgba(209, 104, 6, 0.3)";
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
                  background: "rgba(209, 104, 6, 0.04)",
                  border: "1px solid rgba(209, 104, 6, 0.15)",
                  borderRadius: 16,
                  padding: 20,
                  marginTop: 10,
                }}
              >
                <div className="row g-3">
                  {/* Họ tên */}
                  <div className="col-md-6">
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Họ và tên
                    </label>
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
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      className="form-control"
                      disabled
                    />
                  </div>

                  {/* Ngày sinh */}
                  <div className="col-md-6">
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={fBirth}
                      onChange={(e) => setFBirth(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  {/* SĐT */}
                  <div className="col-md-6">
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Số điện thoại
                    </label>
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
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Địa chỉ
                    </label>
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
                    <label
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Ảnh đại diện (tùy chọn)
                    </label>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onAvatarChange}
                      />
                      <FaImage color="#D16806" />
                      {(fAvatarPreview || avatarSrc) && (
                        <img
                          src={fAvatarPreview || avatarSrc}
                          alt="preview"
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid #eee",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Action save/cancel */}
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    style={{
                      background: "linear-gradient(135deg, #16a34a, #22c55e)",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 18px",
                      color: "#fff",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    <FaSave />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>

                  <button
                    onClick={onCancel}
                    type="button"
                    style={{
                      background: "transparent",
                      border: "1px solid #e9ecef",
                      borderRadius: 10,
                      padding: "10px 18px",
                      color: "#353535",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
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
