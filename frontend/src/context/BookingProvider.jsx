import React, { useState } from "react";
import { getRoomById } from "../services/roomService";
import { BookingContext } from "./BookingContext";

export const BookingProvider = ({ children }) => {
  const formatLocalYMD = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  const [bookingDetails, setBookingDetails] = useState({
    room: null,
    roomId: null,
    promo: null,
    DichVuDaChon: [],
    checkInDate: new Date(),
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    checkIn: formatLocalYMD(new Date()),
    checkOut: formatLocalYMD(
      new Date(new Date().setDate(new Date().getDate() + 1))
    ),
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

      if (merged.checkInDate && merged.checkInDate.getFullYear) {
        merged.checkIn = formatLocalYMD(merged.checkInDate);
      } else if (details.checkIn) {
        merged.checkIn = details.checkIn;
      }

      if (merged.checkOutDate && merged.checkOutDate.getFullYear) {
        merged.checkOut = formatLocalYMD(merged.checkOutDate);
      } else if (details.checkOut) {
        merged.checkOut = details.checkOut;
      }

      // allow applying promo by object or id
      if (details.promo) {
        merged.promo = details.promo;
      }

      // Helper: parse YYYY-MM-DD to local Date at 00:00
      const parseYMD = (s) => {
        try {
          if (!s) return null;
          if (s.getFullYear)
            return new Date(s.getFullYear(), s.getMonth(), s.getDate());
          const parts = String(s).split("-");
          if (parts.length !== 3) return new Date(s);
          const y = Number(parts[0]);
          const m = Number(parts[1]) - 1;
          const d = Number(parts[2]);
          return new Date(y, m, d);
        } catch (e) {
          return new Date(s);
        }
      };

      // Validate existing promo against the selected stay dates and remove if not applicable
      const checkInLocal =
        merged.checkInDate && merged.checkInDate.getFullYear
          ? new Date(
              merged.checkInDate.getFullYear(),
              merged.checkInDate.getMonth(),
              merged.checkInDate.getDate()
            )
          : parseYMD(merged.checkIn);
      const checkOutLocal =
        merged.checkOutDate && merged.checkOutDate.getFullYear
          ? new Date(
              merged.checkOutDate.getFullYear(),
              merged.checkOutDate.getMonth(),
              merged.checkOutDate.getDate()
            )
          : parseYMD(merged.checkOut);

      const promoIsValidForStay = (promoObj) => {
        if (!promoObj) return false;
        const start = promoObj.startDate ? parseYMD(promoObj.startDate) : null;
        const end = promoObj.endDate ? parseYMD(promoObj.endDate) : null;
        if (!checkInLocal || !checkOutLocal) return false;
        // Treat stay as [checkInLocal, checkOutLocal) and promo as inclusive days [start, end]
        const stayStart = checkInLocal;
        const stayEndExclusive = checkOutLocal;
        const promoStart = start
          ? new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate(),
              0,
              0,
              0,
              0
            )
          : null;
        const promoEnd = end
          ? new Date(
              end.getFullYear(),
              end.getMonth(),
              end.getDate(),
              23,
              59,
              59,
              999
            )
          : null;
        if (promoStart && promoEnd) {
          return promoEnd >= stayStart && promoStart < stayEndExclusive;
        }
        if (promoStart && !promoEnd) {
          return promoStart < stayEndExclusive;
        }
        if (!promoStart && promoEnd) {
          return promoEnd >= stayStart;
        }
        return true;
      };

      if (merged.promo && !promoIsValidForStay(merged.promo)) {
        // clear stale promo
        delete merged.promo;
        delete merged.KhuyenMaiApDung;
        delete merged.GiaTriGiam;
        delete merged.LoaiGiamGia;
      }

      // If user selected a room (object or id) and didn't explicitly pass a promo,
      // attempt to auto-apply any eligible promotion from the room data based on the selected stay dates.
      const tryApplyPromoFromRoom = async () => {
        try {
          let roomObj = null;
          if (details.room && typeof details.room === "object")
            roomObj = details.room;
          else if (merged.roomId) {
            // fetch room details
            roomObj = await getRoomById(merged.roomId);
          }

          if (!roomObj) return;

          const promos = Array.isArray(roomObj.KhuyenMai)
            ? roomObj.KhuyenMai
            : roomObj.MaKhuyenMai
            ? Array.isArray(roomObj.MaKhuyenMai)
              ? roomObj.MaKhuyenMai
              : [roomObj.MaKhuyenMai]
            : [];
          if (!promos || promos.length === 0) return;

          const roomType = roomObj.LoaiPhong || roomObj.roomType || "";

          const normalize = (p) => ({
            MaKhuyenMai: p.MaKhuyenMai || p.MaKM || p.Ma || null,
            TenChuongTrinh: p.TenChuongTrinh || p.Ten || p.TenKM || null,
            LoaiGiamGia: p.LoaiGiamGia || p.LoaiGiam || "",
            GiaTriGiam:
              p.GiaTriGiam != null
                ? p.GiaTriGiam
                : p.GiaTri != null
                ? p.GiaTri
                : p.value,
            NgayBatDau: p.NgayBatDau ? parseYMD(p.NgayBatDau) : null,
            NgayKetThuc: p.NgayKetThuc ? parseYMD(p.NgayKetThuc) : null,
            DieuKien: p.DieuKien || p.DieuKhoan || p.Condition || "",
            TrangThai: p.TrangThai || p.Status || "",
            raw: p,
          });

          const normalized = promos.map(normalize);

          const matchPromo = normalized.find((p) => {
            if (!p) return false;
            if (String(p.TrangThai || "").trim() !== "Hoạt động") return false;
            // require promo to overlap the selected stay
            if (
              !promoIsValidForStay({
                startDate: p.NgayBatDau,
                endDate: p.NgayKetThuc,
              })
            )
              return false;
            // check DieuKien: if empty, treat as match. Otherwise, check if roomType appears in DieuKien (case-insensitive) or DieuKien contains 'Tất cả'
            if (p.DieuKien) {
              const dk = String(p.DieuKien).toLowerCase();
              if (dk.includes("tất cả")) return true;
              if (roomType && dk.includes(String(roomType).toLowerCase()))
                return true;
              const parts = String(roomType || "")
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean);
              if (parts.some((part) => dk.includes(part))) return true;
              return false;
            }
            return true;
          });

          if (matchPromo) {
            // apply to booking details
            setBookingDetails((cur) => ({
              ...cur,
              promo: {
                title:
                  matchPromo.TenChuongTrinh ||
                  matchPromo.raw?.TenChuongTrinh ||
                  matchPromo.MaKhuyenMai,
                discountPercent: String(matchPromo.LoaiGiamGia || "")
                  .toLowerCase()
                  .includes("phần")
                  ? matchPromo.GiaTriGiam
                  : undefined,
                discountAmount: String(matchPromo.LoaiGiamGia || "")
                  .toLowerCase()
                  .includes("phần")
                  ? undefined
                  : matchPromo.GiaTriGiam,
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
          console.error("Error applying promo from room:", e);
        }
      };

      // Trigger async promo application but don't await here
      if (!details.promo && (details.room || details.roomId)) {
        // only attempt to auto-apply if we have a valid checkin/checkout
        if (checkInLocal && checkOutLocal) tryApplyPromoFromRoom();
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
      checkIn: formatLocalYMD(new Date()),
      checkOut: formatLocalYMD(
        new Date(new Date().setDate(new Date().getDate() + 1))
      ),
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
