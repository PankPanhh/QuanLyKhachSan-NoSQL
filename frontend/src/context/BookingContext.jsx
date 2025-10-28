import React, { createContext, useState } from 'react';

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookingDetails, setBookingDetails] = useState({
    room: null,
    checkInDate: new Date(),
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    guests: 2,
    rooms: 1,
  });

  const updateBookingDetails = (details) => {
    setBookingDetails(prev => ({ ...prev, ...details }));
  };

  const resetBooking = () => {
    setBookingDetails({
      room: null,
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      guests: 2,
      rooms: 1,
    });
  };

  return (
    <BookingContext.Provider value={{ bookingDetails, updateBookingDetails, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};
