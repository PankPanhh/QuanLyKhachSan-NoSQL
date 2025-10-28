// @desc    Tao bao cao doanh thu
// @route   GET /api/v1/reports/revenue
// @access  Private (Admin)
export const getRevenueReport = async (req, res, next) => {
  // TODO: Logic tinh toan doanh thu theo ngay/thang/nam
  res.send('GET Revenue Report');
};
