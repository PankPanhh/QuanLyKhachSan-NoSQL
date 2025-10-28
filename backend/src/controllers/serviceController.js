// @desc    Lay tat ca dich vu
// @route   GET /api/v1/services
// @access  Public
export const getAllServices = async (req, res, next) => {
  res.send('GET All Services');
};

// @desc    Tao dich vu moi
// @route   POST /api/v1/services
// @access  Private (Admin)
export const createService = async (req, res, next) => {
  res.send('CREATE Service');
};
