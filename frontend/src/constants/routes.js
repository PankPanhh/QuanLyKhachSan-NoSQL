// File tổng hợp tất cả routes trong application
// Sử dụng để reference và đảm bảo consistency

export const ROUTES = {
  // Main Routes (User facing)
  HOME: '/',
  ROOMS: '/rooms',
  ROOM_DETAIL: '/rooms/:slug', // Dynamic route với slug
  BOOKING: '/booking',
  PROMOTIONS: '/promotions',
  CONTACT: '/contact',
  PROFILE: '/profile',
  
  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Admin Routes
  ADMIN_BASE: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_USERS: '/admin/users',
  ADMIN_SERVICES: '/admin/services',
  ADMIN_PROMOTIONS: '/admin/promotions',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_HOME: '/admin/home'
};

// Helper functions để tạo dynamic routes
export const createRoomDetailRoute = (slug) => `/rooms/${slug}`;
export const createLoginWithRedirect = (redirectPath) => `/login?redirect=${encodeURIComponent(redirectPath)}`;

// Route groups để dễ quản lý permissions
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.ROOMS,
  ROUTES.ROOM_DETAIL,
  ROUTES.PROMOTIONS,
  ROUTES.CONTACT,
  ROUTES.LOGIN,
  ROUTES.REGISTER
];

export const PROTECTED_ROUTES = [
  ROUTES.BOOKING,
  ROUTES.PROFILE
];

export const ADMIN_ROUTES = [
  ROUTES.ADMIN_BASE,
  ROUTES.ADMIN_DASHBOARD,
  ROUTES.ADMIN_ROOMS,
  ROUTES.ADMIN_BOOKINGS,
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_SERVICES,
  ROUTES.ADMIN_PROMOTIONS,
  ROUTES.ADMIN_REPORTS,
  ROUTES.ADMIN_HOME
];

export default ROUTES;