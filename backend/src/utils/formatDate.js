// (Day la code phia backend, neu can format ngay)
export const formatDateBE = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
