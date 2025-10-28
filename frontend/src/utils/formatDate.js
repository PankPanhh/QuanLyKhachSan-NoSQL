/**
 * Định dạng đối tượng Date thành chuỗi 'dd/MM/yyyy'
 * @param {Date} date Đối tượng Date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date || !(date instanceof Date)) {
    return '';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};
