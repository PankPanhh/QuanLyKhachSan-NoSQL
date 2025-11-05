import Booking from "../models/Booking.js";

// Helpers
const toDate = (val) => (val instanceof Date ? val : new Date(val));

// @desc    Doanh thu theo ngày trong khoảng thời gian
// @route   GET /api/v1/reports/revenue/daily?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private (Admin)
export const getDailyRevenue = async (req, res, next) => {
  try {
    const tz = "Asia/Ho_Chi_Minh";
    const today = new Date();
    const defaultEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultEnd.getDate() - 29); // last 30 days

    const start = req.query.start ? toDate(req.query.start) : defaultStart;
    const end = req.query.end ? toDate(req.query.end) : defaultEnd;

    const rows = await Booking.aggregate([
      // Pipeline 1: Theo lịch sử thanh toán thành công
      { $unwind: "$HoaDon.LichSuThanhToan" },
      {
        $match: {
          "HoaDon.LichSuThanhToan.TrangThai": { $in: ["Thành công", "Thanh toán một phần"] },
          "HoaDon.LichSuThanhToan.NgayThanhToan": { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$HoaDon.LichSuThanhToan.NgayThanhToan",
              unit: "day",
              timezone: tz,
            },
          },
          revenue: { $sum: "$HoaDon.LichSuThanhToan.SoTien" },
          bookings: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          bookingsCount: { $size: "$bookings" },
        },
      },
      // Union với pipeline 2: fallback theo hóa đơn đã tất toán (nếu không có thanh toán thành công)
      {
        $unionWith: {
          coll: "DatPhong",
          pipeline: [
            {
              $addFields: {
                successPayments: {
                  $filter: {
                    input: { $ifNull: ["$HoaDon.LichSuThanhToan", []] },
                    as: "p",
                    cond: { $in: ["$$p.TrangThai", ["Thành công", "Thanh toán một phần"]] },
                  },
                },
              },
            },
            {
              $match: {
                $expr: { $eq: [{ $size: "$successPayments" }, 0] },
                "HoaDon.TinhTrang": "Đã thanh toán",
                "HoaDon.NgayLap": { $gte: start, $lte: end },
              },
            },
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: "$HoaDon.NgayLap",
                    unit: "day",
                    timezone: tz,
                  },
                },
                revenue: { $sum: "$HoaDon.TongTien" },
                bookings: { $addToSet: "$_id" },
              },
            },
            {
              $project: {
                _id: 0,
                date: "$_id",
                revenue: 1,
                bookingsCount: { $size: "$bookings" },
              },
            },
          ],
        },
      },
      // Gộp hai nguồn theo ngày
      {
        $group: {
          _id: "$date",
          revenue: { $sum: "$revenue" },
          bookingsCount: { $sum: "$bookingsCount" },
        },
      },
      { $project: { _id: 0, date: "$_id", revenue: 1, bookingsCount: 1 } },
      { $sort: { date: 1 } },
    ]);

    // Normalize to include all days in range with 0 revenue
    const map = new Map(rows.map((r) => [new Date(r.date).toDateString(), r]));
    const out = [];
    const cursor = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= endDay) {
      const key = cursor.toDateString();
      if (map.has(key)) {
        out.push(map.get(key));
      } else {
        out.push({ date: new Date(cursor), revenue: 0, bookingsCount: 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({ data: out });
  } catch (err) {
    next(err);
  }
};

// @desc    Doanh thu theo tháng trong 1 năm
// @route   GET /api/v1/reports/revenue/monthly?year=YYYY
// @access  Private (Admin)
export const getMonthlyRevenue = async (req, res, next) => {
  try {
    const tz = "Asia/Ho_Chi_Minh";
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const rows = await Booking.aggregate([
      // 1) Theo lịch sử thanh toán thành công
      { $unwind: "$HoaDon.LichSuThanhToan" },
      {
        $match: {
          "HoaDon.LichSuThanhToan.TrangThai": { $in: ["Thành công", "Thanh toán một phần"] },
          "HoaDon.LichSuThanhToan.NgayThanhToan": { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$HoaDon.LichSuThanhToan.NgayThanhToan",
              unit: "month",
              timezone: tz,
            },
          },
          revenue: { $sum: "$HoaDon.LichSuThanhToan.SoTien" },
          bookings: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          revenue: 1,
          bookingsCount: { $size: "$bookings" },
        },
      },
      // 2) Union fallback theo hóa đơn đã tất toán nhưng không có payment thành công
      {
        $unionWith: {
          coll: "DatPhong",
          pipeline: [
            {
              $addFields: {
                successPayments: {
                  $filter: {
                    input: { $ifNull: ["$HoaDon.LichSuThanhToan", []] },
                    as: "p",
                    cond: { $in: ["$$p.TrangThai", ["Thành công", "Thanh toán một phần"]] },
                  },
                },
              },
            },
            {
              $match: {
                $expr: { $eq: [{ $size: "$successPayments" }, 0] },
                "HoaDon.TinhTrang": "Đã thanh toán",
                "HoaDon.NgayLap": { $gte: start, $lte: end },
              },
            },
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: "$HoaDon.NgayLap",
                    unit: "month",
                    timezone: tz,
                  },
                },
                revenue: { $sum: "$HoaDon.TongTien" },
                bookings: { $addToSet: "$_id" },
              },
            },
            {
              $project: {
                _id: 0,
                month: "$_id",
                revenue: 1,
                bookingsCount: { $size: "$bookings" },
              },
            },
          ],
        },
      },
      // 3) Gộp hai nguồn theo tháng
      {
        $group: {
          _id: "$month",
          revenue: { $sum: "$revenue" },
          bookingsCount: { $sum: "$bookingsCount" },
        },
      },
      { $project: { _id: 0, month: "$_id", revenue: 1, bookingsCount: 1 } },
      { $sort: { month: 1 } },
    ]);

    // Normalize for 12 months
    const byMonth = new Map(rows.map((r) => [new Date(r.month).getMonth(), r]));
    const out = [];
    for (let m = 0; m < 12; m++) {
      if (byMonth.has(m)) out.push(byMonth.get(m));
      else
        out.push({ month: new Date(year, m, 1), revenue: 0, bookingsCount: 0 });
    }

    res.json({ data: out, year });
  } catch (err) {
    next(err);
  }
};

// Backward-compat placeholder (can return both summaries)
// @route GET /api/v1/reports/revenue
export const getRevenueReport = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const [daily, monthly] = await Promise.all([
      (async () => {
        const now = new Date();
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        const start = new Date(end);
        start.setDate(end.getDate() - 6); // last 7 days
        req.query = { start: start.toISOString(), end: end.toISOString() };
        // We can't call getDailyRevenue directly because it's express handler; re-run aggregation
        const tz = "Asia/Ho_Chi_Minh";
        const rows = await Booking.aggregate([
          { $unwind: "$HoaDon.LichSuThanhToan" },
          {
            $match: {
              "HoaDon.LichSuThanhToan.TrangThai": "Thành công",
              "HoaDon.LichSuThanhToan.NgayThanhToan": {
                $gte: start,
                $lte: end,
              },
            },
          },
          {
            $group: {
              _id: {
                $dateTrunc: {
                  date: "$HoaDon.LichSuThanhToan.NgayThanhToan",
                  unit: "day",
                  timezone: tz,
                },
              },
              revenue: { $sum: "$HoaDon.LichSuThanhToan.SoTien" },
            },
          },
          { $project: { _id: 0, date: "$_id", revenue: 1 } },
          { $sort: { date: 1 } },
        ]);
        return rows;
      })(),
      (async () => {
        const tz = "Asia/Ho_Chi_Minh";
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        const rows = await Booking.aggregate([
          { $unwind: "$HoaDon.LichSuThanhToan" },
          {
            $match: {
              "HoaDon.LichSuThanhToan.TrangThai": "Thành công",
              "HoaDon.LichSuThanhToan.NgayThanhToan": {
                $gte: start,
                $lte: end,
              },
            },
          },
          {
            $group: {
              _id: {
                $dateTrunc: {
                  date: "$HoaDon.LichSuThanhToan.NgayThanhToan",
                  unit: "month",
                  timezone: tz,
                },
              },
              revenue: { $sum: "$HoaDon.LichSuThanhToan.SoTien" },
            },
          },
          { $project: { _id: 0, month: "$_id", revenue: 1 } },
          { $sort: { month: 1 } },
        ]);
        return rows;
      })(),
    ]);
    res.json({ daily, monthly, year });
  } catch (err) {
    next(err);
  }
};
