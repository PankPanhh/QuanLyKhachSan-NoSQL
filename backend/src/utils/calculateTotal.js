import { differenceInCalendarDays } from 'date-fns';

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
  const nights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
  if (nights <= 0) {
    throw new Error('Ngay check-out phai sau ngay check-in');
  }

  // 1. Tinh tien phong
  let roomTotal = pricePerNight * nights * numRooms;

  // 2. Tinh tien dich vu (gia su)
  const serviceTotal = extraServices.reduce((acc, service) => acc + (service.price || 0), 0);

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
