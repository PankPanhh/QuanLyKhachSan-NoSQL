import jwt from 'jsonwebtoken';

// Ham sinh token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// Ham xac thuc token (da duoc su dung trong authMiddleware)
// Ban co the goi ham nay o noi khac neu can
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null; // Token khong hop le
  }
};
