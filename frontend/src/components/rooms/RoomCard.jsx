// Đây là code đã refactor từ file MainPage.jsx gốc của bạn
import React from 'react';
import { Link } from 'react-router-dom'; // Dùng Link
import { formatCurrency } from '../../utils/formatCurrency';

function RoomCard({ room }) {
  // Destructure (bóc tách) dữ liệu từ prop
  const { slug, imageUrl, title, description, details, price } = room;

  return (
    <>
      <div className="room-item position-relative bg-black rounded-4 overflow-hidden">
        <img src={imageUrl} alt={title} className="post-image img-fluid rounded-4" />
        <div className="product-description position-absolute p-5 text-start">
          <h4 className="display-6 fw-normal text-white">{title}</h4>
          <p className="product-paragraph text-white">{description.substring(0, 100)}...</p>
          <table>
            <tbody>
              <tr className="text-white">
                <td className="pe-2">Sức chứa:</td>
                <td>{details.capacity}</td>
              </tr>
              <tr className="text-white">
                <td className="pe-2">Giường:</td>
                <td>{details.bed}</td>
              </tr>
              <tr className="text-white">
                <td className="pe-2">Dịch vụ:</td>
                <td>{details.services.substring(0, 30)}...</td>
              </tr>
            </tbody>
          </table>
          {/* Dùng Link để điều hướng */}
          <Link to={`/rooms/${slug}`}>
            <p className="text-decoration-underline text-white m-0 mt-2">Xem chi tiết</p>
          </Link>
        </div>
      </div>
      <div className="room-content text-center mt-3">
        <h4 className="display-6 fw-normal">
            <Link to={`/rooms/${slug}`}>{title}</Link>
        </h4>
        <p><span className="text-primary fs-4">{formatCurrency(price)}</span>/đêm</p>
      </div>
    </>
  );
}

export default RoomCard;
