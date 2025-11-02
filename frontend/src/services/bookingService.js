// Đây là file skeleton (khung sườn)
// Bạn có thể thêm logic gọi API (thật hoặc giả) tại đây

// const MOCK_BOOKINGS = [];

import api from "./api";

export const createBooking = async (bookingDetails) => {
  // Try to post to backend bookings endpoint (if available). We'll map
  // the incoming bookingDetails into the DatPhong shape and also provide a
  // fallback: if the API is not reachable, persist to localStorage (mock DB).
  const now = new Date();

  // determine customer id
  const IDKhachHang =
    bookingDetails.userId ||
    bookingDetails.user ||
    bookingDetails.userID ||
    null;

  // Determine room code
  const MaPhong =
    (bookingDetails.room &&
      (bookingDetails.room.MaPhong || bookingDetails.room.MaPhong)) ||
    (bookingDetails.room &&
      (bookingDetails.room._id || bookingDetails.roomId)) ||
    bookingDetails.roomId ||
    null;

  const NgayDat = now;
  const NgayNhanPhong = bookingDetails.checkIn
    ? new Date(bookingDetails.checkIn)
    : new Date();
  const NgayTraPhong = bookingDetails.checkOut
    ? new Date(bookingDetails.checkOut)
    : new Date(NgayNhanPhong.getTime() + 24 * 3600 * 1000);
  const SoNguoi = bookingDetails.numGuests || bookingDetails.guests || 1;

  // Payment meta from frontend
  const pm = bookingDetails.paymentMeta || {};
  const paidAmount = pm.amount || 0;
  const paymentMethod =
    bookingDetails.paymentMethod || (pm && pm.method) || "Chuyển khoản";

  // Room total (try provided total or compute from paymentMeta)
  const TongTienPhong = bookingDetails.totalRoomPrice || pm.totalRoomPrice || 0;
  const TongTienDichVu = pm.totalServicePrice || 0;
  const GiamGia = pm.discount || 0;
  const TongTien =
    (TongTienPhong || 0) + (TongTienDichVu || 0) - (GiamGia || 0);

  // HoaDon & LichSuThanhToan
  const HoaDon = {
    MaHoaDon: `HD${Date.now().toString().slice(-6)}`,
    NgayLap: now,
    TongTienPhong: TongTienPhong,
    TongTienDichVu: TongTienDichVu,
    GiamGia: GiamGia,
    TongTien: TongTien,
    TinhTrang:
      paidAmount >= TongTien
        ? "Đã thanh toán"
        : paidAmount > 0
        ? "Thanh toán một phần"
        : "Chưa thanh toán",
    GhiChu: pm.note || "",
    LichSuThanhToan: [],
  };

  if (paidAmount > 0) {
    HoaDon.LichSuThanhToan.push({
      MaThanhToan: `TT${Date.now().toString().slice(-6)}`,
      PhuongThuc:
        paymentMethod === "card"
          ? "Thẻ tín dụng"
          : paymentMethod === "paypal"
          ? "Thẻ tín dụng"
          : "Chuyển khoản",
      SoTien: paidAmount,
      NgayThanhToan: now,
      TrangThai: "Đang xử lý",
      GhiChu: pm.bankReference || pm.qrUrl || pm.note || "",
    });
  }

  const doc = {
    MaDatPhong: `DP${Date.now().toString().slice(-6)}`,
    IDKhachHang: IDKhachHang,
    MaPhong: MaPhong,
    NgayDat: NgayDat,
    NgayNhanPhong: NgayNhanPhong,
    NgayTraPhong: NgayTraPhong,
    SoNguoi: SoNguoi,
    TienCoc:
      paymentMethod === "Chuyển khoản" && paidAmount
        ? paidAmount
        : paymentMethod === "onArrival" && paidAmount
        ? paidAmount
        : paymentMethod === "card" || paymentMethod === "paypal"
        ? paidAmount
        : 0,
    TrangThai: "Đang chờ",
    GhiChu: bookingDetails.note || pm.note || bookingDetails.GhiChu || "",
    DichVuSuDung: bookingDetails.services || [],
    HoaDon,
    LichSuThanhToan: HoaDon.LichSuThanhToan,
    createdAt: now,
  };

  // Try posting to backend first
  try {
    const resp = await api.post("/bookings", bookingDetails);
    return resp;
  } catch (err) {
    console.warn(
      "Gọi API /bookings thất bại, lưu local mock DatPhong. Error:",
      err.message
    );
    // Fallback: save to localStorage
    const key = "mockDatPhong";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(doc);
    localStorage.setItem(key, JSON.stringify(existing, null, 2));
    return { success: true, stored: "local", doc };
  }
};

export const getUserBookings = async (userId) => {
  console.log("Đang lấy lịch sử booking (giả lập) cho user:", userId);
  return []; // Trả về mảng rỗng
};

export const adminGetAllBookings = async () => {
  try {
    const response = await api.get("/bookings");
    const data = response.data || response;
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bookings:", error);
    throw error;
  }
};

export const adminConfirmBooking = async (id) => {
  try {
    const response = await api.request(`/bookings/${id}/confirm`, {
      method: "PATCH",
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi xác nhận booking:", error);
    throw error;
  }
};

export const adminCancelBooking = async (id) => {
  try {
    const response = await api.request(`/bookings/${id}/cancel`, {
      method: "PATCH",
    });
    return response;
  } catch (error) {
    console.error("Lỗi khi hủy booking:", error);
    throw error;
  }
};
