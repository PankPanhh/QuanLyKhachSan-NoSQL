import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware bao ve route, yeu cau dang nhap
export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      // Lay token tu header (vi du: "Bearer ...token...")
      token = authHeader.split(" ")[1];

      // Xac thuc token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("[auth.protect] token decoded id=", decoded.id);

      // Lay thong tin user tu token (tru mat khau) va gan vao req
      req.user = await User.findById(decoded.id).select("-MatKhau");
      console.log(
        "[auth.protect] loaded user:",
        req.user
          ? {
              IDNguoiDung: req.user.IDNguoiDung,
              VaiTro: req.user.VaiTro,
              _id: req.user._id,
            }
          : null
      );

      if (!req.user) {
        return res.status(401).json({ message: "Nguoi dung khong ton tai" });
      }

      return next(); // Di tiep
    } catch (error) {
      console.error("Loi xac thuc token:", error.message);
      return res.status(401).json({ message: "Token khong hop le" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Chua dang nhap, khong co token" });
  }
};

// Middleware kiem tra vai tro (role)
// '...roles' la mot array cac vai tro duoc phep (vi du: 'Admin', 'NhanVien')
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(
      "[auth.authorize] required roles=",
      roles,
      " current role=",
      req.user ? req.user.VaiTro : null
    );
    if (!req.user || !roles.includes(req.user.VaiTro)) {
      return res.status(403).json({
        message: `Vai tro '${
          req.user ? req.user.VaiTro : "undefined"
        }' khong duoc phep truy cap tai nguyen nay`,
      });
    }
    return next(); // Duoc phep
  };
};
