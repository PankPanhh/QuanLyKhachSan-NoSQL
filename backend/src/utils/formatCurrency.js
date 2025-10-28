// (Day la code phia backend, neu can format tien)
export const formatCurrencyBE = (amount) => {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};
