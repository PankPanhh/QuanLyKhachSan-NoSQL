// Middleware xu ly loi tong quat
export const errorHandler = (err, req, res, next) => {
  // Doi khi loi co statusCode 200, ta nen doi sang 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    // Chi hien thi stack trace khi o moi truong development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
