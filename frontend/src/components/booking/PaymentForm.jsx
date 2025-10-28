import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../common/InputField';
import Button from '../common/Button';
import Spinner from '../../components/common/Spinner';
import { BookingContext } from '../../context/BookingContext'; // SỬA: Thêm BookingContext
import { AuthContext } from '../../context/AuthContext'; // SỬA: Thêm AuthContext
import { createBooking } from '../../services/bookingService';

function PaymentForm() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { bookingDetails, clearBookingDetails } = useContext(BookingContext);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // SỬA: Lấy thông tin user từ AuthContext để điền sẵn
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    ccNumber: '',
    ccExpiry: '',
    ccCvv: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Kiểm tra logic đăng nhập
    if (!user) {
      setError('Bạn cần đăng nhập để tiếp tục.');
      setIsLoading(false);
      // Lưu trang hiện tại để quay lại sau khi đăng nhập
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    // Kiểm tra thông tin booking
    if (!bookingDetails.room) {
      setError('Thiếu thông tin đặt phòng. Vui lòng chọn phòng trước.');
      setIsLoading(false);
      navigate('/rooms');
      return;
    }

    // 1. Tạo đối tượng booking từ Context
    const bookingData = {
      userId: user.id,
      roomId: bookingDetails.roomId,
      checkIn: bookingDetails.checkIn, // Đã là string 'yyyy-MM-dd'
      checkOut: bookingDetails.checkOut, // Đã là string 'yyyy-MM-dd'
      numGuests: bookingDetails.guests,
      numRooms: bookingDetails.rooms,
      status: 'pending',
      contactInfo: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      },
      paymentStatus: 'Paid', // Giả lập đã thanh toán
    };

    try {
      // 2. Gọi service (giả lập)
      await createBooking(bookingData);
      
      // 3. Xóa context
      clearBookingDetails();
      setIsLoading(false);

      // 4. Chuyển hướng
      alert('Đặt phòng thành công!'); 
      navigate('/'); // Về trang chủ
      
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi đặt phòng.');
      setIsLoading(false);
    }
  };
    
  return (
    <form onSubmit={handleSubmit}>
      <h5 className="mb-3">Thông tin liên hệ</h5>
      <InputField 
        label="Họ và tên" 
        id="fullName" 
        value={formData.fullName} 
        onChange={handleChange} 
        placeholder="Nguyễn Văn A" 
        required 
      />
      <InputField 
        label="Email" 
        id="email" 
        type="email" 
        value={formData.email} 
        onChange={handleChange} 
        placeholder="email@example.com" 
        required 
      />
      <InputField 
        label="Số điện thoại" 
        id="phone" 
        type="tel" 
        value={formData.phone} 
        onChange={handleChange} 
        placeholder="090..." 
        required 
      />

      <hr className="my-4" />
      
      <h5 className="mb-3">Thông tin thẻ (Giả lập)</h5>
      <InputField 
        label="Số thẻ" 
        id="ccNumber" // SỬA: Đổi id cho nhất quán
        value={formData.ccNumber} 
        onChange={handleChange} 
        placeholder="XXXX XXXX XXXX XXXX" 
      />
      <div className="row">
        <div className="col-md-6">
            <InputField 
              label="Ngày hết hạn" 
              id="ccExpiry" // SỬA: Đổi id cho nhất quán
              value={formData.ccExpiry} 
              onChange={handleChange} 
              placeholder="MM/YY" 
            />
        </div>
        <div className="col-md-6">
            <InputField 
              label="CVV" 
              id="ccCvv" // SỬA: Đổi id cho nhất quán
              value={formData.ccCvv} 
              onChange={handleChange} 
              placeholder="XXX" 
            />
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        className="btn btn-primary btn-lg w-100 mt-3"
        disabled={isLoading}
      >
        {isLoading ? <Spinner /> : 'Thanh toán & Đặt phòng'}
      </Button>
    </form>
  );
}

export default PaymentForm;