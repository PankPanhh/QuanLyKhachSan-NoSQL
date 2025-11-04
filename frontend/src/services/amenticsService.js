const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAmenities = async () => {
  const res = await fetch(`${apiBase}/api/v1/amenities`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
};

export const createAmenity = async ({ TenTienNghi, TrangThai, roomIds = [], assignToAll = false }) => {
  const res = await fetch(`${apiBase}/api/v1/amenities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ TenTienNghi, TrangThai, roomIds, assignToAll }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
};

export const updateAmenity = async (code, payload) => {
  const res = await fetch(`${apiBase}/api/v1/amenities/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
};

export const deleteAmenity = async (code, { cascade = false } = {}) => {
  const url = `${apiBase}/api/v1/amenities/${encodeURIComponent(code)}${cascade ? '?cascade=true' : ''}`;
  const res = await fetch(url, { method: 'DELETE', headers: { ...authHeader() } });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
};

export const assignAmenityToRoom = async (code, roomId, payload = {}) => {
  const res = await fetch(`${apiBase}/api/v1/amenities/${encodeURIComponent(code)}/assign/${encodeURIComponent(roomId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
};

export const removeAmenityFromRoom = async (code, roomId) => {
  const res = await fetch(`${apiBase}/api/v1/amenities/${encodeURIComponent(code)}/assign/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
};

export const getRooms = async () => {
  const res = await fetch(`${apiBase}/api/v1/rooms`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return body && (body.data !== undefined ? body.data : body) ;
};

export default {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  assignAmenityToRoom,
  removeAmenityFromRoom,
  getRooms,
};
