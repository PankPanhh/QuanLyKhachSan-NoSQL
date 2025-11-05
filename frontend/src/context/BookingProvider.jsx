import React, { useState } from "react";
import { getRoomById } from "../services/roomService";
import { BookingContext } from "./BookingContext";

export const BookingProvider = ({ children }) => {
  const [bookingDetails, setBookingDetails] = useState({
    room: null,
    roomId: null,
    promo: null,
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

      // allow applying promo by object or id
      if (details.promo) {
        merged.promo = details.promo;
      }

      // If user selected a room (object or id) and didn't explicitly pass a promo,
      // attempt to auto-apply any eligible promotion from the room data.
      const tryApplyPromoFromRoom = async () => {
        try {
          let roomObj = null;
          if (details.room && typeof details.room === 'object') roomObj = details.room;
          else if (merged.roomId) {
            // fetch room details
            roomObj = await getRoomById(merged.roomId);
          }

          if (!roomObj) return;

          const promos = Array.isArray(roomObj.KhuyenMai) ? roomObj.KhuyenMai : (roomObj.MaKhuyenMai ? (Array.isArray(roomObj.MaKhuyenMai) ? roomObj.MaKhuyenMai : [roomObj.MaKhuyenMai]) : []);
          if (!promos || promos.length === 0) return;

          const now = new Date();
          const roomType = roomObj.LoaiPhong || roomObj.roomType || '';

          const normalize = (p) => ({
            MaKhuyenMai: p.MaKhuyenMai || p.MaKM || p.Ma || null,
            TenChuongTrinh: p.TenChuongTrinh || p.Ten || p.TenKM || null,
            LoaiGiamGia: p.LoaiGiamGia || p.LoaiGiam || '',
            GiaTriGiam: p.GiaTriGiam != null ? p.GiaTriGiam : (p.GiaTri != null ? p.GiaTri : p.value),
            NgayBatDau: p.NgayBatDau ? new Date(p.NgayBatDau) : null,
            NgayKetThuc: p.NgayKetThuc ? new Date(p.NgayKetThuc) : null,
            DieuKien: p.DieuKien || p.DieuKhoan || p.Condition || '',
            TrangThai: p.TrangThai || p.Status || '',
            raw: p,
          });

          const normalized = promos.map(normalize);

          const matchPromo = normalized.find((p) => {
            if (!p) return false;
            if (String((p.TrangThai || '')).trim() !== 'Hoạt động') return false;
            if (p.NgayBatDau && p.NgayBatDau > now) return false;
            if (p.NgayKetThuc && p.NgayKetThuc < now) return false;
            // check DieuKien: if empty, treat as match. Otherwise, check if roomType appears in DieuKien (case-insensitive) or DieuKien contains 'Tất cả'
            if (p.DieuKien) {
              const dk = String(p.DieuKien).toLowerCase();
              if (dk.includes('tất cả')) return true;
              if (roomType && dk.includes(String(roomType).toLowerCase())) return true;
              // fallback: check if any word in roomType appears in dk
              const parts = String(roomType || '').toLowerCase().split(/\s+/).filter(Boolean);
              if (parts.some(part => dk.includes(part))) return true;
              return false;
            }
            return true;
          });

          if (matchPromo) {
            // apply to booking details
            setBookingDetails((cur) => ({
              ...cur,
              promo: {
                title: matchPromo.TenChuongTrinh || matchPromo.raw?.TenChuongTrinh || matchPromo.MaKhuyenMai,
                discountPercent: (String((matchPromo.LoaiGiamGia || '')).toLowerCase().includes('phần') ? matchPromo.GiaTriGiam : undefined),
                discountAmount: (String((matchPromo.LoaiGiamGia || '')).toLowerCase().includes('phần') ? undefined : matchPromo.GiaTriGiam),
                startDate: matchPromo.NgayBatDau,
                endDate: matchPromo.NgayKetThuc,
              },
              // invoice fields required by backend mapping
              KhuyenMaiApDung: matchPromo.MaKhuyenMai,
              GiaTriGiam: matchPromo.GiaTriGiam,
              LoaiGiamGia: matchPromo.LoaiGiamGia,
            }));
          }
        } catch (e) {
          // ignore fetch/apply errors silently
          console.error('Error applying promo from room:', e);
        }
      };

      // Trigger async promo application but don't await here
      if (!details.promo && (details.room || details.roomId)) {
        tryApplyPromoFromRoom();
      }

      return merged;
    });
  };

  const resetBooking = () => {
    setBookingDetails({
      room: null,
      roomId: null,
      promo: null,
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
