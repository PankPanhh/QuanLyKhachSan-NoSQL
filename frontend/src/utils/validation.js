/**
 * Kiểm tra email có hợp lệ không
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Kiểm tra mật khẩu (ví dụ: ít nhất 6 ký tự)
 * @param {string} password
 * @returns {boolean}
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};
