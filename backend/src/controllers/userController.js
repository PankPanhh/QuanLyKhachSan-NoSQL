// @desc    Lay tat ca user (Chi Admin)
// @route   GET /api/v1/users
// @access  Private (Admin)
export const getAllUsers = async (req, res, next) => {
  // TODO: Logic lay tat ca user (phan trang)
  res.send('GET All Users');
};

// @desc    Lay user theo ID
// @route   GET /api/v1/users/:id
// @access  Private (Admin hoac chinh user do)
export const getUserById = async (req, res, next) => {
  // TODO: Logic lay user theo ID
  res.send(`GET User By ID: ${req.params.id}`);
};

// @desc    Cap nhat user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin hoac chinh user do)
export const updateUser = async (req, res, next) => {
  // TODO: Logic cap nhat user
  res.send(`UPDATE User: ${req.params.id}`);
};

// @desc    Xoa user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res, next) => {
  // TODO: Logic xoa user
  res.send(`DELETE User: ${req.params.id}`);
};
