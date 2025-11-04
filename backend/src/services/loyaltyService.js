export const getTierByPoints = (points = 0) => {
  if (points >= 5000) return 'Platinum';
  if (points >= 1000) return 'Gold';
  return 'Silver';
};

export const pointsFromRevenue = (amount) => {
  const rate = Number(process.env.LOYALTY_RATE || 10000);
  const amt = Number(amount || 0);
  if (!rate || rate <= 0 || amt <= 0) return 0;
  return Math.floor(amt / rate);
};

export const pointsFromBookings = (count) => {
  const per = Number(process.env.LOYALTY_POINTS_PER_BOOKING || 50);
  const cnt = Number(count || 0);
  if (per <= 0 || cnt <= 0) return 0;
  return per * cnt;
};

export const recalcTierAndSave = async (user) => {
  user.HangThanhVien = getTierByPoints(user.DiemTichLuy || 0);
  await user.save();
  return user;
};