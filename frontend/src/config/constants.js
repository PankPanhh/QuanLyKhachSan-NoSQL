// src/config/constants.js
export const API_BASE_URL = 'http://localhost:5000/api/v1';
export const ASSETS_BASE_URL = 'http://localhost:5000/assets';
export const ROOM_IMAGES_URL = `${ASSETS_BASE_URL}/images/room`;

// Helper function để tạo URL hình ảnh phòng
export const getRoomImageUrl = (imageName) => {
  if (!imageName) return `${ROOM_IMAGES_URL}/default-room.jpg`;
  return `${ROOM_IMAGES_URL}/${imageName}`;
};