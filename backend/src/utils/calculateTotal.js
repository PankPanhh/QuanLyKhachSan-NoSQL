import { differenceInCalendarDays } from "date-fns";

/**
 * Tinh tong tien dat phong
 * @param {Date} checkIn - Ngay check-in
 * @param {Date} checkOut - Ngay check-out
 * @param {number} pricePerNight - Gia moi dem
 * @param {number} numRooms - So luong phong
 * @param {Array} [extraServices] - Mang cac dich vu phu them (neu co)
 * @param {object} [promotion] - Khuyen mai (neu co)
 * @returns {number} Tong tien
 */
export const calculateBookingTotal = (
  checkIn,
  checkOut,
  pricePerNight,
  numRooms = 1,
  extraServices = [],
  promotion = null
) => {
  const nights = differenceInCalendarDays(
    new Date(checkOut),
    new Date(checkIn)
  );
  if (nights <= 0) {
    throw new Error("Ngay check-out phai sau ngay check-in");
  }

  // 1. Tinh tien phong
  let roomTotal = pricePerNight * nights * numRooms;

  // 2. Tinh tien dich vu (gia su)
  const serviceTotal = extraServices.reduce(
    (acc, service) => acc + (service.price || 0),
    0
  );

  let subtotal = roomTotal + serviceTotal;

  // 3. Ap dung khuyen mai
  if (promotion) {
    if (promotion.discountPercent) {
      const discountAmount = (subtotal * promotion.discountPercent) / 100;
      subtotal -= discountAmount;
    } else if (promotion.discountAmount) {
      subtotal -= Math.min(subtotal, promotion.discountAmount);
    }
  }

  // TODO: Tinh thue (VAT) neu can

  return subtotal;
};

/**
 * Tinh gia phong sau khi ap dung khuyen mai
 * @param {object} room - Thong tin phong
 * @param {Date} checkIn - Ngay check-in
 * @param {Date} checkOut - Ngay check-out
 * @param {number} numRooms - So luong phong
 * @returns {object} { discountedTotal, discountAmount, originalTotal }
 */
export const calculateRoomPriceWithDiscount = (
  room,
  checkIn,
  checkOut,
  numRooms = 1
) => {
  const ciDate = new Date(checkIn);
  const coDate = new Date(checkOut);
  const nights = Math.max(
    1,
    Math.ceil((coDate.getTime() - ciDate.getTime()) / (1000 * 3600 * 24))
  );

  const originalPrice = room.GiaPhong || 0;
  const originalTotal = originalPrice * nights * numRooms;

  // Tìm khuyến mãi áp dụng cho khoảng thời gian đặt phòng (check-in/check-out)
  // Normalize cả khuyến mãi và khoảng lưu trú về khoảng thời gian ngày (inclusive)
  // Promo interval: [promoStart 00:00:00, promoEnd 23:59:59.999]
  // Stay interval: [ciDate 00:00:00, (coDate - 1ms) ] since check-out is exclusive
  const stayStart = new Date(ciDate);
  stayStart.setHours(0, 0, 0, 0);
  const stayEndInclusive = new Date(coDate.getTime() - 1); // last millisecond of the previous day
  stayEndInclusive.setHours(23, 59, 59, 999);

  const activePromotion = room.KhuyenMai?.find((km) => {
    if (km.TrangThai !== "Hoạt động") return false;
    const start = km.NgayBatDau ? new Date(km.NgayBatDau) : null;
    const end = km.NgayKetThuc ? new Date(km.NgayKetThuc) : null;

    // Nếu không có start/end thì coi như áp dụng cho mọi thời điểm (như trước)
    if (!start && !end) return true;

    // Normalize promo start to start of day, promo end to end of day
    const promoStart = start ? new Date(start) : null;
    if (promoStart) promoStart.setHours(0, 0, 0, 0);
    const promoEnd = end ? new Date(end) : null;
    if (promoEnd) promoEnd.setHours(23, 59, 59, 999);

    // Overlap if promoStart <= stayEndInclusive AND promoEnd >= stayStart
    const startsBeforeOrAtStayEnd =
      !promoStart || promoStart <= stayEndInclusive;
    const endsAfterOrAtStayStart = !promoEnd || promoEnd >= stayStart;

    return startsBeforeOrAtStayEnd && endsAfterOrAtStayStart;
  });

  let discountedTotal = originalTotal;
  let discountAmount = 0;

  if (activePromotion) {
    if (activePromotion.LoaiGiamGia === "Phần trăm") {
      discountAmount = Math.round(
        (originalTotal * activePromotion.GiaTriGiam) / 100
      );
      discountedTotal = originalTotal - discountAmount;
    } else if (activePromotion.LoaiGiamGia === "Giảm giá cố định") {
      discountAmount = Math.min(originalTotal, activePromotion.GiaTriGiam);
      discountedTotal = originalTotal - discountAmount;
    }
  }

  return {
    originalTotal,
    discountedTotal,
    discountAmount,
    activePromotion,
  };
};
