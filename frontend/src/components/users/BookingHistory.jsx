import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getUserBookings } from '../../services/bookingService';

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      getUserBookings(user.id)
        .then(data => {
          setBookings(data);
          setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }
  }, [user]);
  
  if(loading) return <p>Đang tải lịch sử...</p>
  
  return (
    <div>
        <h4>Lịch sử đặt phòng</h4>
        {bookings.length === 0 ? (
            <p>Bạn chưa có lịch sử đặt phòng nào.</p>
        ) : (
            <table className="table">
                {/* ... Render bảng lịch sử ... */}
            </table>
        )}
    </div>
  );
}

export default BookingHistory;
