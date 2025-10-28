// Đây là file "giả lập" backend (mock API).
// Nó không gọi server thật, mà chỉ trả về dữ liệu giả (mock data) 
// sau một khoảng trễ để mô phỏng request mạng.

// === DỮ LIỆU GIẢ ===

const MOCK_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@hotel.com', password: '123456', isAdmin: true },
  { id: 2, name: 'Khách Hàng A', email: 'user@hotel.com', password: '123456', isAdmin: false },
];

const MOCK_ROOMS = [
  {
    id: 1,
    slug: 'grand-deluxe',
    title: 'Grand deluxe rooms',
    imageUrl: '/images/room1.jpg',
    images: ['/images/room1.jpg', '/images/about-img1.jpg', '/images/about-img2.jpg'],
    description: 'Một căn phòng sang trọng với đầy đủ tiện nghi, cửa sổ lớn nhìn ra thành phố. Trải nghiệm sự thoải mái tuyệt đối.',
    price: 269,
    details: {
      size: '35 m²',
      capacity: 'Tối đa 2 người',
      bed: '1 Giường King',
      services: 'Wifi, Tivi, Bồn tắm, Mini bar'
    }
  },
  {
    id: 2,
    slug: 'sweet-family',
    title: 'Sweet Family room',
    imageUrl: '/images/room3.jpg',
    images: ['/images/room3.jpg', '/images/about-img3.jpg', '/images/item1.jpg'],
    description: 'Phòng gia đình rộng rãi với khu vực sinh hoạt riêng. Hoàn hảo cho các kỳ nghỉ cùng những người thân yêu.',
    price: 360,
    details: {
      size: '50 m²',
      capacity: 'Tối đa 4 người',
      bed: '1 Giường King & 2 Giường đơn',
      services: 'Wifi, Tivi, Sofa, Bồn tắm'
    }
  },
  {
    id: 3,
    slug: 'perfect-double',
    title: 'Perfect Double Room',
    imageUrl: '/images/room2.jpg',
    images: ['/images/room2.jpg', '/images/item2.jpg', '/images/item3.jpg'],
    description: 'Thiết kế hiện đại, ấm cúng. Căn phòng này cung cấp mọi thứ bạn cần cho một chuyến công tác hoặc kỳ nghỉ ngắn ngày.',
    price: 450,
    details: {
      size: '30 m²',
      capacity: 'Tối đa 2 người',
      bed: '1 Giường Queen',
      services: 'Wifi, Tivi, Bàn làm việc'
    }
  },
];

// === CÁC HÀM API GIẢ LẬP ===

// Hàm giả lập độ trễ mạng
const networkDelay = (ms = 500) => new Promise(res => setTimeout(res, ms));

/**
 * Giả lập việc gọi API
 * @param {string} endpoint Đường dẫn API (ví dụ: '/login')
 * @param {object} options Các tùy chọn (method, body)
 */
const api = {
  post: async (endpoint, body) => {
    await networkDelay();
    
    if (endpoint === '/login') {
      const { email, password } = body;
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (user && password === '123456') { // Mật khẩu mới: '123456'
        const token = `mock-token-${Date.now()}`;
        // Không trả về password trong response
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
      } else {
        throw new Error('Email hoặc mật khẩu không đúng.');
      }
    }
    
    if (endpoint === '/register') {
      const { name, email } = body;
      if (MOCK_USERS.find(u => u.email === email)) {
        throw new Error('Email đã tồn tại.');
      }
      const newUser = { id: Date.now(), name, email, isAdmin: false };
      MOCK_USERS.push(newUser);
      const token = `mock-token-${Date.now()}`;
      return { user: newUser, token };
    }

    throw new Error('Endpoint POST không hỗ trợ');
  },

  get: async (endpoint) => {
    await networkDelay();
    
    if (endpoint === '/rooms') {
      return MOCK_ROOMS;
    }

    if (endpoint.startsWith('/rooms/')) {
      const id = parseInt(endpoint.split('/')[2], 10);
      const room = MOCK_ROOMS.find(r => r.id === id);
      if (room) {
        return room;
      } else {
        throw new Error('Không tìm thấy phòng.');
      }
    }
    
    // Admin endpoints (ví dụ)
    if (endpoint === '/admin/users') {
      return MOCK_USERS;
    }
    if (endpoint === '/admin/rooms') {
      return MOCK_ROOMS;
    }

    throw new Error('Endpoint GET không hỗ trợ');
  }
  
  // Bạn có thể thêm các phương thức giả lập 'put', 'delete' ở đây
};

export default api;
