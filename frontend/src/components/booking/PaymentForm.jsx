import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import Spinner from "../../components/common/Spinner";
import { BookingContext } from "../../context/BookingContext"; // SỬA: Thêm BookingContext
import { AuthContext } from "../../context/AuthContext"; // SỬA: Thêm AuthContext
import { createBooking } from "../../services/bookingService";
import { getRoomById, getRoomPrice } from "../../services/roomService";

function PaymentForm() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { bookingDetails, clearBookingDetails } = useContext(BookingContext);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card"); // card | paypal | bank | onArrival
  const [bankRef, setBankRef] = useState("");
  const [roomPrice, setRoomPrice] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  // serverPriceInfo intentionally not stored for now; we only prefer server totals when available

  // QR params for bank transfer
  // Start empty so user can type their preferred recipient name. We show the
  // common name as placeholder in the input field.
  const [qrAccountName, setQrAccountName] = useState("");
  const [qrAddInfo, setQrAddInfo] = useState("Thanh toán tiền phòng");
  const [qrUrl, setQrUrl] = useState("");
  const [overrideAmount, setOverrideAmount] = useState(null);
  const [paymentAmountMode, setPaymentAmountMode] = useState("deposit"); // 'deposit' | 'full'
  const DEPOSIT_AMOUNT = 500000;

  // SỬA: Lấy thông tin user từ AuthContext để điền sẵn
  const [formData, setFormData] = useState({
    // AuthContext uses HoTen and Email fields
    fullName: user?.HoTen || user?.name || "",
    email: user?.Email || user?.email || "",
    phone: "",
    ccNumber: "",
    ccExpiry: "",
    ccCvv: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // NOTE: totalAmount is computed in the main compute effect below (which
  // also applies promotions). This small placeholder effect was redundant and
  // could cause the UI to briefly show an un-discounted total — remove it.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Kiểm tra logic đăng nhập
    if (!user) {
      setError("Bạn cần đăng nhập để tiếp tục.");
      setIsLoading(false);
      // Lưu trang hiện tại để quay lại sau khi đăng nhập
      navigate(
        "/login?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    // Kiểm tra thông tin booking
    if (!bookingDetails.room) {
      setError("Thiếu thông tin đặt phòng. Vui lòng chọn phòng trước.");
      setIsLoading(false);
      navigate("/rooms");
      return;
    }

    // Compute totals again here (defensive) and build booking object
    const ci =
      bookingDetails.checkInDate ||
      (bookingDetails.checkIn ? new Date(bookingDetails.checkIn) : null);
    const co =
      bookingDetails.checkOutDate ||
      (bookingDetails.checkOut ? new Date(bookingDetails.checkOut) : null);
    let nights = 1;
    if (ci && co) {
      const diff = co.getTime() - ci.getTime();
      nights = Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
    }
    const roomsCount = bookingDetails.rooms || 1;
    const computedTotalRoomPrice = Math.round(
      (roomPrice || 0) * nights * roomsCount
    );

    // 1. Tạo đối tượng booking từ Context
    const bookingData = {
      userId: user._id || user.id || user.IDNguoiDung,
      roomId: bookingDetails.roomId,
      checkIn: bookingDetails.checkIn, // Đã là string 'yyyy-MM-dd'
      checkOut: bookingDetails.checkOut, // Đã là string 'yyyy-MM-dd'
      numGuests: bookingDetails.guests,
      numRooms: bookingDetails.rooms,
      status: "pending",
      contactInfo: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      },
      paymentMethod: paymentMethod,
      paymentStatus:
        paymentMethod === "card" || paymentMethod === "paypal"
          ? "Paid"
          : "Pending",
      paymentMeta: {},
      // provide totals so backend or local mapper can construct HoaDon correctly
      totalRoomPrice: totalAmount,
      promo: bookingDetails.promo, // Thêm khuyến mãi
    };

    // Include selected services (map to server expected shape)
    if (
      Array.isArray(bookingDetails.DichVuDaChon) &&
      bookingDetails.DichVuDaChon.length > 0
    ) {
      bookingData.DichVuSuDung = bookingDetails.DichVuDaChon.map((d) => ({
        MaDichVu: d.MaDichVu,
        SoLuong: d.SoLuong || 1,
      }));
    }

    if (paymentMethod === "bank") {
      const amountToPay =
        overrideAmount !== null ? overrideAmount : totalAmount;
      bookingData.paymentMeta = {
        bankReference: bankRef,
        instructions:
          "Chuyển khoản đến STK: 0123456789 - Ngân hàng ABC - Chủ TK: Serpentine Palace",
        qrUrl: qrUrl,
        qrAccountName: qrAccountName,
        qrAddInfo: qrAddInfo,
        // amount that customer will pay (deposit or full)
        amount: amountToPay,
        // also provide the computed totals for mapping
        totalRoomPrice: computedTotalRoomPrice,
      };
      // reflect the payment (TienCoc) in the top-level bookingData if deposit
      if (paymentAmountMode === "deposit") {
        bookingData.TienCoc = amountToPay;
      }
    }

    if (paymentMethod === "onArrival") {
      bookingData.paymentMeta = {
        note: "Thanh toán tại khách sạn khi nhận phòng",
      };
    }

    try {
      // 2. Gọi service (giả lập)
      const response = await createBooking(bookingData);

      // 3. Xử lý sau thanh toán (giả lập)
      setIsLoading(false);

      // 4. Chuẩn bị thông tin booking để hiển thị trên trang success
      const bookingInfoForSuccess = {
        MaDatPhong: response?.MaDatPhong || bookingData.MaDatPhong || "N/A",
        room: bookingDetails.room || {
          TenPhong: "Phòng đã đặt",
          LoaiPhong: "",
        },
        contactInfo: bookingData.contactInfo,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numGuests: bookingData.numGuests,
        numRooms: bookingData.numRooms,
        paymentMethod: bookingData.paymentMethod,
        totalAmount: totalAmount,
        paymentMeta: bookingData.paymentMeta,
        promo: bookingData.promo,
        response: response, // Toàn bộ response từ API
      };

      // 5. Clear booking details sau khi lưu thông tin cần thiết
      clearBookingDetails();

      // 6. Navigate đến trang success với thông tin booking
      navigate("/booking-success", {
        state: { booking: bookingInfoForSuccess },
      });
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi đặt phòng.");
      setIsLoading(false);
    }
  };

  // Compute room price and total amount when booking details change
  useEffect(() => {
    let mounted = true;
    const compute = async () => {
      try {
        // Try server-authoritative price first
        if (
          bookingDetails.roomId &&
          bookingDetails.checkIn &&
          bookingDetails.checkOut
        ) {
          try {
            // include selected services so server returns grand total including services
            const extra = Array.isArray(bookingDetails.DichVuDaChon)
              ? bookingDetails.DichVuDaChon.map((d) => ({
                  MaDichVu: d.MaDichVu,
                  SoLuong: d.SoLuong || 1,
                }))
              : [];

            const resp = await getRoomPrice(
              bookingDetails.roomId,
              bookingDetails.checkIn,
              bookingDetails.checkOut,
              bookingDetails.rooms || 1,
              extra
            );
            const data = resp && resp.data ? resp.data : resp;
            if (
              mounted &&
              data &&
              typeof data.discountedTotal !== "undefined"
            ) {
              // server returns grandTotal which includes serviceTotal
              const serverTotal =
                typeof data.grandTotal !== "undefined"
                  ? data.grandTotal
                  : data.discountedTotal;
              setTotalAmount(
                overrideAmount !== null ? overrideAmount : serverTotal
              );
              // derive per-night room price if possible
              if (
                data.originalTotal &&
                bookingDetails.checkIn &&
                bookingDetails.checkOut
              ) {
                const ci = new Date(bookingDetails.checkIn);
                const co = new Date(bookingDetails.checkOut);
                const nights = Math.max(
                  1,
                  Math.ceil((co.getTime() - ci.getTime()) / (1000 * 3600 * 24))
                );
                const perNight = Math.round(data.originalTotal / nights);
                setRoomPrice(perNight);
              }
              return;
            }
          } catch (e) {
            console.warn(
              "Failed to fetch server price, falling back to client calc",
              e?.message || e
            );
          }
        }

        // Fallback to client-side calculation
        let price = null;

        if (bookingDetails.room) {
          const r = bookingDetails.room;
          price = r.GiaPhong || r.price || r.pricePerNight || r.Gia || null;
        }

        if (!price && bookingDetails.roomId) {
          const data = await getRoomById(bookingDetails.roomId);
          price =
            data.GiaPhong ||
            data.price ||
            data.Gia ||
            data.pricePerNight ||
            null;
        }

        if (!price) price = 0;

        if (!mounted) return;
        setRoomPrice(price);

        // compute nights
        const ci =
          bookingDetails.checkInDate ||
          (bookingDetails.checkIn ? new Date(bookingDetails.checkIn) : null);
        const co =
          bookingDetails.checkOutDate ||
          (bookingDetails.checkOut ? new Date(bookingDetails.checkOut) : null);
        let nights = 1;
        if (ci && co) {
          const diff = co.getTime() - ci.getTime();
          nights = Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
        }

        const roomsCount = bookingDetails.rooms || 1;
        const subtotal = Math.round((price || 0) * nights * roomsCount);

        // Include selected services into subtotal
        const selectedServices = Array.isArray(bookingDetails.DichVuDaChon)
          ? bookingDetails.DichVuDaChon
          : [];
        const servicesTotal = selectedServices.reduce((sum, s) => {
          const p = Number(s.GiaDichVu || s.Gia || 0);
          const q = Number(s.SoLuong || 0);
          return sum + p * q;
        }, 0);

        const subtotalWithServices = subtotal + servicesTotal;

        // Apply promotion if present (support several promo field shapes)
        const promo =
          bookingDetails.promo ||
          bookingDetails.KhuyenMai ||
          bookingDetails.promoApplied ||
          null;
        let discount = 0;
        if (promo) {
          if (promo.discountPercent != null) {
            discount = Math.round(
              (subtotal * Number(promo.discountPercent || 0)) / 100
            );
          } else if (promo.discountAmount != null) {
            discount = Number(promo.discountAmount) || 0;
          } else if (promo.GiaTriGiam != null) {
            const kind = (promo.LoaiGiamGia || promo.LoaiKhuyenMai || "")
              .toString()
              .toLowerCase();
            const raw = String(promo.GiaTriGiam || promo.GiaTri || "").trim();
            if (kind.includes("phần") || raw.includes("%")) {
              const pct = Number(raw.replace("%", "")) || 0;
              discount = Math.round((subtotal * pct) / 100);
            } else {
              discount = Number(promo.GiaTriGiam) || 0;
            }
          } else if (promo.GiaTri != null) {
            discount = Number(promo.GiaTri) || 0;
          }
        }

        if (discount > subtotalWithServices) discount = subtotalWithServices;
        const totalAfterDiscount = subtotalWithServices - discount;

        setTotalAmount(
          overrideAmount !== null ? overrideAmount : totalAfterDiscount
        );
      } catch (err) {
        console.error("Lỗi khi tính giá phòng:", err);
      }
    };
    compute();
    return () => {
      mounted = false;
    };
  }, [bookingDetails, overrideAmount]);

  // Build QR url when totalAmount or qr meta changes
  useEffect(() => {
    const base = "https://img.vietqr.io/image/bidv-8639699999-print.png";
    const amount = totalAmount || 0;
    // Build URL and ensure params are encoded. Use encodeURIComponent
    // for readability and to match the sample URL format.
    const params = [];
    params.push(`amount=${encodeURIComponent(amount)}`);
    if (qrAddInfo) params.push(`addInfo=${encodeURIComponent(qrAddInfo)}`);
    if (qrAccountName)
      params.push(`accountName=${encodeURIComponent(qrAccountName)}`);
    const url = `${base}?${params.join("&")}`;
    setQrUrl(url);
  }, [totalAmount, qrAddInfo, qrAccountName]);

  // When switching to bank payment or toggling amount mode, set overrideAmount
  useEffect(() => {
    if (paymentMethod === "bank") {
      if (paymentAmountMode === "deposit") {
        setOverrideAmount(DEPOSIT_AMOUNT);
      } else {
        // full price -> let compute effect set totalAmount from room price
        setOverrideAmount(null);
      }
    }
  }, [paymentMethod, paymentAmountMode]);

  return (
    <form onSubmit={handleSubmit}>
      <h5 className="mb-3">Thông tin liên hệ</h5>
      <InputField
        label="Họ và tên"
        id="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="Nguyễn Văn A"
        required
      />
      <InputField
        label="Email"
        id="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="email@example.com"
        required
      />
      <InputField
        label="Số điện thoại"
        id="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="090..."
        required
      />

      <hr className="my-4" />

      <h5 className="mb-3">Phương thức thanh toán</h5>
      <div className="mb-3">
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="paymentMethod"
            id="pm-card"
            value="card"
            checked={paymentMethod === "card"}
            onChange={() => setPaymentMethod("card")}
          />
          <label className="form-check-label" htmlFor="pm-card">
            Thẻ (Visa/Master)
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="paymentMethod"
            id="pm-paypal"
            value="paypal"
            checked={paymentMethod === "paypal"}
            onChange={() => setPaymentMethod("paypal")}
          />
          <label className="form-check-label" htmlFor="pm-paypal">
            PayPal
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="paymentMethod"
            id="pm-bank"
            value="bank"
            checked={paymentMethod === "bank"}
            onChange={() => setPaymentMethod("bank")}
          />
          <label className="form-check-label" htmlFor="pm-bank">
            Chuyển khoản
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="paymentMethod"
            id="pm-arrival"
            value="onArrival"
            checked={paymentMethod === "onArrival"}
            onChange={() => setPaymentMethod("onArrival")}
          />
          <label className="form-check-label" htmlFor="pm-arrival">
            Thanh toán tại khách sạn
          </label>
        </div>
      </div>

      {/* Conditional payment UI */}
      {paymentMethod === "card" && (
        <>
          <h6 className="mb-3">Thông tin thẻ (Giả lập)</h6>
          <InputField
            label="Số thẻ"
            id="ccNumber" // SỬA: Đổi id cho nhất quán
            value={formData.ccNumber}
            onChange={handleChange}
            placeholder="XXXX XXXX XXXX XXXX"
          />
          <div className="row">
            <div className="col-md-6">
              <InputField
                label="Ngày hết hạn"
                id="ccExpiry" // SỬA: Đổi id cho nhất quán
                value={formData.ccExpiry}
                onChange={handleChange}
                placeholder="MM/YY"
              />
            </div>
            <div className="col-md-6">
              <InputField
                label="CVV"
                id="ccCvv" // SỬA: Đổi id cho nhất quán
                value={formData.ccCvv}
                onChange={handleChange}
                placeholder="XXX"
              />
            </div>
          </div>
        </>
      )}

      {paymentMethod === "paypal" && (
        <div className="mb-3">
          <p>Bạn sẽ được chuyển tới PayPal để hoàn tất thanh toán (giả lập).</p>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => alert("Chuyển tới PayPal (giả lập)")}
          >
            Thanh toán bằng PayPal
          </button>
        </div>
      )}

      {paymentMethod === "bank" && (
        <div className="mb-3">
          <p className="small text-muted">Hướng dẫn chuyển khoản ngân hàng:</p>
          <ul>
            <li>Ngân hàng: ABC</li>
            <li>STK: 0123456789</li>
            <li>Chủ tài khoản: Serpentine Palace</li>
          </ul>

          <div className="mb-2">
            <label className="form-label">Tên người nhận (QR)</label>
            <input
              className="form-control"
              value={qrAccountName}
              onChange={(e) => setQrAccountName(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="form-label">Nội dung (addInfo)</label>
            <input
              className="form-control"
              value={qrAddInfo}
              onChange={(e) => setQrAddInfo(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="form-label">
              Chọn loại thanh toán chuyển khoản
            </label>
            <div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="bankAmountMode"
                  id="bank-deposit"
                  checked={paymentAmountMode === "deposit"}
                  onChange={() => setPaymentAmountMode("deposit")}
                />
                <label className="form-check-label" htmlFor="bank-deposit">
                  Đặt cọc 500.000₫
                </label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="bankAmountMode"
                  id="bank-full"
                  checked={paymentAmountMode === "full"}
                  onChange={() => setPaymentAmountMode("full")}
                />
                <label className="form-check-label" htmlFor="bank-full">
                  Thanh toán đủ tổng tiền
                </label>
              </div>
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label">Số tiền (VND)</label>
            <input
              type="number"
              className="form-control"
              value={overrideAmount !== null ? overrideAmount : totalAmount}
              onChange={(e) =>
                setOverrideAmount(
                  e.target.value ? Math.round(Number(e.target.value)) : null
                )
              }
            />
            <div className="form-text">
              Số tiền mặc định được tính từ giá phòng x số đêm x số phòng.
            </div>
          </div>

          <InputField
            label="Mã tham chiếu chuyển khoản (nếu có)"
            id="bankRef"
            value={bankRef}
            onChange={(e) => setBankRef(e.target.value)}
            placeholder="Ví dụ: TRANS12345"
          />

          <div className="mt-3">
            <p className="small text-muted">QR thanh toán:</p>
            {qrUrl ? (
              <div>
                <img
                  src={qrUrl}
                  alt="QR thanh toán"
                  style={{ maxWidth: "220px" }}
                />
                <div className="mt-2">
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="me-2"
                  >
                    Mở ảnh QR
                  </a>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() =>
                      navigator.clipboard &&
                      navigator.clipboard.writeText(qrUrl)
                    }
                  >
                    Sao chép link QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-muted">Đang tạo QR...</div>
            )}
          </div>
        </div>
      )}

      {paymentMethod === "onArrival" && (
        <div className="mb-3 alert alert-info">
          Bạn sẽ thanh toán tại quầy lễ tân khi nhận phòng.
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="btn btn-primary btn-lg w-100 mt-3"
        disabled={isLoading}
      >
        {isLoading ? <Spinner /> : "Thanh toán & Đặt phòng"}
      </Button>
    </form>
  );
}

export default PaymentForm;
