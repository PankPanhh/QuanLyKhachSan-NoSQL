import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  FaHome, FaBed, FaUsers, FaMoneyBillWave, FaUserPlus, FaClipboardList,
  FaExclamationTriangle, FaClock, FaCreditCard, FaCalendarDay
} from 'react-icons/fa';
import dashboardService from '../../services/dashboardService';

// KPI Card Component
const KPICard = ({ icon: Icon, title, value, subtitle, color, bgColor }) => (
  <div className="card h-100 border-0 shadow-sm">
    <div className="card-body d-flex align-items-center">
      <div 
        className="rounded-circle d-flex align-items-center justify-content-center me-3"
        style={{ 
          width: '60px', 
          height: '60px', 
          backgroundColor: bgColor 
        }}
      >
        <Icon style={{ color, fontSize: '24px' }} />
      </div>
      <div className="flex-fill">
        <h3 className="fw-bold mb-1 text-dark">{value}</h3>
        <p className="text-muted mb-0 fw-medium">{title}</p>
        {subtitle && <small className="text-secondary">{subtitle}</small>}
      </div>
    </div>
  </div>
);

// Alert Item Component
const AlertItem = ({ icon: Icon, text, color }) => (
  <div 
    className="d-flex align-items-start p-3 mb-3 rounded border-start border-4"
    style={{ 
      borderLeftColor: `${color} !important`,
      backgroundColor: '#f8f9fa'
    }}
  >
    <div className="me-3" style={{ color, fontSize: '16px', marginTop: '2px' }}>
      <Icon />
    </div>
    <div className="flex-fill">
      <small className="text-dark">{text}</small>
    </div>
  </div>
);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiStats, setKpiStats] = useState({
    totalRooms: 0,
    emptyRooms: 0,
    occupiedRooms: 0,
    todayBookings: 0,
    todayRevenue: 0,
    newCustomersToday: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [abnormalRooms, setAbnormalRooms] = useState([]);

  const [alerts, setAlerts] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          roomStatsData,
          bookingStatsData,
          userStatsData,
          monthlyRevenueData,
          dailyRevenueData,
          serviceRevenueData
        ] = await Promise.all([
          dashboardService.getDashboardRoomStats(),
          dashboardService.getDashboardBookingStats(),
          dashboardService.getDashboardUserStats(),
          dashboardService.getMonthlyRevenueData(),
          dashboardService.getDailyRevenueData(),
          dashboardService.getServiceRevenueData()
        ]);

        // Set KPI stats
        setKpiStats({
          totalRooms: roomStatsData.stats.totalRooms,
          emptyRooms: roomStatsData.stats.emptyRooms,
          occupiedRooms: roomStatsData.stats.occupiedRooms,
          todayBookings: bookingStatsData.stats.todayBookings,
          todayRevenue: bookingStatsData.stats.todayRevenue,
          newCustomersToday: userStatsData.newCustomersToday
        });

        // Set recent bookings
        setRecentBookings(bookingStatsData.stats.recentBookings);

        // Set abnormal rooms
        setAbnormalRooms(roomStatsData.stats.abnormalRooms.map(room => ({
          code: room.MaPhong || room.code || 'N/A',
          name: room.TenPhong || room.name || 'N/A',
          status: room.TinhTrang || room.status,
          note: room.GhiChu || room.note || 'Cần kiểm tra',
          color: room.TinhTrang === 'Hư' ? '#dc3545' : '#ffc107'
        })));

        // Create room usage data for pie chart
        const roomUsage = [
          { 
            name: 'Phòng trống', 
            value: roomStatsData.stats.emptyRooms, 
            color: '#28a745' 
          },
          { 
            name: 'Đang sử dụng', 
            value: roomStatsData.stats.occupiedRooms, 
            color: '#007bff' 
          },
          { 
            name: 'Bảo trì', 
            value: roomStatsData.stats.maintenanceRooms, 
            color: '#ffc107' 
          },
          { 
            name: 'Hư hỏng', 
            value: roomStatsData.stats.damagedRooms, 
            color: '#dc3545' 
          }
        ];

        // Set chart data
        setData({
          monthlyRevenue: monthlyRevenueData,
          roomUsage: roomUsage.filter(item => item.value > 0), // Only show non-zero values
          revenueSource: serviceRevenueData,
          customerTraffic: dailyRevenueData.map(item => ({
            date: item.date,
            bookings: item.bookingsCount,
            customers: Math.floor(item.bookingsCount * 1.5) // Estimate customers from bookings
          }))
        });

        // Generate dynamic alerts
        const dynamicAlerts = [];
        
        const maintenanceCount = roomStatsData.stats.maintenanceRooms;
        const damagedCount = roomStatsData.stats.damagedRooms;
        if (maintenanceCount > 0 || damagedCount > 0) {
          dynamicAlerts.push({
            icon: FaExclamationTriangle,
            text: `${maintenanceCount} phòng đang bảo trì, ${damagedCount} phòng hư hỏng`,
            color: '#dc3545',
            bgColor: '#f8d7da'
          });
        }

        // Check for pending payments (estimate)
        const pendingPayments = bookingStatsData.bookings.filter(
          b => b.TrangThai === 'Chờ thanh toán' || b.status === 'pending'
        ).length;
        if (pendingPayments > 0) {
          dynamicAlerts.push({
            icon: FaCreditCard,
            text: `${pendingPayments} đơn đặt chờ thanh toán`,
            color: '#fd7e14',
            bgColor: '#fed8b1'
          });
        }

        // Today's check-ins
        if (bookingStatsData.stats.todayBookings > 0) {
          dynamicAlerts.push({
            icon: FaCalendarDay,
            text: `${bookingStatsData.stats.todayBookings} khách sắp đến hôm nay`,
            color: '#17a2b8',
            bgColor: '#d1ecf1'
          });
        }

        // Default alert for promotions (since we don't have promo API data)
        dynamicAlerts.push({
          icon: FaClock,
          text: 'Kiểm tra khuyến mãi sắp hết hạn',
          color: '#ffc107',
          bgColor: '#fff3cd'
        });

        setAlerts(dynamicAlerts);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Không thể tải dữ liệu dashboard. Sử dụng dữ liệu mẫu.');
        
        // Set fallback data on error
        setKpiStats({
          totalRooms: 45,
          emptyRooms: 25,
          occupiedRooms: 15,
          todayBookings: 8,
          todayRevenue: 12500000,
          newCustomersToday: 3
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      'Hoàn tất': { bg: 'success', text: 'white' },
      'Đang ở': { bg: 'primary', text: 'white' },
      'Đã xác nhận': { bg: 'info', text: 'white' },
      'Hủy': { bg: 'danger', text: 'white' }
    };
    const style = statusMap[status] || { bg: 'secondary', text: 'white' };
    return `badge bg-${style.bg}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

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

  if (loading) {
    return (
      <div className="container-fluid p-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Đang tải dữ liệu dashboard...</span>
            </div>
            <h5 className="text-muted">Đang tải thống kê từ cơ sở dữ liệu...</h5>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning" role="alert">
          <h5 className="alert-heading">⚠️ Thông báo</h5>
          <p className="mb-0">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container-fluid p-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-secondary" role="status">
              <span className="visually-hidden">Không có dữ liệu...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold text-dark mb-2">Dashboard</h1>
          <p className="lead text-muted">Tổng quan hoạt động khách sạn</p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="row g-4 mb-5">
        <div className="col-xl-2 col-lg-4 col-md-6">
          <KPICard
            icon={FaHome}
            title="Số phòng hiện có"
            value={kpiStats.totalRooms.toString()}
            subtitle="phòng"
            color="#ffffff"
            bgColor="#007bff"
          />
        </div>
        <div className="col-xl-2 col-lg-4 col-md-6">
          <KPICard
            icon={FaBed}
            title="Phòng đang trống"
            value={kpiStats.emptyRooms.toString()}
            subtitle="phòng"
            color="#ffffff"
            bgColor="#28a745"
          />
        </div>
        <div className="col-xl-2 col-lg-4 col-md-6">
          <KPICard
            icon={FaUsers}
            title="Phòng đang sử dụng"
            value={kpiStats.occupiedRooms.toString()}
            subtitle="phòng"
            color="#ffffff"
            bgColor="#17a2b8"
          />
        </div>
        <div className="col-xl-2 col-lg-4 col-md-6">
          <KPICard
            icon={FaClipboardList}
            title="Đơn đặt hôm nay"
            value={kpiStats.todayBookings.toString()}
            subtitle="đơn"
            color="#ffffff"
            bgColor="#fd7e14"
          />
        </div>
        <div className="col-xl-2 col-lg-4 col-md-6">
          <KPICard
            icon={FaMoneyBillWave}
            title="Doanh thu hôm nay"
            value={`${(kpiStats.todayRevenue / 1000000).toFixed(1)}M`}
            subtitle="VNĐ"
            color="#ffffff"
            bgColor="#6f42c1"
          />
        </div>
        <div className="col-xl-2 col-lg-4 col-md-6">
          <KPICard
            icon={FaUserPlus}
            title="Khách hàng mới"
            value={kpiStats.newCustomersToday.toString()}
            subtitle="người"
            color="#ffffff"
            bgColor="#20c997"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="row g-4 mb-5">
        {/* Monthly Revenue Chart */}
        <div className="col-xl-6 col-lg-12">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-semibold mb-0">📈 Doanh thu theo tháng</h5>
                <small className="text-muted">Năm {new Date().getFullYear()}</small>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007bff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#007bff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6c757d" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} 
                      stroke="#6c757d"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Doanh thu']} 
                      labelFormatter={(label) => `Tháng ${label}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        fontSize: '14px'
                      }}
                      cursor={{ stroke: '#007bff', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#007bff" 
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      dot={{ fill: '#007bff', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#007bff', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Room Usage Pie Chart */}
        <div className="col-xl-6 col-lg-12">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-semibold mb-0">🏠 Tỷ lệ sử dụng phòng</h5>
                <small className="text-muted">Hiện tại</small>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <Pie
                      data={data.roomUsage}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                      style={{ filter: "url(#shadow)" }}
                    >
                      {data.roomUsage.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        fontSize: '14px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Source Bar Chart */}
        <div className="col-xl-6 col-lg-12">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-semibold mb-0">💳 Nguồn doanh thu</h5>
                <small className="text-muted">Tháng này</small>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueSource} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#28a745" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#20c997" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" opacity={0.5} />
                    <XAxis 
                      dataKey="source" 
                      stroke="#6c757d" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} 
                      stroke="#6c757d"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Doanh thu']} 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        fontSize: '14px'
                      }}
                      cursor={{ fill: 'rgba(40, 167, 69, 0.1)' }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Traffic Chart */}
        <div className="col-xl-6 col-lg-12">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-semibold mb-0">🧍‍♀️ Lượng khách theo thời gian</h5>
                <small className="text-muted">7 ngày qua</small>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.customerTraffic} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fd7e14" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#fd7e14" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#17a2b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#17a2b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6c757d" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#6c757d"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        fontSize: '14px'
                      }}
                      cursor={{ stroke: '#17a2b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#fd7e14" 
                      strokeWidth={3}
                      name="Đặt phòng"
                      fill="url(#bookingGradient)"
                      dot={{ fill: '#fd7e14', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#fd7e14', strokeWidth: 2, fill: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="#17a2b8" 
                      strokeWidth={3}
                      name="Khách hàng"
                      fill="url(#customerGradient)"
                      dot={{ fill: '#17a2b8', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#17a2b8', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row g-4">
        {/* Recent Bookings Table */}
        <div className="col-xl-8 col-lg-12">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="card-title fw-semibold mb-0">📋 Đơn đặt phòng gần nhất</h5>
              <select className="form-select form-select-sm" style={{ width: '200px' }}>
                <option value="">Tất cả trạng thái</option>
                <option value="Đang ở">Đang ở</option>
                <option value="Hoàn tất">Hoàn tất</option>
                <option value="Hủy">Hủy</option>
              </select>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">Mã đơn</th>
                      <th className="border-0 fw-semibold">Khách hàng</th>
                      <th className="border-0 fw-semibold">Phòng</th>
                      <th className="border-0 fw-semibold">Ngày nhận</th>
                      <th className="border-0 fw-semibold">Ngày trả</th>
                      <th className="border-0 fw-semibold">Trạng thái</th>
                      <th className="border-0 fw-semibold">Tổng tiền</th>
                      <th className="border-0"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="align-middle">
                          <code className="bg-light text-dark px-2 py-1 rounded">
                            {booking.id}
                          </code>
                        </td>
                        <td className="align-middle">{booking.customer}</td>
                        <td className="align-middle">
                          <span className="fw-bold text-primary">{booking.room}</span>
                        </td>
                        <td className="align-middle">{booking.checkIn}</td>
                        <td className="align-middle">{booking.checkOut}</td>
                        <td className="align-middle">
                          <span className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="align-middle fw-semibold">
                          {formatCurrency(booking.total)}
                        </td>
                        <td className="align-middle">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => { 
                              setSelectedBooking(booking.fullBooking); 
                              setShowDetailModal(true); 
                            }}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Abnormal Rooms Table */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0">
              <h5 className="card-title fw-semibold mb-0">⚠️ Danh sách phòng bất thường</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">Mã phòng</th>
                      <th className="border-0 fw-semibold">Tên phòng</th>
                      <th className="border-0 fw-semibold">Tình trạng</th>
                      <th className="border-0 fw-semibold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abnormalRooms.map((room, index) => (
                      <tr key={index}>
                        <td className="align-middle">
                          <code className="bg-light text-dark px-2 py-1 rounded">
                            {room.code}
                          </code>
                        </td>
                        <td className="align-middle">{room.name}</td>
                        <td className="align-middle">
                          <span 
                            className="badge px-3 py-2"
                            style={{ 
                              backgroundColor: room.color,
                              color: 'white'
                            }}
                          >
                            {room.status}
                          </span>
                        </td>
                        <td className="align-middle text-muted">{room.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="col-xl-4 col-lg-12">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0">
              <h5 className="card-title fw-semibold mb-0">🔔 Cảnh báo & thông báo</h5>
            </div>
            <div className="card-body">
              {alerts.map((alert, index) => (
                <AlertItem
                  key={index}
                  icon={alert.icon}
                  text={alert.text}
                  color={alert.color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className={`modal fade ${showDetailModal ? 'show' : ''}`} style={{ display: showDetailModal ? 'block' : 'none' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết đặt phòng</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Thông tin cơ bản</h6>
                    <p><strong>Mã đặt phòng:</strong> {selectedBooking.MaDatPhong || 'N/A'}</p>
                    <p><strong>Khách hàng:</strong> {selectedBooking.KhachHang?.HoTen || selectedBooking.IDKhachHang || 'N/A'}</p>
                    <p><strong>Phòng:</strong> {selectedBooking.Phong?.TenPhong || selectedBooking.MaPhong || 'N/A'}</p>
                    <p><strong>Số người:</strong> {selectedBooking.SoNguoi || 'N/A'}</p>
                    <p><strong>Trạng thái:</strong> {selectedBooking.TrangThai || 'N/A'}</p>
                    <p><strong>Ghi chú:</strong> {selectedBooking.GhiChu || 'Không có'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Thời gian</h6>
                    <p><strong>Ngày đặt:</strong> {parseDateValue(selectedBooking.NgayDat) ? parseDateValue(selectedBooking.NgayDat).toLocaleDateString('vi-VN') : 'N/A'}</p>
                    <p><strong>Ngày nhận phòng:</strong> {parseDateValue(selectedBooking.NgayNhanPhong) ? parseDateValue(selectedBooking.NgayNhanPhong).toLocaleDateString('vi-VN') : 'N/A'}</p>
                    <p><strong>Ngày trả phòng:</strong> {parseDateValue(selectedBooking.NgayTraPhong) ? parseDateValue(selectedBooking.NgayTraPhong).toLocaleDateString('vi-VN') : 'N/A'}</p>
                    <p><strong>Tiền cọc:</strong> {formatCurrency(selectedBooking.TienCoc || 0)}</p>
                  </div>
                </div>
                
                {selectedBooking.DichVuSuDung && selectedBooking.DichVuSuDung.length > 0 && (
                  <div className="mt-3">
                    <h6>Dịch vụ sử dụng</h6>
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Mã dịch vụ</th>
                          <th>Số lượng</th>
                          <th>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBooking.DichVuSuDung.map((dv, index) => (
                          <tr key={index}>
                            <td>{dv.MaDichVu || 'N/A'}</td>
                            <td>{dv.SoLuong || 0}</td>
                            <td>{formatCurrency(dv.ThanhTien || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {selectedBooking.HoaDon && (
                  <div className="mt-3">
                    <h6>Thông tin hóa đơn</h6>
                    <p><strong>Mã hóa đơn:</strong> {selectedBooking.HoaDon.MaHoaDon || 'N/A'}</p>
                    <p><strong>Ngày lập:</strong> {parseDateValue(selectedBooking.HoaDon.NgayLap) ? parseDateValue(selectedBooking.HoaDon.NgayLap).toLocaleDateString('vi-VN') : 'N/A'}</p>
                    <p><strong>Tổng tiền phòng:</strong> {formatCurrency(selectedBooking.HoaDon.TongTienPhong || 0)}</p>
                    <p><strong>Tổng tiền dịch vụ:</strong> {formatCurrency(selectedBooking.HoaDon.TongTienDichVu || 0)}</p>
                    <p><strong>Giảm giá:</strong> {formatCurrency(selectedBooking.HoaDon.GiamGia || 0)}</p>
                    <p><strong>Tổng tiền:</strong> {formatCurrency(selectedBooking.HoaDon.TongTien || 0)}</p>
                    <p><strong>Tình trạng:</strong> {selectedBooking.HoaDon.TinhTrang || 'N/A'}</p>
                    <p><strong>Ghi chú:</strong> {selectedBooking.HoaDon.GhiChu || 'Không có'}</p>
                    
                    {selectedBooking.HoaDon.LichSuThanhToan && selectedBooking.HoaDon.LichSuThanhToan.length > 0 && (
                      <div className="mt-2">
                        <strong>Lịch sử thanh toán:</strong>
                        <ul className="list-unstyled mt-1">
                          {selectedBooking.HoaDon.LichSuThanhToan.map((tt, index) => (
                            <li key={index}>
                              {parseDateValue(tt.NgayThanhToan) ? parseDateValue(tt.NgayThanhToan).toLocaleDateString('vi-VN') : 'N/A'}: 
                              {formatCurrency(tt.SoTien || 0)} - {tt.PhuongThuc || tt.PhongThuc || 'N/A'} - {tt.TrangThai || 'N/A'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDetailModal && <div className="modal-backdrop fade show" onClick={() => setShowDetailModal(false)}></div>}
    </div>
  );
};

export default DashboardPage;
