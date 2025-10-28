// @desc    Lay tat ca phong (co filter, search, pagination)
// @route   GET /api/v1/rooms
// @access  Public
export const getAllRooms = async (req, res, next) => {
  // TODO: Logic filter theo ngay, loai phong, so khach...
  res.send('GET All Rooms');
};

// @desc    Lay chi tiet 1 phong
// @route   GET /api/v1/rooms/:id
// @access  Public
export const getRoomById = async (req, res, next) => {
  // TODO: Logic lay phong theo ID
  res.send(`GET Room By ID: ${req.params.id}`);
};

// @desc    Tao phong moi
// @route   POST /api/v1/rooms
// @access  Private (Admin)
export const createRoom = async (req, res, next) => {
  // TODO: Logic tao phong moi
  res.send('CREATE Room');
};

// @desc    Cap nhat phong
// @route   PUT /api/v1/rooms/:id
// @access  Private (Admin)
export const updateRoom = async (req, res, next) => {
  // TODO: Logic cap nhat phong
  res.send(`UPDATE Room: ${req.params.id}`);
};

// @desc    Xoa phong
// @route   DELETE /api/v1/rooms/:id
// @access  Private (Admin)
export const deleteRoom = async (req, res, next) => {
  // TODO: Logic xoa phong
  res.send(`DELETE Room: ${req.params.id}`);
};
