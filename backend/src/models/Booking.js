import mongoose from 'mongoose';

const paymentDetailsSchema = new mongoose.Schema({
  method: { type: String, enum: ['Credit Card', 'Cash', 'Transfer'], default: 'Credit Card' },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  transactionId: { type: String },
  amount: { type: Number, required: true },
  paidAt: { type: Date },
});

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    numGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    numRooms: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Pending',
    },
    contactInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentDetails: paymentDetailsSchema, // Nhúng schema thanh toán
    specialRequests: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hóa đơn (Invoice) có thể là một phần của Booking hoặc một Model riêng
// O day ta xem 'paymentDetails' nhu mot phan cua hoa don
const Invoice = paymentDetailsSchema; // Vi du don gian

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
