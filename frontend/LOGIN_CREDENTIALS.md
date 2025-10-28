# Hotel Management System - Login Credentials

## 🔐 Test Accounts

### Admin Account
- **Email:** `admin@hotel.com`
- **Password:** `123456`
- **Role:** Administrator
- **Access:** Full admin panel access

### User Account  
- **Email:** `user@hotel.com`
- **Password:** `123456`
- **Role:** Regular customer
- **Access:** Booking and profile management

## 🚀 Quick Access

1. Navigate to `/login` page
2. Use the "Auto Fill" buttons for quick login
3. Admin account will redirect to admin dashboard
4. User account will redirect to homepage

## 🛠️ Development Notes

- Passwords are stored in `src/services/api.js`
- Authentication is handled by `AuthContext`
- Admin routes are protected in `AdminRoutes.jsx`
- Mock API simulates real authentication flow

## 📝 Features Accessible by Role

### Admin Features:
- Dashboard overview
- Room management
- Booking management  
- User management
- Reports and analytics

### User Features:
- Browse rooms
- Make bookings
- View profile
- Update personal information

---
*Last updated: October 28, 2025*