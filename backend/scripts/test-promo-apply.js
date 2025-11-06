import { calculateRoomPriceWithDiscount } from "../src/utils/calculateTotal.js";

// Helper to build a room object
const buildRoom = (price, promo) => ({
  GiaPhong: price,
  KhuyenMai: promo ? [promo] : [],
});

const runTests = () => {
  // Promotion active 2025-11-04 to 2025-11-07
  const promo = {
    TrangThai: "Hoạt động",
    NgayBatDau: "2025-11-04T00:00:00.000Z",
    NgayKetThuc: "2025-11-07T00:00:00.000Z",
    LoaiGiamGia: "Phần trăm",
    GiaTriGiam: 25,
  };

  // Case A: Booking created/stay INSIDE promo (e.g., stay on 2025-11-05) => promo should apply
  const roomA = buildRoom(1150000, promo);
  const resA = calculateRoomPriceWithDiscount(
    roomA,
    "2025-11-05",
    "2025-11-06",
    1
  );
  console.log("Case A (stay inside promo):", resA);

  // Case B: Booking with stay OUTSIDE promo (stay on 2025-11-16) => promo should NOT apply
  const roomB = buildRoom(1150000, promo);
  const resB = calculateRoomPriceWithDiscount(
    roomB,
    "2025-11-16",
    "2025-11-17",
    1
  );
  console.log("Case B (stay outside promo):", resB);

  // Case C: Booking overlapping promo (check-in before promo end, check-out after start) => should apply
  const roomC = buildRoom(1150000, promo);
  const resC = calculateRoomPriceWithDiscount(
    roomC,
    "2025-11-06",
    "2025-11-08",
    1
  );
  console.log("Case C (overlap):", resC);

  // Case D: No promotion
  const roomD = buildRoom(1150000, null);
  const resD = calculateRoomPriceWithDiscount(
    roomD,
    "2025-11-16",
    "2025-11-17",
    1
  );
  console.log("Case D (no promo):", resD);
};

runTests();
