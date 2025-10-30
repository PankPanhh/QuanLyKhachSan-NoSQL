import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import { calculateBookingTotal } from '../utils/calculateTotal.js';
// import { sendEmail } from '../services/emailService.js';

// @desc    Tao don dat phong moi
// @route   POST /api/v1/bookings
// @access  Private (KhachHang da dang nhap)
export const createBooking = async (req, res, next) => {
  const {
    roomId,
    checkIn, // Mong doi 'yyyy-MM-dd'
    checkOut, // Mong doi 'yyyy-MM-dd'
    numGuests,
    numRooms,
    contactInfo,
  } = req.body;
  
  const userId = req.user._id; // Lay tu middleware 'protect'

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Khong tim thay phong' });
    }

    // TODO: Kiem tra xem phong co san trong ngay do khong

    // Tinh tong tien
    const totalPrice = calculateBookingTotal(
      new Date(checkIn),
      new Date(checkOut),
      room.pricePerNight,
      numRooms
    );

    const booking = await Booking.create({
      user: userId,
      room: roomId,
      checkInDate: new Date(checkIn),
      checkOutDate: new Date(checkOut),
      numGuests,
      numRooms,
      totalPrice,
      contactInfo,
      paymentDetails: {
        amount: totalPrice,
        status: 'Pending', // Hoac 'Paid' neu thanh toan ngay
      }
    });
    
    // TODO: Cap nhat trang thai phong (neu can)
    
    // TODO: Gui email xac nhan
    // await sendEmail(contactInfo.email, 'Xac nhan dat phong', `Cam on ban da dat phong...`, `...`);

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Lay tat ca booking cua 1 user
// @route   GET /api/v1/bookings/mybookings
// @access  Private (KhachHang)
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('room');
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Lay chi tiet 1 booking
// @route   GET /api/v1/bookings/:id
// @access  Private (Chu booking hoac Admin)
export const getBookingById = async (req, res, next) => {
  // TODO: Logic lay chi tiet booking
  res.send(`GET Booking By ID: ${req.params.id}`);
};

// @desc    Huy booking
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Private (Chu booking hoac Admin)
export const cancelBooking = async (req, res, next) => {
  // TODO: Logic huy booking
  res.send(`CANCEL Booking: ${req.params.id}`);
};

// @desc    Lay tat ca booking (Admin)
// @route   GET /api/v1/bookings
// @access  Private (Admin)
export const getAllBookings = async (req, res, next) => {
  // TODO: Logic lay tat ca booking (Admin)
  res.send('GET All Bookings (Admin)');
};
