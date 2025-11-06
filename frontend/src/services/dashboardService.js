// src/services/dashboardService.js
import api from "./api";

// Get all rooms for statistics
export const getDashboardRoomStats = async () => {
  try {
    // Fetch both rooms and bookings
    const [roomsResponse, bookingsResponse] = await Promise.all([
      api.get("/rooms"),
      api.get("/bookings")
    ]);
    
    const rooms = Array.isArray(roomsResponse) ? roomsResponse : roomsResponse?.data || [];
    const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : bookingsResponse?.data || [];
    
    // Get current date for occupancy calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find currently occupied rooms based on bookings
    const occupiedRoomIds = new Set();
    bookings.forEach(booking => {
      // Exclude cancelled bookings
      if (booking.TrangThai !== 'Hủy' && booking.TrangThai !== 'Đã hủy' && 
          booking.status !== 'cancelled' && booking.status !== 'cancelled') {
        const checkIn = new Date(booking.NgayNhanPhong || booking.checkInDate);
        const checkOut = new Date(booking.NgayTraPhong || booking.checkOutDate);
        
        // Room is occupied if today is between check-in and check-out (inclusive)
        // This assumes that confirmed bookings with current dates are occupying rooms
        if (checkIn <= today && today <= checkOut) {
          occupiedRoomIds.add(booking.MaPhong || booking.roomId);
        }
      }
    });
    
    // Calculate stats based on room status and current bookings
    const stats = {
      totalRooms: rooms.length,
      emptyRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
      damagedRooms: 0,
      abnormalRooms: []
    };
    
    rooms.forEach(room => {
      const roomId = room.MaPhong || room._id;
      const isCurrentlyOccupied = occupiedRoomIds.has(roomId);
      
      // Priority: Current booking status overrides room status for occupancy
      if (isCurrentlyOccupied) {
        stats.occupiedRooms++;
      } else if (room.TinhTrang === "Bảo trì") {
        stats.maintenanceRooms++;
        stats.abnormalRooms.push(room);
      } else if (room.TinhTrang === "Hư") {
        stats.damagedRooms++;
        stats.abnormalRooms.push(room);
      } else {
        stats.emptyRooms++;
      }
    });
    
    return { 
      stats: {
        ...stats,
        abnormalRooms: stats.abnormalRooms.map(room => ({
          code: room.MaPhong || room.code || 'N/A',
          name: room.TenPhong || room.name || 'N/A',
          status: room.TinhTrang || room.status,
          note: room.GhiChu || room.note || 'Cần kiểm tra',
          color: room.TinhTrang === 'Hư' ? '#dc3545' : '#ffc107'
        }))
      }, 
      rooms 
    };
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

    // Helper to detect successful/partial payments
    const isSuccessPayment = (p) => p && (p.TrangThai === "Thành công" || p.TrangThai === "Thanh toán một phần" || p.status === 'completed' || p.status === 'partial');

    // Calculate today's revenue by summing payment history entries that occurred today
    let todayRevenue = 0;
    bookings.forEach(booking => {
      const lichSu = booking.HoaDon?.LichSuThanhToan || booking.LichSuThanhToan || [];
      if (Array.isArray(lichSu)) {
        lichSu.forEach(p => {
          const pDate = p?.NgayThanhToan ? new Date(p.NgayThanhToan) : null;
          if (pDate) {
            const pDateOnly = new Date(pDate);
            pDateOnly.setHours(0,0,0,0);
            if (pDateOnly.getTime() === today.getTime() && isSuccessPayment(p)) {
              todayRevenue += Number(p.SoTien || 0);
            }
          }
        });
      }

      // Fallback: if invoice marked paid today, count invoice total
      const hd = booking.HoaDon;
      if (hd) {
        const ngayLap = hd.NgayLap ? new Date(hd.NgayLap) : null;
        if (ngayLap) {
          const nl = new Date(ngayLap);
          nl.setHours(0,0,0,0);
          if (nl.getTime() === today.getTime() && (hd.TinhTrang === "Đã thanh toán" || hd.TinhTrang === "Thanh toán một phần")) {
            todayRevenue += Number(hd.TongTien || 0);
          }
        }
      }
    });

    // Helper to parse various date representations coming from DB or API
    const parseDateValue = (val) => {
      if (!val) return null;
      // Plain ISO string
      if (typeof val === 'string') {
        const d = new Date(val);
        return isNaN(d) ? null : d;
      }
      // Already a Date
      if (val instanceof Date) return val;
      // Mongo export format: { "$date": "..." } or { "$date": { "$numberLong": "..." } }
      if (val.$date) {
        if (typeof val.$date === 'string') {
          const d = new Date(val.$date);
          return isNaN(d) ? null : d;
        }
        if (val.$date.$numberLong) {
          const millis = Number(val.$date.$numberLong);
          return isNaN(millis) ? null : new Date(millis);
        }
      }
      // Mongoose-like _id / nested representations
      return null;
    };

    const sortedBookings = bookings
      .sort((a, b) => new Date(b.NgayDat || b.createdAt) - new Date(a.NgayDat || a.createdAt));

    const fullRecentBookings = sortedBookings.slice(0, 10);

    const recentBookings = fullRecentBookings.map(b => {
      // id: prefer MaDatPhong, fall back to _id.$oid or _id
      let id = b.MaDatPhong || null;
      if (!id && b._id) {
        if (typeof b._id === 'string') id = b._id;
        else if (b._id.$oid) id = b._id.$oid;
        else if (b._id.toString) id = b._id.toString();
      }

      // customer: use IDKhachHang directly from DatPhong table
      let customer = b.IDKhachHang || 'N/A';

      // room: use MaPhong directly from DatPhong table
      const room = b.MaPhong || 'N/A';

      // parse checkIn/checkOut robustly
      const ci = parseDateValue(b.NgayNhanPhong || b.checkInDate);
      const co = parseDateValue(b.NgayTraPhong || b.checkOutDate);

      return {
        id: id || 'N/A',
        customer,
        room,
        checkIn: ci ? ci.toLocaleDateString('vi-VN') : 'N/A',
        checkOut: co ? co.toLocaleDateString('vi-VN') : 'N/A',
        status: b.TrangThai || b.status || 'N/A',
        total: Number(b.HoaDon?.TongTien || b.TongTien || b.total || 0),
        fullBooking: b // Add full booking data for modal
      };
    });

    const stats = {
      todayBookings: todayBookings.length,
      todayRevenue,
      recentBookings
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
    // Calculate service revenue vs room revenue for current month based on HoaDon in DatPhong
    let roomRevenue = 0;
    let serviceRevenue = 0;
    let otherRevenue = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(monthStart.getMonth() + 1);

    bookings.forEach(booking => {
      const hd = booking.HoaDon || {};
      // Determine invoice date (use HoaDon.NgayLap if present, otherwise booking date)
      const invoiceDate = hd.NgayLap ? new Date(hd.NgayLap) : (booking.NgayDat ? new Date(booking.NgayDat) : (booking.createdAt ? new Date(booking.createdAt) : null));
      if (!invoiceDate) return;
      if (invoiceDate >= monthStart && invoiceDate < nextMonth) {
        // Use explicit invoice fields if available
        const roomAmt = Number(hd.TongTienPhong || booking.TongTienPhong || booking.roomTotal || 0);
        const svcAmt = Number(hd.TongTienDichVu || booking.TongTienDichVu || booking.serviceTotal || 0);
        const total = Number(hd.TongTien || booking.TongTien || booking.total || (roomAmt + svcAmt));

        roomRevenue += roomAmt;
        serviceRevenue += svcAmt;
        // Any difference goes to otherRevenue
        const known = roomAmt + svcAmt;
        if (total > known) otherRevenue += (total - known);
      }
    });

    // Heuristics for F&B and other breakdown if not explicit
    const fnb = Math.round(serviceRevenue * 0.3);
    const other = Math.round(otherRevenue || serviceRevenue * 0.1);

    return [
      { source: 'Phòng', amount: roomRevenue },
      { source: 'Dịch vụ', amount: serviceRevenue },
      { source: 'F&B', amount: fnb },
      { source: 'Khác', amount: other }
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