import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String }, // Ten icon (vi du: 'wifi', 'pool')
});

const promotionSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  description: { type: String, required: true },
  discountPercent: { type: Number, min: 0, max: 100 },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
});

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
});

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tieu de phong la bat buoc'],
    },
    description: {
      type: String,
      required: true,
    },
    roomType: {
      type: String,
      required: true, // Vi du: 'Standard', 'Deluxe', 'Suite'
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Gia phong la bat buoc'],
      min: 0,
    },
    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    bedType: {
      type: String, // Vi du: 'Single', 'Double', 'Queen', 'King'
    },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Maintenance'],
      default: 'Available',
    },
    images: [
      {
        url: { type: String, required: true },
        altText: { type: String },
      },
    ],
    amenities: [amenitySchema], // Nhúng schema tiện nghi
    promotions: [promotionSchema], // Nhúng schema khuyến mãi
    extraServices: [serviceSchema], // Nhúng schema dịch vụ
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);
const Amenity = mongoose.model('Amenity', amenitySchema);
const Promotion = mongoose.model('Promotion', promotionSchema);
const Service = mongoose.model('Service', serviceSchema);

export { Room, Amenity, Promotion, Service };
