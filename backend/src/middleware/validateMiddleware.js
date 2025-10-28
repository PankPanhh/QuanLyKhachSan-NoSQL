import { validationResult } from 'express-validator';

// Middleware nay chay sau cac check() cua express-validator trong file routes
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Tra ve loi 400 (Bad Request) voi danh sach loi
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
