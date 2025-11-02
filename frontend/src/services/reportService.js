// src/services/reportService.js
import api from "./api";

export const getMonthlyRevenue = async (year) => {
  const query = year ? `?year=${year}` : "";
  const res = await api.get(`/reports/revenue/monthly${query}`);
  // expected: { data: [ { month: ISODate, revenue, bookingsCount } ], year }
  return res?.data || [];
};

export const getDailyRevenue = async (start, end) => {
  const q = [];
  if (start) q.push(`start=${encodeURIComponent(start)}`);
  if (end) q.push(`end=${encodeURIComponent(end)}`);
  const query = q.length ? `?${q.join("&")}` : "";
  const res = await api.get(`/reports/revenue/daily${query}`);
  // expected: { data: [ { date: ISODate, revenue, bookingsCount } ] }
  return res?.data || [];
};
