export const generateUserId = (role = 'KhachHang') => {
  const prefix = role === 'KhachHang' ? 'KH' : 'NV';
  const rand = Math.floor(1000 + Math.random() * 9000);
  const tail = Date.now().toString().slice(-4);
  return `${prefix}${rand}${tail}`;
};