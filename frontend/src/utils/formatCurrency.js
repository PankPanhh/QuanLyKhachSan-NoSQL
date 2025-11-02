/**
 * Định dạng số thành chuỗi tiền tệ (USD)
 * @param {number} amount Số tiền
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount == null || Number.isNaN(Number(amount))) return '0₫';

  const num = Number(amount);
  // Format as VND without decimal places
  const formatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  // Remove any non-breaking spaces to match compact display like "500.000₫"
  return String(formatted).replace(/\u00A0/g, '').replace(/\s+/g, '');
};
