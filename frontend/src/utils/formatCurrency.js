/**
 * Định dạng số thành chuỗi tiền tệ (USD)
 * @param {number} amount Số tiền
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
