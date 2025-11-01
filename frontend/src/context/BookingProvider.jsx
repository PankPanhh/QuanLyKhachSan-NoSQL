import React, { useState } from "react";
import { BookingContext } from "./BookingContext";

export const BookingProvider = ({ children }) => {
  const [bookingDetails, setBookingDetails] = useState({
    room: null,
    roomId: null,
    checkInDate: new Date(),
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(new Date().setDate(new Date().getDate() + 1))
      .toISOString()
      .split("T")[0],
    guests: 2,
    rooms: 1,
  });

  const updateBookingDetails = (details) => {
    setBookingDetails((prev) => {
      const merged = { ...prev, ...details };

      if (merged.room) {
        if (typeof merged.room === "string") merged.roomId = merged.room;
        else if (typeof merged.room === "object")
          merged.roomId =
            merged.room._id || merged.room.id || merged.roomId || null;
      } else if (details.roomId) {
        merged.roomId = details.roomId;
      }

      if (merged.checkInDate && merged.checkInDate.toISOString) {
        merged.checkIn = merged.checkInDate.toISOString().split("T")[0];
      } else if (details.checkIn) {
        merged.checkIn = details.checkIn;
      }

      if (merged.checkOutDate && merged.checkOutDate.toISOString) {
        merged.checkOut = merged.checkOutDate.toISOString().split("T")[0];
      } else if (details.checkOut) {
        merged.checkOut = details.checkOut;
      }

      return merged;
    });
  };

  const resetBooking = () => {
    setBookingDetails({
      room: null,
      roomId: null,
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      checkIn: new Date().toISOString().split("T")[0],
      checkOut: new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split("T")[0],
      guests: 2,
      rooms: 1,
    });
  };

  const clearBookingDetails = resetBooking;

  return (
    <BookingContext.Provider
      value={{
        bookingDetails,
        updateBookingDetails,
        resetBooking,
        clearBookingDetails,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export default BookingProvider;
