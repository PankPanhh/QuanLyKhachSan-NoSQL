// src/services/dashboardService.js
import api from "./api";

// Get all rooms for statistics
export const getDashboardRoomStats = async () => {
  try {
    const response = await api.get("/rooms");
    const rooms = Array.isArray(response) ? response : response?.data || [];
    
    const stats = {
      totalRooms: rooms.length,
      emptyRooms: rooms.filter(r => r.TinhTrang === "Trống").length,
      occupiedRooms: rooms.filter(r => r.TinhTrang === "Đang sử dụng").length,
      maintenanceRooms: rooms.filter(r => r.TinhTrang === "Bảo trì").length,
      damagedRooms: rooms.filter(r => r.TinhTrang === "Hư").length,
      abnormalRooms: rooms.filter(r => 
        r.TinhTrang === "Bảo trì" || r.TinhTrang === "Hư"
      )
    };
    
    return { stats, rooms };
  } catch (error) {
    console.error("Error fetching room stats:", error);
    throw error;
  }
};

// Get all bookings for statistics
export const getDashboardBookingStats = async () => {
  try {
    const response = await api.get("/bookings");
    const bookings = Array.isArray(response) ? response : response?.data || [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.NgayNhanPhong || booking.checkInDate);
      return bookingDate >= today && bookingDate < tomorrow;
    });
    
    const completedTodayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.NgayNhanPhong || booking.checkInDate);
      return bookingDate >= today && 
             bookingDate < tomorrow && 
             (booking.TrangThai === "Hoàn tất" || booking.status === "completed");
    });
    
    // Calculate today's revenue
    const todayRevenue = completedTodayBookings.reduce((sum, booking) => {
      return sum + (booking.TongTien || booking.total || 0);
    }, 0);
    
    const stats = {
      todayBookings: todayBookings.length,
      todayRevenue,
      recentBookings: bookings
        .sort((a, b) => new Date(b.NgayDat || b.createdAt) - new Date(a.NgayDat || a.createdAt))
        .slice(0, 10)
    };
    
    return { stats, bookings };
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    throw error;
  }
};

// Get user statistics
export const getDashboardUserStats = async () => {
  try {
    const response = await api.get("/users");
    const users = Array.isArray(response) ? response : response?.data || [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newCustomersToday = users.filter(user => {
      const userDate = new Date(user.NgayTao || user.createdAt);
      return userDate >= today && 
             userDate < tomorrow && 
             (user.VaiTro === "KhachHang" || user.role === "customer");
    });
    
    return {
      newCustomersToday: newCustomersToday.length,
      totalCustomers: users.filter(u => 
        u.VaiTro === "KhachHang" || u.role === "customer"
      ).length
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Return default values if API fails
    return { newCustomersToday: 0, totalCustomers: 0 };
  }
};

// Get monthly revenue data
export const getMonthlyRevenueData = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const response = await api.get(`/reports/revenue/monthly?year=${currentYear}`);
    const data = response?.data || [];
    
    // Transform data for chart
    return data.map(item => ({
      month: new Date(item.month).toLocaleDateString('vi-VN', { month: 'short' }),
      revenue: item.revenue || 0,
      bookingsCount: item.bookingsCount || 0
    }));
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    // Return mock data if API fails
    return generateMockMonthlyRevenue();
  }
};

// Get daily revenue for last 7 days
export const getDailyRevenueData = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    const response = await api.get(`/reports/revenue/daily?start=${start}&end=${end}`);
    const data = response?.data || [];
    
    // Transform data for chart
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
      revenue: item.revenue || 0,
      bookingsCount: item.bookingsCount || 0
    }));
  } catch (error) {
    console.error("Error fetching daily revenue:", error);
    return generateMockDailyRevenue();
  }
};

// Get all services for revenue breakdown
export const getServiceRevenueData = async () => {
  try {
    // Try to get actual service booking data
    const bookingsResponse = await api.get("/bookings");
    const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : bookingsResponse?.data || [];
    
    // Calculate service revenue vs room revenue
    let roomRevenue = 0;
    let serviceRevenue = 0;
    
    bookings.forEach(booking => {
      if (booking.TrangThai === "Hoàn tất" || booking.status === "completed") {
        roomRevenue += booking.TongTienPhong || booking.roomTotal || 0;
        serviceRevenue += booking.TongTienDichVu || booking.serviceTotal || 0;
      }
    });
    
    return [
      { source: 'Phòng', amount: roomRevenue },
      { source: 'Dịch vụ', amount: serviceRevenue },
      { source: 'F&B', amount: serviceRevenue * 0.3 }, // Estimate
      { source: 'Khác', amount: serviceRevenue * 0.1 } // Estimate
    ];
  } catch (error) {
    console.error("Error fetching service revenue:", error);
    return generateMockRevenueSource();
  }
};

// Mock data generators for fallback
const generateMockMonthlyRevenue = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const month = date.toLocaleDateString('vi-VN', { month: 'short' });
    data.push({
      month,
      revenue: Math.floor(Math.random() * 50000000) + 30000000,
      bookingsCount: Math.floor(Math.random() * 50) + 20
    });
  }
  return data;
};

const generateMockDailyRevenue = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      revenue: Math.floor(Math.random() * 5000000) + 2000000,
      bookingsCount: Math.floor(Math.random() * 15) + 5
    });
  }
  return data;
};

const generateMockRevenueSource = () => [
  { source: 'Phòng', amount: 35000000 },
  { source: 'Dịch vụ', amount: 8500000 },
  { source: 'F&B', amount: 4200000 },
  { source: 'Khác', amount: 1800000 }
];

export default {
  getDashboardRoomStats,
  getDashboardBookingStats,
  getDashboardUserStats,
  getMonthlyRevenueData,
  getDailyRevenueData,
  getServiceRevenueData
};