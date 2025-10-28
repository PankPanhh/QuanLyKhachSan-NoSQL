// src/components/rooms/RoomCard.jsx
import React from 'react';

// Nhận props là một object 'room'
function RoomCard({ room }) {
  const { imageUrl, title, description, details, price, slug } = room;

  return (
    <>
      <div className="room-item position-relative bg-black rounded-4 overflow-hidden">
        <img src={imageUrl} alt={title} className="post-image img-fluid rounded-4" />
        <div className="product-description position-absolute p-5 text-start">
          <h4 className="display-6 fw-normal text-white">{title}</h4>
          <p className="product-paragraph text-white">{description}</p>
          <table>
            <tbody>
              {/* Ví dụ render chi tiết từ props */}
              <tr className="text-white">
                <td className="pe-2">Size:</td>
                <td>{details.size}</td>
              </tr>
              <tr className="text-white">
                <td className="pe-2">Capacity:</td>
                <td>{details.capacity}</td>
              </tr>
              <tr className="text-white">
                <td className="pe-2">Bed:</td>
                <td>{details.bed}</td>
              </tr>
              <tr className="text-white">
                <td className="pe-2">Services:</td>
                <td>{details.services}</td>
              </tr>
            </tbody>
          </table>
          <a href={`/rooms/${slug}`}> {/* Hoặc dùng <Link> */}
            <p className="text-decoration-underline text-white m-0 mt-2">Browse Now</p>
          </a>
        </div>
      </div>
      <div className="room-content text-center mt-3">
        <h4 className="display-6 fw-normal"><a href={`/rooms/${slug}`}>{title}</a></h4>
        <p><span className="text-primary fs-4">${price}</span>/night</p>
      </div>
    </>
  );
}

export default RoomCard;