import React, { useEffect, useState } from 'react';
import api from '../../services/api'; // Đã sửa
// import Modal from "react-bootstrap/Modal"; // Đã xóa
// import Button from "react-bootstrap/Button"; // Đã xóa
// import Form from "react-bootstrap/Form"; // Đã xóa
// import Row from "react-bootstrap/Row"; // Đã xóa
// import Col from "react-bootstrap/Col"; // Đã xóa
import { format } from "date-fns";

// Import component chung
import Spinner from "../../components/common/Spinner"; // Đã sửa
import Button from "../../components/common/Button"; // Đã sửa
import Modal from "../../components/common/Modal"; // Đã sửa

function PromotionsManager() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null); // Đã thay thế bằng state error/success mới
  // [.. Các state filter giữ nguyên ..]
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/promotions?status=all')
      .then((resp) => {
        const data = resp && resp.data ? resp.data : resp;
        if (!mounted) return;
        setPromos(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Không thể tải danh sách khuyến mãi');
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  function normalize(p) {
    const promo = p.promo || p;
    return {
      id: promo.MaKhuyenMai || promo.MaKM || promo._id || p.id || promo.id || promo.TenChuongTrinh,
      title: promo.TenChuongTrinh || promo.TenKM || promo.title || promo.name || '',
      type: promo.LoaiGiamGia || promo.type || (promo.GiaTriGiam && String(promo.GiaTriGiam).includes('%') ? 'percent' : 'amount') || '',
      value: promo.GiaTriGiam ?? promo.GiaTri ?? promo.value ?? null,
      start: promo.NgayBatDau ? new Date(promo.NgayBatDau) : null,
      end: promo.NgayKetThuc ? new Date(promo.NgayKetThuc) : null,
      condition: promo.DieuKien || promo.condition || promo.dieuKien || '',
      // show room codes (MaPhong) in the list so the table displays room codes
      rooms: (p.rooms || []).map(r => r.MaPhong || (r.room && r.room.MaPhong) || r.roomCode || r.roomId || r.roomId).filter(Boolean),
      raw: p,
    };
  }

  const normalized = promos.map(normalize);

  // [.. Các state form giữ nguyên ..]
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    MaKhuyenMai: "",
    TenChuongTrinh: "",
    LoaiGiamGia: "Phần trăm",
    GiaTriGiam: "",
    NgayBatDau: "",
    NgayKetThuc: "",
    LoaiPhongApDung: [],
    ApDungTatCaPhong: false,
    RoomIds: [],
    DieuKien: "",
    MoTa: "",
    TrangThai: "Hoạt động",
  });
  const [formErrors, setFormErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomsVisible, setRoomsVisible] = useState({});
  const roomTypes = Array.from(new Set((rooms || []).map(r => r.LoaiPhong).filter(Boolean)));
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [inlineForm, setInlineForm] = useState({});
  const [inlineErrors, setInlineErrors] = useState({});
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineConflicts, setInlineConflicts] = useState({});
  const [debugMessage, setDebugMessage] = useState('');
  // const [successMessage, setSuccessMessage] = useState(''); // Đã thay thế
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  // State Error/Success chuẩn
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  // const showAppError = (message) => { // Đã có setError
  //   setError(message);
  // };

  // Helper tạo mã KM (giữ nguyên)
  const generatePromoCode = () => {
    const prefix = "KM_AUTO";
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}${num}`;
  };

  // [.. Các handler logic (handleShowAddModal, validateForm, v.v...) giữ nguyên ..]
  const handleShowAddModal = () => {
    setForm(f => ({
      ...f,
      MaKhuyenMai: generatePromoCode(),
      TenChuongTrinh: "",
      LoaiGiamGia: "Phần trăm",
      GiaTriGiam: "",
      NgayBatDau: "",
      NgayKetThuc: "",
      LoaiPhongApDung: [],
      RoomIds: [],
      DieuKien: "",
      MoTa: "",
      TrangThai: "Hoạt động",
    }));
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => setShowAddModal(false);

  const validateForm = () => {
    const errors = {};
    if (!form.TenChuongTrinh || !form.TenChuongTrinh.trim()) errors.TenChuongTrinh = "Nhập tên chương trình";
    if (!form.GiaTriGiam || isNaN(form.GiaTriGiam) || Number(form.GiaTriGiam) <= 0) errors.GiaTriGiam = "Giá trị giảm phải > 0";
    if (!form.NgayBatDau) errors.NgayBatDau = "Chọn ngày bắt đầu";
    if (!form.NgayKetThuc) errors.NgayKetThuc = "Chọn ngày kết thúc";
    if (form.NgayBatDau && form.NgayKetThuc && form.NgayBatDau > form.NgayKetThuc) errors.NgayKetThuc = "Ngày kết thúc phải sau ngày bắt đầu";
    // require at least one room type OR the global "apply to all rooms" toggle OR specific room selections
    if (!form.ApDungTatCaPhong && (!form.LoaiPhongApDung || !form.LoaiPhongApDung.length) && (!form.RoomIds || !form.RoomIds.length)) {
      errors.LoaiPhongApDung = "Chọn ít nhất 1 loại phòng hoặc bật 'Áp dụng cho tất cả phòng' hoặc chọn phòng cụ thể";
    }
    return errors;
  };

  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'LoaiPhongApDung') {
      setForm(f => {
        const setTypes = new Set(f.LoaiPhongApDung || []);
        const prevRoomIds = new Set(f.RoomIds || []);
        const typeRooms = (rooms || []).filter(r => r.LoaiPhong === value).map(r => String(r._id));
        if (checked) {
          setTypes.add(value);
          // add all rooms for this type
          typeRooms.forEach(id => prevRoomIds.add(id));
        } else {
          setTypes.delete(value);
          // remove all rooms for this type
          typeRooms.forEach(id => prevRoomIds.delete(id));
        }
        return { ...f, LoaiPhongApDung: Array.from(setTypes), RoomIds: Array.from(prevRoomIds) };
      });
    } else if (name === 'ApDungTatCaPhong') {
      // toggle apply-all: when turned on, clear individual selections
      setForm(f => ({ ...f, ApDungTatCaPhong: checked, LoaiPhongApDung: checked ? [] : f.LoaiPhongApDung, RoomIds: checked ? [] : f.RoomIds }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const toggleRoomsForType = (type) => {
    setRoomsVisible(s => ({ ...s, [type]: !s[type] }));
  };

  const toggleRoomSelection = (roomId, checked) => {
    setForm(f => {
      const setIds = new Set(f.RoomIds || []);
      if (checked) setIds.add(roomId); else setIds.delete(roomId);
      return { ...f, RoomIds: Array.from(setIds) };
    });
  };

  useEffect(() => {
    let mounted = true;
    api.get('/rooms')
      .then((r) => {
        const data = r && r.data ? r.data : r;
        if (!mounted) return;
        setRooms(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Không tải được danh sách phòng', err);
      });
    return () => (mounted = false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (normalized.some(p => p.id === form.MaKhuyenMai)) errors.MaKhuyenMai = 'Mã khuyến mãi đã tồn tại';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      await api.post('/promotions', {
        MaKhuyenMai: form.MaKhuyenMai,
        TenChuongTrinh: form.TenChuongTrinh,
        LoaiGiamGia: form.LoaiGiamGia,
        GiaTriGiam: form.GiaTriGiam,
        NgayBatDau: form.NgayBatDau,
        NgayKetThuc: form.NgayKetThuc,
        // If applying to all rooms, send a special marker 'ALL' so backend can handle it
        LoaiPhongApDung: form.ApDungTatCaPhong ? ['ALL'] : form.LoaiPhongApDung,
        // include specific room ids when selected (backend will prefer RoomIds when provided)
        RoomIds: form.RoomIds && form.RoomIds.length ? form.RoomIds : undefined,
        DieuKien: form.DieuKien,
        MoTa: form.MoTa,
        TrangThai: form.TrangThai,
      });
      const resp = await api.get('/promotions?status=all');
      setPromos(Array.isArray(resp.data) ? resp.data : []);
      setError(null);
      setShowAddModal(false);
      showSuccessMessage("Thêm khuyến mãi thành công!"); // Thêm thông báo
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi khi thêm khuyến mãi mới');
    }
  };

  const handleEditShow = (p) => {
    // p is normalized promo entry
    const promo = p.raw && p.raw.promo ? p.raw.promo : p.raw || p.promo || p;
    setEditForm({
      id: p.id,
      MaKhuyenMai: promo.MaKhuyenMai || p.id,
      TenChuongTrinh: promo.TenChuongTrinh || '',
      LoaiGiamGia: promo.LoaiGiamGia || '',
  GiaTriGiam: (promo.GiaTriGiam ?? promo.GiaTri) || '',
      NgayBatDau: promo.NgayBatDau ? new Date(promo.NgayBatDau).toISOString().slice(0,10) : '',
      NgayKetThuc: promo.NgayKetThuc ? new Date(promo.NgayKetThuc).toISOString().slice(0,10) : '',
      DieuKien: promo.DieuKien || '',
      MoTa: promo.MoTa || '',
      TrangThai: promo.TrangThai || 'Hoạt động',
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  useEffect(() => {
    // no-op: placeholder to keep hooks order stable if needed in future
  }, []);

  const handleEditClose = () => setShowEditModal(false);

  const handleEditChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (name === 'LoaiPhongApDung') {
      setEditForm(f => {
        const setTypes = new Set(f.LoaiPhongApDung || []);
        const prevRoomIds = new Set(f.RoomIds || []);
        const typeRooms = (rooms || []).filter(r => r.LoaiPhong === value).map(r => String(r._id));
        if (checked) {
          setTypes.add(value);
          typeRooms.forEach(id => prevRoomIds.add(id));
        } else {
          setTypes.delete(value);
          typeRooms.forEach(id => prevRoomIds.delete(id));
        }
        return { ...f, LoaiPhongApDung: Array.from(setTypes), RoomIds: Array.from(prevRoomIds) };
      });
      return;
    }
    if (name === 'ApDungTatCaPhong' && type === 'checkbox') {
      setEditForm(f => ({ ...f, ApDungTatCaPhong: checked, LoaiPhongApDung: checked ? [] : f.LoaiPhongApDung, RoomIds: checked ? [] : f.RoomIds }));
      return;
    }
    // default
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const handleInlineChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'TrangThai' && type === 'checkbox') {
      // only TrangThai uses switch mapping
      // Use 'Ngưng hoạt động' label to match the services UI
      setInlineForm(f => ({ ...f, TrangThai: checked ? 'Hoạt động' : 'Ngưng hoạt động' }));
      return;
    }
    if (name === 'ApDungTatCaPhong' && type === 'checkbox') {
      setInlineForm(f => ({ ...f, ApDungTatCaPhong: checked, LoaiPhongApDung: checked ? [] : f.LoaiPhongApDung, RoomIds: checked ? [] : f.RoomIds }));
      return;
    }
    if (name === 'LoaiPhongApDung' && type === 'checkbox') {
      setInlineForm(f => {
        const setTypes = new Set(f.LoaiPhongApDung || []);
        const prevRoomIds = new Set(f.RoomIds || []);
        const typeRooms = (rooms || [])
          .filter(r => r.LoaiPhong === value)
          .map(r => String(r._id));
        if (checked) {
          setTypes.add(value);
          typeRooms.forEach(id => prevRoomIds.add(id));
        } else {
          setTypes.delete(value);
          typeRooms.forEach(id => prevRoomIds.delete(id));
        }
        return { ...f, LoaiPhongApDung: Array.from(setTypes), RoomIds: Array.from(prevRoomIds) };
      });
      return;
    }
    // default: normal text/select field
    setInlineForm(f => ({ ...f, [name]: value }));
  };

  const getPromoApiId = (p) => {
    const promo = p && p.raw && p.raw.promo ? p.raw.promo : (p && p.promo ? p.promo : p);
    // Prefer explicit MaKhuyenMai, then the group's id (which may be TenChuongTrinh normalized), then TenChuongTrinh
    return (promo && (promo.MaKhuyenMai)) || p.id || (promo && (promo.TenChuongTrinh || promo._id || promo.MaKM)) || null;
  };

  const togglePromoStatus = async (p) => {
    const id = getPromoApiId(p);
    if (!id) {
      setError('Không xác định được ID khuyến mãi');
      return;
    }
    const promo = p && p.raw && p.raw.promo ? p.raw.promo : (p && p.promo ? p.promo : p);
    const current = promo && promo.TrangThai ? promo.TrangThai : (() => {
      const now = new Date();
      if (p.end && p.end < now) return 'Hết hạn';
      if ((!p.start || p.start <= now) && (!p.end || p.end >= now)) return 'Hoạt động';
      return 'Sắp diễn ra';
    })();
    // Map to user-friendly label used across the app (match services style)
    const newStatus = current === 'Hoạt động' ? 'Ngưng hoạt động' : 'Hoạt động';
    setToggleLoadingId(id);
    try {
      await api.put(`/promotions/${encodeURIComponent(id)}`, { TrangThai: newStatus });
      const resp = await api.get('/promotions?status=all');
      const data = resp && resp.data ? resp.data : resp;
      setPromos(Array.isArray(data) ? data : []);
      setError(null);
      showSuccessMessage(`Đã cập nhật trạng thái: ${newStatus}`); // Thêm thông báo
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái khuyến mãi', err);
      setError(err.message || 'Lỗi khi thay đổi trạng thái khuyến mãi');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleQuickEditShow = async (p) => {
    // ... (Toàn bộ logic RẤT PHỨC TẠP này được giữ nguyên) ...
    const id = getPromoApiId(p) || p.id;
    const promo = p && p.raw && p.raw.promo ? p.raw.promo : (p && p.promo ? p.promo : p);
    console.log('🎯 DEBUG: Starting handleQuickEditShow');
    console.log('🎯 Promo object:', p);
    console.log('🎯 Extracted ID:', id);
    console.log('🎯 Extracted promo:', promo);
    console.log('🎯 Current rooms from promo:', p.rooms);
    
    setEditingRow(id);
    // prepare base inline form
    const baseForm = {
      MaKhuyenMai: promo.MaKhuyenMai || id,
      TenChuongTrinh: promo.TenChuongTrinh || '',
      LoaiGiamGia: promo.LoaiGiamGia || '',
      GiaTriGiam: (promo.GiaTriGiam ?? promo.GiaTri) || '',
      NgayBatDau: promo.NgayBatDau ? new Date(promo.NgayBatDau).toISOString().slice(0,10) : '',
      NgayKetThuc: promo.NgayKetThuc ? new Date(promo.NgayKetThuc).toISOString().slice(0,10) : '',
      DieuKien: promo.DieuKien || '',
      MoTa: promo.MoTa || '',
      TrangThai: promo.TrangThai || 'Hoạt động',
      // room application defaults
      ApDungTatCaPhong: false,
      LoaiPhongApDung: (p.rooms || []).map(r => r.LoaiPhong).filter(Boolean),
      RoomIds: [],
    };
    console.log('🎯 Initial baseForm:', baseForm);
    setInlineForm(baseForm);
    setInlineErrors({});

    // fetch full promo details (rooms with promoInstance info) so we can pre-select rooms
    try {
      console.log('🎯 Fetching promo details for ID:', id);
      const resp = await api.get(`/promotions/${encodeURIComponent(id)}?roomStatus=all`);
      const server = resp && resp.data ? resp.data.data : resp;
      console.log('🎯 Full API response:', resp);
      console.log('🎯 Extracted server data:', server);
      
      if (server && Array.isArray(server.rooms)) {
        console.log('🎯 Server rooms array:', server.rooms);
        const existingRoomIds = server.rooms.map(r => {
          const roomId = String(r.roomId || r._id || '');
          console.log('🎯 Processing room:', r, 'extracted ID:', roomId);
          return roomId;
        }).filter(Boolean);
        console.log('🎯 Final existing room IDs:', existingRoomIds);
        
        const roomTypes = server.rooms.map(r => r.LoaiPhong).filter(Boolean);
        console.log('🎯 Room types from server:', roomTypes);
        
        setInlineForm(f => { 
          const updated = {
            ...f, 
            RoomIds: Array.from(new Set([...(f.RoomIds||[]), ...existingRoomIds])),
            // also update LoaiPhongApDung to reflect the room types that have this promo
            LoaiPhongApDung: Array.from(new Set([...(f.LoaiPhongApDung||[]), ...roomTypes]))
          };
          console.log('🎯 Updated inlineForm with auto-selected rooms:', updated);
          return updated;
        });
      } else {
        console.log('🎯 No rooms found in server response or invalid structure');
      }

      // compute conflicts: rooms that already have OTHER promos that are active or overlap with this promo timeframe
      const conflicts = {};
      // current promo timeframe
      const curStart = baseForm.NgayBatDau ? new Date(baseForm.NgayBatDau) : null;
      const curEnd = baseForm.NgayKetThuc ? new Date(baseForm.NgayKetThuc) : null;
      console.log('🎯 Computing conflicts for timeframe:', curStart, 'to', curEnd);

      // for each room in global rooms list, fetch its full document and inspect KhuyenMai array
      console.log('🎯 Checking conflicts for', (rooms || []).length, 'rooms');
      await Promise.all((rooms || []).map(async (rm) => {
        try {
          const rr = await api.get(`/rooms/${encodeURIComponent(String(rm._id))}`);
          const roomData = rr && rr.data ? rr.data.data || rr.data : rr.data || rr;
          console.log(`🎯 Room ${rm.MaPhong || rm._id} data:`, roomData);
          
          if (!roomData || !Array.isArray(roomData.KhuyenMai)) {
            console.log(`🎯 Room ${rm.MaPhong || rm._id} has no KhuyenMai array`);
            return;
          }
          
          console.log(`🎯 Room ${rm.MaPhong || rm._id} has ${roomData.KhuyenMai.length} promos:`, roomData.KhuyenMai);
          
          for (const other of roomData.KhuyenMai) {
            // identify other promo entries: different MaKhuyenMai or TenChuongTrinh
            const otherId = other.MaKhuyenMai || (other.TenChuongTrinh ? String(other.TenChuongTrinh).toLowerCase() : null);
            const curId = baseForm.MaKhuyenMai || (baseForm.TenChuongTrinh ? String(baseForm.TenChuongTrinh).toLowerCase() : null);
            console.log(`🎯 Comparing other promo ID "${otherId}" with current ID "${curId}"`);
            
            if (!otherId) {
              console.log('🎯 Skipping promo with no ID');
              continue;
            }
            // skip same promo instance
            if (curId && (String(otherId) === String(curId) || (other.TenChuongTrinh && String(other.TenChuongTrinh).toLowerCase() === String(baseForm.TenChuongTrinh).toLowerCase()))) {
              console.log('🎯 Skipping same promo instance');
              continue;
            }

            // parse dates
            const oStart = other.NgayBatDau ? new Date(other.NgayBatDau) : null;
            const oEnd = other.NgayKetThuc ? new Date(other.NgayKetThuc) : null;

            // consider conflict if other is marked 'Hoạt động' OR if date ranges overlap with current promo
            const otherActive = other.TrangThai === 'Hoạt động';
            const overlap = (oStart && oEnd && curStart && curEnd) ? (oStart <= curEnd && oEnd >= curStart) : false;
            console.log(`🎯 Other promo "${other.TenChuongTrinh}" - Active: ${otherActive}, Overlap: ${overlap}`);
            
            if (otherActive || overlap) {
              const conflictMsg = `Trùng với chương trình khác (${other.TenChuongTrinh || other.MaKhuyenMai || 'khác'})`;
              conflicts[String(roomData._id)] = conflictMsg;
              console.log(`🎯 CONFLICT: Room ${rm.MaPhong || rm._id} - ${conflictMsg}`);
              break; // no need to check more promos for this room
            }
          }
        } catch (e) {
          // ignore per-room fetch errors but continue
          console.warn('🎯 Error checking room conflicts for', rm._id, e.message || e);
        }
      }));

      console.log('🎯 Final conflicts map:', conflicts);
      setInlineConflicts(conflicts);
    } catch (e) {
      console.error('🎯 ERROR in handleQuickEditShow:', e);
      console.warn('Không lấy được thông tin chi tiết khuyến mãi', e.message || e);
    }
  };

  const handleQuickEditCancel = () => {
    setEditingRow(null);
    setInlineForm({});
    setInlineErrors({});
  };

  const validateInline = () => {
    const errs = {};
    if (!inlineForm.TenChuongTrinh || !inlineForm.TenChuongTrinh.trim()) errs.TenChuongTrinh = 'Nhập tên chương trình';
    if (inlineForm.GiaTriGiam && (isNaN(inlineForm.GiaTriGiam) || Number(inlineForm.GiaTriGiam) <= 0)) errs.GiaTriGiam = 'Giá trị giảm phải > 0';
    if (inlineForm.NgayBatDau && inlineForm.NgayKetThuc && inlineForm.NgayBatDau > inlineForm.NgayKetThuc) errs.NgayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    return errs;
  };

  const handleQuickEditSave = async (p) => {
    // ... (Toàn bộ logic RẤT PHỨC TẠP này được giữ nguyên) ...
    console.log('🚀 DEBUG: Starting handleQuickEditSave');
    console.log('🚀 Promo object:', p);
    console.log('🚀 Current inlineForm:', inlineForm);
    console.log('🚀 Available rooms:', rooms);
    console.log('🚀 Inline conflicts:', inlineConflicts);
    
    const errs = validateInline();
    setInlineErrors(errs);
    if (Object.keys(errs).length) {
      console.log('🚀 Validation errors:', errs);
      return;
    }
  const id = getPromoApiId(p) || inlineForm.MaKhuyenMai || inlineForm.id;
    if (!id) {
      console.log('🚀 ERROR: No ID found for promo');
      setError('Không xác định được ID khuyến mãi');
      return;
    }
    console.log('🚀 Using promo ID:', id);
  setInlineSaving(true);
    // build payload explicitly and show debug output - WITH ROOM ASSIGNMENT
    // Convert RoomIds to room codes (MaPhong) for backend
    let selectedRoomCodes = [];
    if (inlineForm.ApDungTatCaPhong) {
      // If applying to all rooms, send all available room codes
      selectedRoomCodes = rooms.map(r => r.MaPhong).filter(Boolean);
      console.log('🚀 Applying to ALL rooms:', selectedRoomCodes.length, 'rooms');
    } else {
      // Otherwise, convert selected RoomIds to room codes
      selectedRoomCodes = (inlineForm.RoomIds || []).map(roomId => {
        const room = rooms.find(r => String(r._id) === String(roomId));
        return room ? room.MaPhong : roomId; // fallback to roomId if room not found
      }).filter(Boolean);
      console.log('🚀 Applying to selected rooms:', selectedRoomCodes.length, 'rooms');
    }
    
    const payload = {
      MaKhuyenMai: inlineForm.MaKhuyenMai,
      TenChuongTrinh: inlineForm.TenChuongTrinh,
      LoaiGiamGia: inlineForm.LoaiGiamGia,
      GiaTriGiam: inlineForm.GiaTriGiam !== undefined && inlineForm.GiaTriGiam !== '' ? Number(inlineForm.GiaTriGiam) : 0, // Default to 0 instead of undefined
      NgayBatDau: inlineForm.NgayBatDau || undefined,
      NgayKetThuc: inlineForm.NgayKetThuc || undefined,
      DieuKien: inlineForm.DieuKien,
      MoTa: inlineForm.MoTa,
      TrangThai: inlineForm.TrangThai,
      // Include room assignment - send array of room codes (MaPhong)
      rooms: selectedRoomCodes,
    };
    console.log('🚀 Built payload:', payload);
    const url = `/promotions/${encodeURIComponent(id)}`;
    console.log('🚀 Request URL:', url);
    setDebugMessage(`PUT ${url}\npayload: ${JSON.stringify(payload, null, 2)}`);
    try {
  const resp = await api.put(url, payload);
  console.log('🚀 PUT response:', resp);
  setDebugMessage(`Response: ${JSON.stringify(resp, null, 2)}`);
  
  // update local list from server response; still keep debug visible briefly
  console.log('🚀 Fetching updated promotions list...');
  const list = await api.get('/promotions?status=all');
  const data = list && list.data ? list.data : list;
  console.log('🚀 Refreshed promotions list:', data);
  console.log('🚀 Looking for promo with id:', id, 'or title:', inlineForm.TenChuongTrinh);
  
  setPromos(Array.isArray(data) ? data : []);
  
  // verify server persisted fields
  const promosArr = Array.isArray(data) ? data : [];
  const serverPromo = promosArr.find(x => {
    console.log('🚀 Comparing promo:', x.id, 'vs', id, '- title:', x.title, 'vs', inlineForm.TenChuongTrinh);
    return x.id === id || (x.title && inlineForm.TenChuongTrinh && x.title.toLowerCase() === inlineForm.TenChuongTrinh.toLowerCase());
  });
  
  console.log('🚀 Found server promo:', serverPromo);
  
  if (serverPromo && serverPromo.promo) {
    const sp = serverPromo.promo;
    console.log('🚀 Server promo data:', sp);
    console.log('🚀 Inline form data:', inlineForm);
    
    const formatDate = d => d ? new Date(d).toISOString().slice(0,10) : '';
    const mismatches = [];
    if ((sp.TenChuongTrinh || '') !== (inlineForm.TenChuongTrinh || '')) mismatches.push(`TenChuongTrinh: server='${sp.TenChuongTrinh||''}' sent='${inlineForm.TenChuongTrinh||''}'`);
    if ((sp.LoaiGiamGia || '') !== (inlineForm.LoaiGiamGia || '')) mismatches.push(`LoaiGiamGia: server='${sp.LoaiGiamGia||''}' sent='${inlineForm.LoaiGiamGia||''}'`);
    const serverGia = sp.GiaTriGiam != null ? Number(sp.GiaTriGiam) : sp.GiaTri != null ? Number(sp.GiaTri) : undefined;
    const sentGia = inlineForm.GiaTriGiam !== undefined && inlineForm.GiaTriGiam !== '' ? Number(inlineForm.GiaTriGiam) : undefined;
    if ((serverGia || '') !== (sentGia || '')) mismatches.push(`GiaTriGiam: server='${serverGia}' sent='${sentGia}'`);
    if (formatDate(sp.NgayBatDau) !== (inlineForm.NgayBatDau || '')) mismatches.push(`NgayBatDau: server='${formatDate(sp.NgayBatDau)}' sent='${inlineForm.NgayBatDau||''}'`);
    if (formatDate(sp.NgayKetThuc) !== (inlineForm.NgayKetThuc || '')) mismatches.push(`NgayKetThuc: server='${formatDate(sp.NgayKetThuc)}' sent='${inlineForm.NgayKetThuc||''}'`);
    if ((sp.DieuKien || '') !== (inlineForm.DieuKien || '')) mismatches.push(`DieuKien: server='${sp.DieuKien||''}' sent='${inlineForm.DieuKien||''}'`);
    if ((sp.MoTa || '') !== (inlineForm.MoTa || '')) mismatches.push(`MoTa: server='${sp.MoTa||''}' sent='${inlineForm.MoTa||''}'`);
    if ((sp.TrangThai || '') !== (inlineForm.TrangThai || '')) mismatches.push(`TrangThai: server='${sp.TrangThai||''}' sent='${inlineForm.TrangThai||''}'`);

    console.log('🚀 Mismatches found:', mismatches);

    if (mismatches.length) {
      setDebugMessage(`Saved but mismatch:\n${mismatches.join('\n')}`);
    } else {
      showSuccessMessage('Lưu thành công'); // Đã thay thế
      // setTimeout(() => setSuccessMessage(''), 2500); // Đã thay thế
      setTimeout(() => setDebugMessage(''), 2000);
    }
  } else {
    // no server promo found for id — show debug
    console.log('🚀 Available promo IDs:', promosArr.map(p => p.id));
    console.log('🚀 Available promo titles:', promosArr.map(p => p.title));
    setDebugMessage(`Saved but server promo not found for id=${id}. Response list length=${promosArr.length}`);
  }
      setEditingRow(null);
    } catch (err) {
      console.error('Lỗi khi lưu chỉnh sửa nhanh', err);
      setError(err.message || 'Lỗi khi lưu thay đổi');
      setDebugMessage(`Error: ${err.message || String(err)}`);
    } finally {
      setInlineSaving(false);
    }
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editForm.TenChuongTrinh || !editForm.TenChuongTrinh.trim()) errors.TenChuongTrinh = 'Nhập tên chương trình';
    if (editForm.GiaTriGiam && (isNaN(editForm.GiaTriGiam) || Number(editForm.GiaTriGiam) <= 0)) errors.GiaTriGiam = 'Giá trị giảm phải > 0';
    if (editForm.NgayBatDau && editForm.NgayKetThuc && editForm.NgayBatDau > editForm.NgayKetThuc) errors.NgayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    return errors;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = validateEditForm();
    setEditErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const idForApi = encodeURIComponent(editForm.MaKhuyenMai || editForm.id);
      await api.put(`/promotions/${idForApi}`, {
        TenChuongTrinh: editForm.TenChuongTrinh,
        LoaiGiamGia: editForm.LoaiGiamGia,
        GiaTriGiam: editForm.GiaTriGiam,
        NgayBatDau: editForm.NgayBatDau,
        NgayKetThuc: editForm.NgayKetThuc,
        DieuKien: editForm.DieuKien,
        MoTa: editForm.MoTa,
        TrangThai: editForm.TrangThai,
      });
      const resp = await api.get('/promotions?status=all');
      setPromos(Array.isArray(resp.data) ? resp.data : []);
      setShowEditModal(false);
      showSuccessMessage("Cập nhật thành công!"); // Thêm thông báo
    } catch (err) {
      console.error('Lỗi cập nhật', err);
      setEditErrors({ _global: err.message || 'Lỗi khi cập nhật khuyến mãi' });
    }
  };

  const filtered = normalized.filter((p) => {
    // ... (Logic filter giữ nguyên) ...
    // status
    const now = new Date();
    const isActive = (!p.start || p.start <= now) && (!p.end || p.end >= now);
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'expired' && p.end && p.end < now) return false;

    if (roomTypeFilter !== 'all' && !(p.rooms || []).includes(roomTypeFilter)) return false;

    if (discountTypeFilter === 'percent' && String(p.value).includes('%') === false && !p.type.toLowerCase().includes('phần')) return false;
    if (discountTypeFilter === 'amount' && (p.type && p.type.toLowerCase().includes('phần'))) return false;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      if (!((p.id || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q))) return false;
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!p.start || p.start < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!p.end || p.end > to) return false;
    }

    return true;
  });

  // Helper render trạng thái
  const getStatusColor = (status, p) => {
    const now = new Date();
    const promo = p && p.raw && p.raw.promo ? p.raw.promo : (p && p.promo ? p.promo : p);
    
    // Ưu tiên trạng thái từ DB (Hoạt động / Ngưng hoạt động)
    const dbStatus = promo?.TrangThai || status;

    if (dbStatus === 'Hoạt động') {
        // Nếu 'Hoạt động', kiểm tra xem có bị hết hạn không
        if (p?.end && p.end < now) return { bg: 'bg-label-secondary', text: 'Hết hạn' };
        // Kiểm tra xem có phải sắp diễn ra không
        if (p?.start && p.start > now) return { bg: 'bg-label-info', text: 'Sắp diễn ra' };
        // Nếu không, nó thực sự đang hoạt động
        return { bg: 'bg-label-success', text: 'Hoạt động' };
    }
    if (dbStatus === 'Ngưng hoạt động') {
        return { bg: 'bg-label-danger', text: 'Ngưng hoạt động' };
    }
    
    // Logic dự phòng nếu không có TrangThai
    if (p?.end && p.end < now) return { bg: 'bg-label-secondary', text: 'Hết hạn' };
    if ((!p?.start || p.start <= now) && (!p?.end || p.end >= now)) return { bg: 'bg-label-success', text: 'Hoạt động' };
    
    return { bg: 'bg-label-info', text: 'Sắp diễn ra' };
  };

  // Tính toán các thẻ thống kê
  const counts = {
    active: 0,
    expired: 0,
    upcoming: 0,
    disabled: 0,
  };
  const now = new Date();
  normalized.forEach(p => {
    const promo = p.raw?.promo || p.promo || p;
    const dbStatus = promo?.TrangThai;

    if (dbStatus === 'Ngưng hoạt động') {
      counts.disabled++;
    } else if (p.end && p.end < now) {
      counts.expired++;
    } else if (p.start && p.start > now) {
      counts.upcoming++;
    } else if ((!p.start || p.start <= now) && (!p.end || p.end >= now)) {
      counts.active++;
    }
  });


  return (
    <div className="container-fluid px-0"> {/* Bố cục gốc */}
      {/* Thông báo */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
      {debugMessage && (
        <div className="alert alert-info small" role="alert">
          <strong>Debug:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{debugMessage}</pre>
        </div>
      )}
      
      {/* Thẻ thống kê */}
      {!loading && (
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="bx bx-check-circle"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Hoạt động</span>
                <h3 className="card-title mb-2">{counts.active}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-time-five"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Sắp diễn ra</span>
                <h3 className="card-title mb-2">{counts.upcoming}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-secondary">
                      <i className="bx bx-calendar-exclamation"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Hết hạn</span>
                <h3 className="card-title mb-2">{counts.expired}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-danger">
                      <i className="bx bx-x-circle"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Ngưng hoạt động</span>
                <h3 className="card-title mb-2">{counts.disabled}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thẻ Bộ lọc */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Bộ lọc và Tìm kiếm</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6">
              <label className="form-label"><i className="bx bx-search me-1"></i>Tìm kiếm</label>
              <input className="form-control" placeholder="Tìm theo mã hoặc tên" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label"><i className="bx bx-toggle-right me-1"></i>Trạng thái</label>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="expired">Hết hạn</option>
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label"><i className="bx bx-bed me-1"></i>Loại phòng</label>
              <select className="form-select" value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}>
                <option value="all">Tất cả loại phòng</option>
                {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label"><i className="bx bx-purchase-tag-alt me-1"></i>Loại giảm</label>
              <select className="form-select" value={discountTypeFilter} onChange={e => setDiscountTypeFilter(e.target.value)}>
                <option value="all">Tất cả loại giảm</option>
                <option value="percent">Phần trăm</option>
                <option value="amount">Số tiền</option>
              </select>
            </div>
            <div className="col-lg-3 col-md-12">
              <label className="form-label"><i className="bx bx-calendar me-1"></i>Ngày diễn ra</label>
              <div className="d-flex gap-2">
                <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Từ ngày" />
                <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Đến ngày" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thẻ Bảng chính */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Quản lý Khuyến mãi</h5>
          <Button className="btn btn-primary" onClick={handleShowAddModal}>
            <i className="bx bx-plus me-1"></i> Thêm mới
          </Button>
        </div>

        {loading && (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
            <Spinner />
          </div>
        )}

        {!loading && (
          <div className="table-responsive text-nowrap">
            {/* Modals đã được chuyển ra ngoài */}
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên chương trình</th>
                  <th>Loại giảm</th>
                  <th>Giá trị</th>
                  <th>Thời gian</th>
                  <th>Phòng áp dụng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {filtered.map((p, idx) => (
                  <tr key={idx}>
                    <td><span className="fw-semibold">{p.id}</span></td>
                    <td>{p.title}</td>
                    <td>{p.type}</td>
                    <td>{(() => {
                      // ... (logic render giá trị giữ nguyên) ...
                      if (p.value === null || p.value === undefined || p.value === '') return '—';
                      const t = (p.type || '').toString().toLowerCase();
                      const isPercent = t.includes('phần') || t.includes('percent') || String(p.value).includes('%');
                      if (isPercent) {
                        // show with % suffix
                        const raw = String(p.value).replace('%', '');
                        return `${raw}%`;
                      }
                      // amount
                      const num = Number(p.value);
                      if (isNaN(num)) return p.value;
                      return num.toLocaleString('vi-VN') + 'đ';
                    })()}</td>
                    <td>{p.start ? p.start.toLocaleDateString('vi-VN') : '—'} – {p.end ? p.end.toLocaleDateString('vi-VN') : '—'}</td>
                    <td>{(p.rooms || []).join(', ')}</td>
                    {editingRow === (getPromoApiId(p) || p.id) ? (
                      <>
                        {/* PHẦN SỬA NHANH (INLINE) - Giao diện giữ nguyên, chỉ đổi Button */}
                        <td colSpan={2}>
                          <div className="d-flex flex-column gap-2">
                            {/* ... (Toàn bộ input của form inline giữ nguyên) ... */}
                            <div className="d-flex gap-2">
                              <input className="form-control form-control-sm" name="TenChuongTrinh" value={inlineForm.TenChuongTrinh || ''} onChange={handleInlineChange} placeholder="Tên chương trình" />
                              <input className="form-control form-control-sm" name="GiaTriGiam" type="number" value={inlineForm.GiaTriGiam || ''} onChange={handleInlineChange} placeholder="Giá trị" />
                            </div>
                            <div className="d-flex gap-2">
                              <input className="form-control form-control-sm" name="NgayBatDau" type="date" value={inlineForm.NgayBatDau || ''} onChange={handleInlineChange} />
                              <input className="form-control form-control-sm" name="NgayKetThuc" type="date" value={inlineForm.NgayKetThuc || ''} onChange={handleInlineChange} />
                            </div>
                            <div className="d-flex gap-2">
                              <select className="form-select form-select-sm" name="LoaiGiamGia" value={inlineForm.LoaiGiamGia || 'Phần trăm'} onChange={handleInlineChange}>
                                <option value="Phần trăm">Phần trăm</option>
                                <option value="Số tiền">Số tiền</option>
                              </select>
                              <input className="form-control form-control-sm" name="DieuKien" value={inlineForm.DieuKien || ''} onChange={handleInlineChange} placeholder="Điều kiện" />
                            </div>
                            <textarea className="form-control form-control-sm" name="MoTa" value={inlineForm.MoTa || ''} onChange={handleInlineChange} placeholder="Mô tả (Tuỳ chọn)"></textarea>
                            <div className="mt-2 border rounded p-2 bg-light">
                              {/* ... (Logic chọn phòng inline giữ nguyên) ... */}
                              <div className="d-flex align-items-center mb-2">
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" id={`inline-apdung-tatca-${p.id || idx}`} name="ApDungTatCaPhong" checked={!!inlineForm.ApDungTatCaPhong} onChange={handleInlineChange} />
                                  <label className="form-check-label ms-2" htmlFor={`inline-apdung-tatca-${p.id || idx}`}>Áp dụng cho tất cả phòng</label>
                                </div>
                              </div>
                              <div className="d-flex flex-wrap gap-2">
                                {(roomTypes || []).map((type) => (
                                  <div key={type} className="me-2">
                                    <div className="form-check">
                                      <input className="form-check-input" type="checkbox" id={`inline-loaiphong-${type}-${p.id || idx}`} name="LoaiPhongApDung" value={type} checked={(inlineForm.LoaiPhongApDung || []).includes(type)} onChange={handleInlineChange} disabled={inlineForm.ApDungTatCaPhong} />
                                      <label className="form-check-label ms-2" htmlFor={`inline-loaiphong-${type}-${p.id || idx}`}>{type}</label>
                                    </div>
                                    <button type="button" className="btn btn-link btn-sm" onClick={() => toggleRoomsForType(type)} disabled={inlineForm.ApDungTatCaPhong}>Chọn phòng</button>
                                    {roomsVisible[type] && (
                                      <div className="border rounded p-2 mt-2" style={{ maxHeight: 120, overflowY: 'auto', minWidth: 220 }}>
                                        {rooms.filter(rm => rm.LoaiPhong === type).length ? (
                                          rooms.filter(rm => rm.LoaiPhong === type).map(rm => {
                                            const disabled = !!inlineForm.ApDungTatCaPhong || !!inlineConflicts[String(rm._id)];
                                            return (
                                              <div key={rm._id} className="form-check">
                                                <input className="form-check-input" type="checkbox" id={`inline-room-${rm._id}-${p.id || idx}`} checked={(inlineForm.RoomIds || []).includes(String(rm._id))} onChange={e => setInlineForm(f => ({ ...f, RoomIds: e.target.checked ? Array.from(new Set([...(f.RoomIds||[]), String(rm._id)])) : (f.RoomIds||[]).filter(x => x !== String(rm._id)) }))} disabled={disabled} />
                                                <label className="form-check-label ms-2" htmlFor={`inline-room-${rm._id}-${p.id || idx}`}>{rm.TenPhong || rm.MaPhong || rm._id}</label>
                                                {inlineConflicts[String(rm._id)] && (
                                                  <div className="small text-danger mt-1">{inlineConflicts[String(rm._id)]}</div>
                                                )}
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="small text-muted">Không có phòng</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="d-flex align-items-center gap-2">
                              <div className="form-check form-switch m-0">
                                <input className="form-check-input" type="checkbox" id={`inline-toggle-${p.id || idx}`} name="TrangThai" checked={(inlineForm.TrangThai || 'Hoạt động') === 'Hoạt động'} onChange={handleInlineChange} />
                                <label className="form-check-label small ms-2" htmlFor={`inline-toggle-${p.id || idx}`}>{inlineForm.TrangThai || 'Hoạt động'}</label>
                              </div>
                              <div className="ms-auto">
                                {/* Thay thế Button */}
                                <Button size="sm" className="btn btn-success btn-sm" onClick={() => handleQuickEditSave(p)} disabled={inlineSaving}>Lưu</Button>
                                <Button size="sm" className="btn btn-secondary btn-sm ms-2" onClick={handleQuickEditCancel} disabled={inlineSaving}>Hủy</Button>
                              </div>
                            </div>
                            {inlineErrors.TenChuongTrinh && <div className="text-danger small">{inlineErrors.TenChuongTrinh}</div>}
                            {inlineErrors.GiaTriGiam && <div className="text-danger small">{inlineErrors.GiaTriGiam}</div>}
                            {inlineErrors.NgayKetThuc && <div className="text-danger small">{inlineErrors.NgayKetThuc}</div>}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {(() => {
                            // ... (Logic render trạng thái) ...
                            const statusInfo = getStatusColor(null, p);
                            return (
                              <span
                                className={`badge ${statusInfo.bg}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => togglePromoStatus(p)}
                              >
                                {toggleLoadingId === (getPromoApiId(p) || p.id) ? (
                                  <Spinner size="sm" />
                                ) : (
                                  statusInfo.text
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {/* Thay thế Button */}
                          <Button 
                            className="btn btn-icon btn-sm btn-outline-primary" 
                            onClick={() => handleQuickEditShow(p)}
                            title="Sửa nhanh"
                          >
                            <i className="bx bx-edit-alt"></i>
                          </Button>
                          {/* Nút Sửa (modal) - bị ẩn vì logic QuickEdit, nhưng vẫn giữ để không làm mất logic */}
                          {/* <Button 
                            className="btn btn-icon btn-sm btn-outline-secondary ms-1" 
                            onClick={() => handleEditShow(p)}
                            title="Sửa (Modal)"
                          >
                            <i className="bx bx-window-open"></i>
                          </Button> */}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODALS (Đã chuyển đổi sang Modal chung) --- */}

      {/* Modal Thêm mới */}
      <Modal 
        isOpen={showAddModal} 
        onClose={handleCloseAddModal}
        title="Thêm chương trình khuyến mãi mới"
        dialogClassName="modal-lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label text-muted small">Mã khuyến mãi</label>
              <input type="text" className="form-control" value={form.MaKhuyenMai} disabled />
            </div>

            <div className="col-md-8 col-12">
              <label className="form-label text-muted small">Tên chương trình</label>
              <input 
                name="TenChuongTrinh" 
                className={`form-control ${formErrors.TenChuongTrinh ? 'is-invalid' : ''}`}
                value={form.TenChuongTrinh} 
                onChange={handleFormChange} 
                placeholder="Nhập tên chương trình" 
              />
              {formErrors.TenChuongTrinh && <div className="invalid-feedback">{formErrors.TenChuongTrinh}</div>}
            </div>

            <div className="col-md-4 col-12">
              <label className="form-label text-muted small">Loại giảm giá</label>
              <select name="LoaiGiamGia" className="form-select" value={form.LoaiGiamGia} onChange={handleFormChange}>
                <option value="Phần trăm">Phần trăm</option>
                <option value="Số tiền">Số tiền</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label text-muted small">Giá trị giảm</label>
              <input 
                name="GiaTriGiam" 
                type="number" 
                className={`form-control ${formErrors.GiaTriGiam ? 'is-invalid' : ''}`}
                value={form.GiaTriGiam} 
                onChange={handleFormChange} 
                placeholder="Nhập số (ví dụ: 20 hoặc 100000)" 
              />
              {formErrors.GiaTriGiam && <div className="invalid-feedback">{formErrors.GiaTriGiam}</div>}
            </div>

            <div className="col-md-6 col-12">
              <label className="form-label text-muted small">Ngày bắt đầu</label>
              <input 
                name="NgayBatDau" 
                type="date" 
                className={`form-control ${formErrors.NgayBatDau ? 'is-invalid' : ''}`}
                value={form.NgayBatDau} 
                onChange={handleFormChange} 
              />
              {formErrors.NgayBatDau && <div className="invalid-feedback">{formErrors.NgayBatDau}</div>}
            </div>

            <div className="col-md-6 col-12">
              <label className="form-label text-muted small">Ngày kết thúc</label>
              <input 
                name="NgayKetThuc" 
                type="date" 
                className={`form-control ${formErrors.NgayKetThuc ? 'is-invalid' : ''}`}
                value={form.NgayKetThuc} 
                onChange={handleFormChange} 
              />
              {formErrors.NgayKetThuc && <div className="invalid-feedback">{formErrors.NgayKetThuc}</div>}
            </div>

            <div className="col-12">
              <label className="form-label text-muted small">Loại phòng áp dụng</label>
              <div className="mb-2">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="chk-apdung-tatca" name="ApDungTatCaPhong" checked={form.ApDungTatCaPhong} onChange={handleFormChange} />
                  <label className="form-check-label" htmlFor="chk-apdung-tatca">Áp dụng cho tất cả phòng</label>
                </div>
              </div>
              <div>
                <div className="d-flex flex-wrap gap-2">
                  {/* ... (Logic render chọn phòng giữ nguyên) ... */}
                  {roomTypes.length ? roomTypes.map((type) => (
                    <div key={type} className="me-2">
                      <div className="d-flex align-items-center">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id={`chk-${type}`} name="LoaiPhongApDung" value={type} checked={form.LoaiPhongApDung.includes(type)} onChange={handleFormChange} disabled={form.ApDungTatCaPhong} />
                          <label className="form-check-label" htmlFor={`chk-${type}`}>{type}</label>
                        </div>
                        <button type="button" className="btn btn-sm btn-link ms-2" onClick={() => toggleRoomsForType(type)} disabled={form.ApDungTatCaPhong}>
                          Chọn phòng
                        </button>
                      </div>
                      {roomsVisible[type] && (
                        <div className="border rounded p-2 mt-2" style={{ maxHeight: 160, overflowY: 'auto', minWidth: 220 }}>
                          {rooms.filter(r => r.LoaiPhong === type).length ? (
                            rooms.filter(r => r.LoaiPhong === type).map(rm => {
                              const hasConflict = form.NgayBatDau && form.NgayKetThuc && rm.KhuyenMai && rm.KhuyenMai.some(km => {
                                if (km.TrangThai !== 'Hoạt động') return false;
                                const start = new Date(km.NgayBatDau);
                                const end = new Date(km.NgayKetThuc);
                                const fstart = new Date(form.NgayBatDau);
                                const fend = new Date(form.NgayKetThuc);
                                return start <= fend && end >= fstart;
                              });
                              return (
                              <div key={rm._id} className="form-check">
                                <input className="form-check-input" type="checkbox" id={`room-${rm._id}`} checked={(form.RoomIds || []).includes(String(rm._id))} onChange={e => toggleRoomSelection(String(rm._id), e.target.checked)} disabled={form.ApDungTatCaPhong || hasConflict} />
                                <label className={`form-check-label ${hasConflict ? 'text-muted' : ''}`} htmlFor={`room-${rm._id}`}>
                                  {rm.TenPhong || rm.MaPhong || rm._id}
                                  {hasConflict && <small className="text-danger ms-1">(đã có KM)</small>}
                                </label>
                              </div>
                              );
                            })
                          ) : (
                            <div className="small text-muted">Không có phòng cho loại này</div>
                          )}
                        </div>
                      )}
                    </div>
                  )) : <div className="text-muted small">Không có loại phòng</div>}
                </div>
              </div>
              {formErrors.LoaiPhongApDung && <div className="text-danger small mt-1">{formErrors.LoaiPhongApDung}</div>}
            </div>

            <div className="col-12">
              <label className="form-label text-muted small">Điều kiện</label>
              <input name="DieuKien" className="form-control" value={form.DieuKien} onChange={handleFormChange} placeholder="Ví dụ: Áp dụng cho đơn từ 2 đêm trở lên" />
            </div>

            <div className="col-12">
              <label className="form-label text-muted small">Mô tả chi tiết</label>
              <textarea name="MoTa" rows={3} className="form-control" value={form.MoTa} onChange={handleFormChange} placeholder="Mô tả chi tiết chương trình..."></textarea>
            </div>

            <div className="col-12 mb-2">
              <label className="form-label text-muted small">Trạng thái</label>
              <input type="text" className="form-control" value={form.TrangThai} disabled />
            </div>
          </div>

          <div className="text-end mt-4 pt-3 border-top">
            <Button type="button" className="btn btn-outline-secondary me-2" onClick={handleCloseAddModal}>Đóng</Button>
            <Button type="submit" className="btn btn-primary">Lưu</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Sửa (Legacy - vẫn giữ logic) */}
      <Modal 
        isOpen={showEditModal} 
        onClose={handleEditClose}
        title="Sửa chương trình khuyến mãi"
        dialogClassName="modal-lg"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label text-muted small">Mã khuyến mãi</label>
              <input type="text" className="form-control" value={editForm.MaKhuyenMai || editForm.id || ''} disabled />
            </div>
            <div className="col-12">
              <label className="form-label text-muted small">Tên chương trình</label>
              <input 
                name="TenChuongTrinh" 
                className={`form-control ${editErrors.TenChuongTrinh ? 'is-invalid' : ''}`}
                value={editForm.TenChuongTrinh || ''} 
                onChange={handleEditChange} 
              />
              {editErrors.TenChuongTrinh && <div className="invalid-feedback">{editErrors.TenChuongTrinh}</div>}
            </div>
            <div className="col-md-6 col-12">
              <label className="form-label text-muted small">Giá trị giảm</label>
              <input 
                name="GiaTriGiam" 
                type="number" 
                className={`form-control ${editErrors.GiaTriGiam ? 'is-invalid' : ''}`}
                value={editForm.GiaTriGiam || ''} 
                onChange={handleEditChange} 
              />
              {editErrors.GiaTriGiam && <div className="invalid-feedback">{editErrors.GiaTriGiam}</div>}
            </div>
            <div className="col-md-6 col-12">
              <label className="form-label text-muted small">Loại giảm giá</label>
              <select name="LoaiGiamGia" className="form-select" value={editForm.LoaiGiamGia || ''} onChange={handleEditChange}>
                <option value="Phần trăm">Phần trăm</option>
                <option value="Số tiền">Số tiền</option>
              </select>
            </div>
            <div className="col-md-6 col-12">
              <label className="form-label text-muted small">Ngày bắt đầu</label>
              <input 
                name="NgayBatDau" 
                type="date" 
                className={`form-control ${editErrors.NgayBatDau ? 'is-invalid' : ''}`}
                value={editForm.NgayBatDau || ''} 
                onChange={handleEditChange} 
              />
              {editErrors.NgayBatDau && <div className="invalid-feedback">{editErrors.NgayBatDau}</div>}
            </div>
            <div className="col-md-6 col-12">
              <label className="form-label text-muted small">Ngày kết thúc</label>
              <input 
                name="NgayKetThuc" 
                type="date" 
                className={`form-control ${editErrors.NgayKetThuc ? 'is-invalid' : ''}`}
                value={editForm.NgayKetThuc || ''} 
                onChange={handleEditChange} 
              />
              {editErrors.NgayKetThuc && <div className="invalid-feedback">{editErrors.NgayKetThuc}</div>}
            </div>
            <div className="col-12">
              <label className="form-label text-muted small">Điều kiện</label>
              <input name="DieuKien" className="form-control" value={editForm.DieuKien || ''} onChange={handleEditChange} />
            </div>
            <div className="col-12">
              <label className="form-label text-muted small">Mô tả</label>
              <textarea name="MoTa" rows={3} className="form-control" value={editForm.MoTa || ''} onChange={handleEditChange}></textarea>
            </div>
            <div className="col-12 mb-2">
              <label className="form-label text-muted small">Trạng thái</label>
              <select name="TrangThai" className="form-select" value={editForm.TrangThai || 'Hoạt động'} onChange={handleEditChange}>
                <option>Hoạt động</option>
                <option>Ngưng hoạt động</option>
              </select>
            </div>
          </div>
          {editErrors._global && <div className="alert alert-danger mt-3">{editErrors._global}</div>}
          <div className="text-end mt-4 pt-3 border-top">
            <Button type="button" className="btn btn-outline-secondary me-2" onClick={handleEditClose}>Đóng</Button>
            <Button type="submit" className="btn btn-primary">Lưu</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default PromotionsManager;