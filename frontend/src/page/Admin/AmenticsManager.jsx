import React, { useEffect, useState, useRef } from "react";
import {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  getRooms,
  assignAmenityToRoom,
  removeAmenityFromRoom,
} from "../../services/amenticsService"; // Đã sửa đường dẫn
import Spinner from "../../components/common/Spinner"; // Đã sửa đường dẫn
import Button from "../../components/common/Button"; // Đã sửa đường dẫn
import Modal from "../../components/common/Modal"; // Sử dụng Modal chung // Đã sửa đường dẫn

const AmenticsManager = () => {
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    item: null,
  });
  // UI: filtering, sorting, pagination
  const [amenityFilter, setAmenityFilter] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [roomForModal, setRoomForModal] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [toAssignCodes, setToAssignCodes] = useState([]);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const [showNewAmenityModal, setShowNewAmenityModal] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState("");
  const newAmenityInputRef = useRef(null);
  const editAmenityInputRef = useRef(null);
  const [showRoomsListModal, setShowRoomsListModal] = useState(false);
  const [roomsListForAmenity, setRoomsListForAmenity] = useState([]);
  const [roomsListAmenityName, setRoomsListAmenityName] = useState("");

  // State cho thông báo cấp cao nhất
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Hàm hiển thị thông báo
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showAppError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const openRoomsList = (code, name) => {
    const list = Array.isArray(rooms)
      ? rooms.filter((r) =>
          (r.TienNghi || []).some((t) => t.MaTienNghi === code)
        )
      : [];
    setRoomsListForAmenity(list);
    setRoomsListAmenityName(name || code);
    setShowRoomsListModal(true);
  };
  const closeRoomsListModal = () => {
    setRoomsListForAmenity([]);
    setRoomsListAmenityName("");
    setShowRoomsListModal(false);
  };

  const load = async () => {
    setLoading(true);
    setError(null); // Reset lỗi
    try {
      const a = await getAmenities();
      setItems(a || []);
      const r = await getRooms();
      setRooms(r || []);
    } catch (e) {
      console.error(e);
      showAppError("Lấy danh sách tiện nghi thất bại: " + e.message); // Sử dụng state error
    } finally {
      setLoading(false);
    }
  };

  // statuses that indicate a room is currently occupied/being used
  const IN_USE_STATUSES = new Set(["Đang sử dụng", "Đã đặt"]);

  const isRoomInUse = (r) => {
    if (!r) return false;
    const s = String(r.TinhTrang || "").trim();
    return IN_USE_STATUSES.has(s);
  };

  useEffect(() => {
    load();
  }, []);

  // Thay thế getStatusEmoji
  const getStatusColor = (status) => {
    const statusColors = {
      // For amenities
      "Hoạt động": { bg: "bg-label-success", text: "Hoạt động" },
      "Bảo trì": { bg: "bg-label-warning", text: "Bảo trì" },
      "Ngưng sử dụng": { bg: "bg-label-danger", text: "Ngưng sử dụng" },
      "Chưa gán": { bg: "bg-label-secondary", text: "Chưa gán" },
      // For rooms
      "Trống": { bg: "bg-label-success", text: "Trống" },
      "Đang sử dụng": { bg: "bg-label-info", text: "Có khách" },
      "Đang dọn dẹp": { bg: "bg-label-warning", text: "Đang dọn" },
      "Đã đặt": { bg: "bg-label-primary", text: "Đã đặt" },
      "Hư": { bg: "bg-label-danger", text: "Hư" },
    };
    return statusColors[status] || { bg: "bg-label-secondary", text: status };
  };

  const openManageRoom = (r) => {
    setRoomForModal(r);
    setToAssignCodes([]);
    setShowManageModal(true);
  };
  const closeManageRoom = () => {
    setRoomForModal(null);
    setToAssignCodes([]);
    setShowManageModal(false);
  };

  const openAddSelector = () => {
    // prefill selected codes with those already on the room
    const existing =
      roomForModal && roomForModal.TienNghi
        ? roomForModal.TienNghi.map((t) => t.MaTienNghi)
        : [];
    setToAssignCodes(existing.slice());
    setShowAddSelector(true);
  };
  const closeAddSelector = () => {
    setToAssignCodes([]);
    setShowAddSelector(false);
  };

  // Helper cho modal 4
  const toggleSelectToAssign = (code) => {
    setToAssignCodes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  const addSelectedToRoom = async () => {
    if (!roomForModal) return showAppError("Không có phòng được chọn");

    const beforeCodes =
      roomForModal?.TienNghi?.map((t) => t.MaTienNghi) || [];
    const afterCodes = toAssignCodes || [];

    const toAdd = afterCodes.filter((code) => !beforeCodes.includes(code));
    const toRemove = beforeCodes.filter((code) => !afterCodes.includes(code));

    if (toAdd.length === 0 && toRemove.length === 0) {
      showAppError("Không có thay đổi nào.");
      closeAddSelector();
      return;
    }

    try {
      if (toAdd.length > 0) {
        await Promise.all(
          toAdd.map((code) => assignAmenityToRoom(code, roomForModal._id))
        );
      }
      if (toRemove.length > 0) {
        await Promise.all(
          toRemove.map((code) => removeAmenityFromRoom(code, roomForModal._id))
        );
      }

      await load(); // Tải lại cả hai danh sách
      const freshRooms = await getRooms();
      const updatedRoom = (freshRooms || []).find(
        (r) => r._id === roomForModal._id
      );
      if (updatedRoom) {
        setRoomForModal(updatedRoom);
      }

      closeAddSelector(); // Đóng modal chọn
      showSuccessMessage(
        `Đã cập nhật tiện nghi cho phòng ${roomForModal.MaPhong}`
      );
    } catch (e) {
      console.error(e);
      showAppError("Cập nhật tiện nghi thất bại: " + (e.message || e));
    }
  };

  const openEdit = (it) =>
    setModal({ open: true, mode: "edit", item: { ...it } });
  const close = () => setModal({ open: false, mode: "create", item: null });

  const handleSave = async (e) => {
    e.preventDefault(); // Thêm vào
    try {
      // create mode (từ modal 1)
      if (modal.mode === "create" && showNewAmenityModal) {
          const val = newAmenityInputRef.current
            ? String(newAmenityInputRef.current.value || "")
            : newAmenityName || "";
          if (!val || !val.trim()) return showAppError("Nhập tên tiện nghi");
          if (!rooms || !rooms.length)
            return showAppError(
              "Không có phòng để chèn tiện nghi. Tạo phòng trước."
            );
          const firstRoomId = rooms[0]._id;
          await createAmenity({
            TenTienNghi: val.trim(),
            TrangThai: "Chưa gán",
            roomIds: [firstRoomId],
          });
          await load();
          showSuccessMessage(
            `Đã thêm tiện nghi '${val.trim()}' vào danh sách chung.`
          );
          if (newAmenityInputRef.current) newAmenityInputRef.current.value = "";
          closeNewAmenity();
          return;
      }

      // edit mode (từ modal 2)
      if (modal.mode === "edit" && modal.open) {
          const code = modal.item.MaTienNghi;
          const newName =
            editAmenityInputRef.current
              ? String(editAmenityInputRef.current.value || "")
              : modal.item.TenTienNghi;
          const newStatus = modal.item.TrangThai;
          
          const roomsBefore = Array.isArray(rooms) ? rooms.slice() : [];
          const roomsWithBefore = roomsBefore.filter((r) =>
            (r.TienNghi || []).some((t) => t.MaTienNghi === code)
          );
          const roomsAlreadyMatchingBefore = roomsWithBefore.filter((r) => {
            const tn = (r.TienNghi || []).find((t) => t.MaTienNghi === code);
            if (!tn) return false;
            return (
              String(tn.TenTienNghi || "").trim() ===
                String(newName || "").trim() &&
              String((tn.TrangThai || "").trim()) ===
                String((newStatus || "").trim())
            );
          }).length;
    
          await updateAmenity(code, { TenTienNghi: newName, TrangThai: newStatus });
          await load();
          let freshRooms = [];
          try {
            freshRooms = (await getRooms()) || [];
          } catch (err) {
            freshRooms = rooms;
          }
          const freshRoomsWith = freshRooms.filter((r) =>
            (r.TienNghi || []).some((t) => t.MaTienNghi === code)
          );
          const freshMatching = freshRoomsWith.filter((r) => {
            const tn = (r.TienNghi || []).find((t) => t.MaTienNghi === code);
            if (!tn) return false;
            return (
              String(tn.TenTienNghi || "").trim() ===
                String(newName || "").trim() &&
              String((tn.TrangThai || "").trim()) ===
                String((newStatus || "").trim())
            );
          }).length;
    
          if (String(newStatus || "").trim() === "Ngưng sử dụng") {
            try {
              const roomsWith = freshRoomsWith || [];
              if (!rooms || !rooms.length) {
                showAppError("Không có phòng trong hệ thống để xử lý.");
                close();
                return;
              }
              const firstRoomId = rooms[0]._id;
              const toRemove = roomsWith
                .map((r) => r._id)
                .filter((id) => id !== firstRoomId);
              if (roomsWith.length === 0) {
                await assignAmenityToRoom(code, firstRoomId, {});
                await load();
                showSuccessMessage(
                  `Đã cập nhật tiện nghi ‘${newName}’ và giữ trong danh sách chung.`
                );
                close();
                return;
              }
              if (toRemove.length > 0) {
                await Promise.all(
                  toRemove.map((rid) => removeAmenityFromRoom(code, rid))
                );
              }
              const sentinelHas = (roomsWith || []).some(
                (r) => r._id === firstRoomId
              );
              if (!sentinelHas) {
                await assignAmenityToRoom(code, firstRoomId, {});
              }
              await load();
              const removedCount = toRemove.length;
              showSuccessMessage(
                `Đã cập nhật tiện nghi ‘${newName}’ và đã gỡ khỏi ${removedCount} phòng (giữ trong danh sách chung).`
              );
              close();
              return;
            } catch (err) {
              console.error(err);
              showAppError("Lỗi khi gỡ tiện nghi khỏi phòng. Vui lòng thử lại.");
              close();
              return;
            }
          }
    
          if (roomsWithBefore.length === 0) {
            showAppError("Không có thông tin nào được chỉnh sửa.");
          } else if (roomsAlreadyMatchingBefore === roomsWithBefore.length) {
            showAppError("Không có thông tin nào được chỉnh sửa.");
          } else if (freshMatching > 0) {
            showSuccessMessage(`Đã cập nhật tiện nghi ‘${newName}’ thành công.`);
          } else {
            showSuccessMessage("Đã cập nhật tiện nghi.");
          }
          close();
      }
    } catch (e) {
      console.error(e);
      showAppError("Lỗi hệ thống — vui lòng thử lại.");
    }
  };

  const openNewAmenity = () => {
    setNewAmenityName("");
    setShowNewAmenityModal(true);
  };
  const closeNewAmenity = () => {
    setNewAmenityName("");
    setShowNewAmenityModal(false);
  };

  useEffect(() => {
    if (showNewAmenityModal) {
      const t = setTimeout(() => {
        try {
          const input = newAmenityInputRef.current;
          if (input) {
            input.value = newAmenityName || "";
            input.focus();
          }
        } catch (e) {
          /* ignore */
        }
      }, 30);
      return () => clearTimeout(t);
    }
  }, [showNewAmenityModal]);

  useEffect(() => {
    if (modal.open && modal.mode === "edit") {
      const t = setTimeout(() => {
        try {
          const input = editAmenityInputRef.current;
          if (input) {
            input.value = modal.item?.TenTienNghi || "";
            input.focus();
            const len = String(input.value || "").length;
            input.setSelectionRange && input.setSelectionRange(len, len);
          }
        } catch (e) {
          /* ignore */
        }
      }, 30);
      return () => clearTimeout(t);
    }
    if (!modal.open && editAmenityInputRef.current) {
      try {
        editAmenityInputRef.current.value = "";
      } catch (e) {}
    }
  }, [modal.open, modal.mode, modal.item]);

  // Đổi tên: handleAddNewAmenity -> handleSaveNewAmenity (để khớp với modal)
  const handleSaveNewAmenity = async (e) => {
    e.preventDefault();
    await handleSave(); // Gọi hàm save chung
  };

  const handleDelete = async (code) => {
    try {
      const fresh = await getRooms();
      const roomsWith = (fresh || []).filter((r) =>
        (r.TienNghi || []).some((t) => t.MaTienNghi === code)
      );
      const blocking = roomsWith.filter(isRoomInUse);
      if (blocking.length) {
        showAppError(
          `Không thể xóa: tiện nghi đang được gán cho phòng đang sử dụng (${blocking
            .map((b) => b.MaPhong || b._id)
            .join(", ")})`
        );
        return;
      }
    } catch (e) {
      const roomsWith = (rooms || []).filter((r) =>
        (r.TienNghi || []).some((t) => t.MaTienNghi === code)
      );
      const blocking = roomsWith.filter(isRoomInUse);
      if (blocking.length) {
        showAppError(
          `Không thể xóa: tiện nghi đang được gán cho phòng đang sử dụng (${blocking
            .map((b) => b.MaPhong || b._id)
            .join(", ")})`
        );
        return;
      }
    }

    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa tiện nghi ${code}? Hành động này sẽ gỡ tiện nghi khỏi tất cả các phòng.`
      )
    ) {
      try {
        await deleteAmenity(code);
        await load();
        showSuccessMessage("Xóa thành công");
      } catch (e) {
        console.error(e);
        showAppError("Xóa thất bại: " + (e.message || e));
      }
    }
  };

  const handleUnassign = async (code, roomId) => {
    try {
      const fresh = await getRooms();
      const target =
        (fresh || []).find((r) => r._id === roomId) ||
        (rooms || []).find((r) => r._id === roomId);
      if (isRoomInUse(target)) {
        showAppError("Không thể gỡ tiện nghi khi phòng đang được sử dụng.");
        return;
      }
    } catch (e) {
      const target = (rooms || []).find((r) => r._id === roomId);
      if (isRoomInUse(target)) {
        showAppError("Không thể gỡ tiện nghi khi phòng đang được sử dụng.");
        return;
      }
    }

    if (window.confirm("Bạn có chắc chắn muốn gỡ tiện nghi này khỏi phòng?")) {
      try {
        await removeAmenityFromRoom(code, roomId);
        await load();
        try {
          const fresh = await getRooms();
          const updated = (fresh || []).find((r) => r._id === roomId);
          if (updated) setRoomForModal(updated);
          else
            setRoomForModal((prev) => ({
              ...(prev || {}),
              TienNghi: (prev?.TienNghi || []).filter(
                (t) => t.MaTienNghi !== code
              ),
            }));
        } catch (er) {
          setRoomForModal((prev) => ({
            ...(prev || {}),
            TienNghi: (prev?.TienNghi || []).filter(
              (t) => t.MaTienNghi !== code
            ),
          }));
        }
        showSuccessMessage("Đã gỡ");
      } catch (e) {
        console.error(e);
        showAppError("Gỡ thất bại: " + (e.message || e));
      }
    }
  };

  // Tính toán stats
  const stats = {
    total: items.length,
    active: items.filter(it => it.TrangThai === 'Hoạt động').length,
    maintenance: items.filter(it => it.TrangThai === 'Bảo trì').length,
    unassigned: items.filter(it => it.TrangThai === 'Chưa gán').length,
  };


  // --- JSX BẮT ĐẦU ---
  return (
    <div className="container-fluid px-0">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          <i className="bx bx-check-circle me-2"></i>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bx bx-error-circle me-2"></i>
          {error}
        </div>
      )}

      {/* Thẻ thống kê (Mới) */}
      {!loading && (
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-list-ul"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Tổng tiện nghi</span>
                <h3 className="card-title mb-2">{stats.total}</h3>
              </div>
            </div>
          </div>
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
                <h3 className="card-title mb-2">{stats.active}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-warning">
                      <i className="bx bx-wrench"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Bảo trì</span>
                <h3 className="card-title mb-2">{stats.maintenance}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                    <span className="avatar-initial rounded bg-label-secondary">
                      <i className="bx bx-help-circle"></i>
                    </span>
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Chưa gán</span>
                <h3 className="card-title mb-2">{stats.unassigned}</h3>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Card 1: Quản lý Tiện nghi (Global List) */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Danh sách tiện nghi chung</h5>
          <Button
            className="btn btn-primary"
            onClick={openNewAmenity}
            disabled={loading}
          >
            <i className="bx bx-plus me-1"></i> Thêm tiện nghi mới
          </Button>
        </div>

        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "200px" }}
          >
            <Spinner />
          </div>
        ) : (
          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên tiện nghi</th>
                  <th>Trạng thái</th>
                  <th>Số phòng đang có</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {items.map((it) => {
                  const statusInfo = getStatusColor(it.TrangThai);
                  return (
                    <tr key={it.MaTienNghi}>
                      <td>
                        <span className="fw-semibold">{it.MaTienNghi}</span>
                      </td>
                      <td>{it.TenTienNghi}</td>
                      <td>
                        <span className={`badge ${statusInfo.bg}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td>
                        <span className="me-2">{it.countRooms ?? 0}</span>
                        <Button
                          className="btn btn-icon btn-sm btn-outline-success"
                          onClick={() =>
                            openRoomsList(it.MaTienNghi, it.TenTienNghi)
                          }
                          title="Xem danh sách phòng"
                        >
                          <i className="bx bx-show"></i>
                        </Button>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            title="Sửa"
                            className="btn btn-icon btn-sm btn-outline-primary"
                            onClick={() => openEdit(it)}
                          >
                            <i className="bx bx-edit-alt"></i>
                          </Button>
                          <Button
                            title="Xóa"
                            className="btn btn-icon btn-sm btn-outline-danger"
                            onClick={() => handleDelete(it.MaTienNghi)}
                          >
                            <i className="bx bx-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 2: Danh sách phòng (Quản lý gán/gỡ) */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Quản lý Tiện nghi cho Phòng</h5>
        </div>
        <div className="card-body">
          <p className="text-muted">
            Hiển thị toàn bộ phòng và số tiện nghi. Chọn "Quản lý" để thêm/gỡ
            tiện nghi cho phòng đó.
          </p>

          {/* Filters for Room List */}
          <div className="row g-3 mb-3 align-items-end">
            <div className="col-lg-4 col-md-6">
              <label className="form-label">
                <i className="bx bx-filter-alt me-1"></i>Lọc phòng theo tiện
                nghi
              </label>
              <select
                className="form-select"
                value={amenityFilter}
                onChange={(e) => {
                  setAmenityFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">-- Tất cả --</option>
                {items.map((it) => (
                  <option key={it.MaTienNghi} value={it.MaTienNghi}>
                    {it.TenTienNghi}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label">
                <i className="bx bx-list-ul me-1"></i>Số hàng / trang
              </label>
              <select
                className="form-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room List Table */}
          {loading ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "200px" }}
            >
              <Spinner />
            </div>
          ) : (
            <>
              {(() => {
                // ... (Logic lọc, sắp xếp, phân trang giữ nguyên) ...
                // filtering
                let processed = Array.isArray(rooms) ? rooms.slice() : [];
                if (amenityFilter) {
                  processed = processed.filter((r) =>
                    (r.TienNghi || []).some(
                      (t) => t.MaTienNghi === amenityFilter
                    )
                  );
                }
                // sorting
                const cmp = (a, b, key) => {
                  let va = a[key];
                  let vb = b[key];
                  if (key === "count") {
                    va = (a.TienNghi || []).length;
                    vb = (b.TienNghi || []).length;
                  }
                  if (typeof va === "number" && typeof vb === "number")
                    return va - vb;
                  va = (va || "").toString();
                  vb = (vb || "").toString();
                  return va.localeCompare(vb, undefined, {
                    numeric: true,
                    sensitivity: "base",
                  });
                };
                if (sortKey) {
                  processed.sort(
                    (a, b) => (sortDir === "asc" ? 1 : -1) * cmp(a, b, sortKey)
                  );
                }
                // pagination
                const total = processed.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const effectiveCurrentPage = Math.min(
                  Math.max(1, currentPage),
                  totalPages
                );
                const start = (effectiveCurrentPage - 1) * pageSize;
                const pageItems = processed.slice(start, start + pageSize);

                const handleSort = (key) => {
                  if (sortKey === key)
                    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
                  else {
                    setSortKey(key);
                    setSortDir("asc");
                  }
                };
                // ---
                return (
                  <>
                    <div className="table-responsive text-nowrap">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                handleSort("MaPhong");
                                setCurrentPage(1);
                              }}
                            >
                              Mã phòng
                              {sortKey === "MaPhong"
                                ? sortDir === "asc"
                                  ? " ↑"
                                  : " ↓"
                                : ""}
                            </th>
                            <th
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                handleSort("TenPhong");
                                setCurrentPage(1);
                              }}
                            >
                              Tên phòng
                              {sortKey === "TenPhong"
                                ? sortDir === "asc"
                                  ? " ↑"
                                  : " ↓"
                                : ""}
                            </th>
                            <th
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                handleSort("LoaiPhong");
                                setCurrentPage(1);
                              }}
                            >
                              Loại phòng
                              {sortKey === "LoaiPhong"
                                ? sortDir === "asc"
                                  ? " ↑"
                                  : " ↓"
                                : ""}
                            </th>
                            <th
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                handleSort("TinhTrang");
                                setCurrentPage(1);
                              }}
                            >
                              Tình trạng
                              {sortKey === "TinhTrang"
                                ? sortDir === "asc"
                                  ? " ↑"
                                  : " ↓"
                                : ""}
                            </th>
                            <th
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                handleSort("count");
                                setCurrentPage(1);
                              }}
                            >
                              Số tiện nghi
                              {sortKey === "count"
                                ? sortDir === "asc"
                                  ? " ↑"
                                  : " ↓"
                                : ""}
                            </th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="table-border-bottom-0">
                          {pageItems.map((r) => {
                            const statusInfo = getStatusColor(r.TinhTrang);
                            return (
                              <tr key={r._id}>
                                <td>
                                  <span className="fw-semibold">
                                    {r.MaPhong}
                                  </span>
                                </td>
                                <td>{r.TenPhong}</td>
                                <td>{r.LoaiPhong}</td>
                                <td>
                                  <span className={`badge ${statusInfo.bg}`}>
                                    {statusInfo.text}
                                  </span>
                                </td>
                                <td>
                                  {(r.TienNghi && r.TienNghi.length) || 0} tiện
                                  nghi
                                </td>
                                <td>
                                  <Button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => openManageRoom(r)}
                                  >
                                    <i className="bx bx-cog me-1"></i> Quản lý
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* pagination controls */}
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <div className="small text-muted">
                        Hiển thị {start + 1}-
                        {Math.min(start + pageItems.length, total)} trên {total}{" "}
                        phòng
                      </div>
                      <nav>
                        <ul className="pagination mb-0">
                          <li
                            className={`page-item ${
                              currentPage <= 1 ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                            >
                              Prev
                            </button>
                          </li>
                          {Array.from({ length: totalPages }).map((_, i) => {
                            const p = i + 1;
                            return (
                              <li
                                key={p}
                                className={`page-item ${
                                  p === currentPage ? "active" : ""
                                }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(p)}
                                >
                                  {p}
                                </button>
                              </li>
                            );
                          })}
                          <li
                            className={`page-item ${
                              currentPage >= totalPages ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1)
                                )
                              }
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* --- CÁC MODALS (Sử dụng Modal chung) --- */}

      {/* Modal 1: Thêm Tiện nghi MỚI (Global) */}
      <Modal
        isOpen={showNewAmenityModal}
        onClose={closeNewAmenity}
        title="Thêm tiện nghi mới"
      >
        <form onSubmit={handleSaveNewAmenity}>
          <p className="text-muted">
            Tiện nghi mới sẽ được thêm vào danh sách chung với trạng thái "Chưa gán".
          </p>
          <div className="mb-3">
            <label className="form-label">Tên tiện nghi mới</label>
            <input
              ref={newAmenityInputRef}
              type="text"
              className="form-control"
              placeholder="VD: Wifi, Bể bơi..."
              // onKeyDown={(e) => e.key === "Enter" && handleSaveNewAmenity()} // Đã chuyển sang onSubmit
            />
          </div>
          <div className="text-end mt-4 pt-3 border-top">
            <Button
              type="button"
              className="btn btn-outline-secondary me-2"
              onClick={closeNewAmenity}
            >
              Hủy
            </Button>
            <Button type="submit" className="btn btn-primary">
              Thêm
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Sửa Tiện nghi (Global) */}
      <Modal
        isOpen={modal.open}
        onClose={close}
        title={modal.mode === "create" ? "Tạo tiện nghi mới" : "Chỉnh sửa tiện nghi"}
      >
        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label">Tên tiện nghi</label>
            <input
              ref={editAmenityInputRef}
              type="text"
              className="form-control"
              defaultValue={modal.item?.TenTienNghi}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Trạng thái</label>
            <select
              className="form-select"
              value={modal.item?.TrangThai || 'Hoạt động'}
              onChange={(e) =>
                setModal((p) => ({
                  ...p,
                  item: { ...p.item, TrangThai: e.target.value },
                }))
              }
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Bảo trì">Bảo trì</option>
              <option value="Ngưng sử dụng">Ngưng sử dụng</option>
              <option value="Chưa gán">Chưa gán</option>
            </select>
            <small className="form-text">
              Chọn 'Ngưng sử dụng' sẽ gỡ tiện nghi khỏi các phòng.
            </small>
          </div>

          <div className="text-end mt-4 pt-3 border-top">
            <Button type="button" className="btn btn-outline-secondary me-2" onClick={close}>
              Hủy
            </Button>
            <Button type="submit" className="btn btn-primary">
              Lưu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Quản lý Tiện nghi cho 1 PHÒNG */}
      <Modal
        isOpen={showManageModal}
        onClose={closeManageRoom}
        title={"Quản lý tiện nghi: " + (roomForModal?.MaPhong || "")}
        dialogClassName="modal-lg"
      >
        <div>
          <p>
            Phòng: <strong>{roomForModal?.TenPhong}</strong> (
            {roomForModal?.LoaiPhong})
          </p>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Các tiện nghi hiện có</h6>
            <Button className="btn btn-primary" onClick={openAddSelector}>
              <i className="bx bx-plus me-1"></i> Thêm/Gỡ
            </Button>
          </div>
          <div
            className="list-group"
            style={{ maxHeight: "40vh", overflowY: "auto" }}
          >
            {(roomForModal?.TienNghi || []).length === 0 ? (
              <div className="list-group-item">Phòng chưa có tiện nghi nào.</div>
            ) : (
              (roomForModal?.TienNghi || []).map((t) => (
                <div
                  key={t.MaTienNghi}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    {t.TenTienNghi}
                    <span
                      className={`badge ${
                        getStatusColor(t.TrangThai).bg
                      } ms-2`}
                    >
                      {getStatusColor(t.TrangThai).text}
                    </span>
                  </div>
                  <Button
                    className="btn btn-icon btn-sm btn-outline-danger"
                    onClick={() => handleUnassign(t.MaTienNghi, roomForModal._id)}
                    title="Gỡ"
                  >
                    <i className="bx bx-x"></i>
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="text-end mt-4 pt-3 border-top">
            <Button
              className="btn btn-outline-secondary"
              onClick={closeManageRoom}
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Thêm/Gỡ Tiện nghi (từ Modal 3) */}
      <Modal
        isOpen={showAddSelector}
        onClose={closeAddSelector}
        title="Thêm/Gỡ tiện nghi"
        dialogClassName="modal-lg"
      >
        <div>
          <p>
            Chọn các tiện nghi để gán cho phòng{" "}
            <strong>{roomForModal?.MaPhong}</strong>. Bỏ chọn sẽ gỡ tiện nghi.
          </p>
          <div
            className="list-group"
            style={{ maxHeight: "50vh", overflowY: "auto" }}
          >
            {items.map((it) => (
              <label
                key={it.MaTienNghi}
                className="list-group-item d-flex align-items-center"
              >
                <input
                  type="checkbox"
                  className="form-check-input me-3"
                  checked={toAssignCodes.includes(it.MaTienNghi)}
                  onChange={() => toggleSelectToAssign(it.MaTienNghi)}
                />
                {it.TenTienNghi}
                <span
                  className={`badge ${
                    getStatusColor(it.TrangThai).bg
                  } ms-auto`}
                >
                  {getStatusColor(it.TrangThai).text}
                </span>
              </label>
            ))}
          </div>
          <div className="text-end mt-4 pt-3 border-top">
            <Button
              className="btn btn-outline-secondary me-2"
              onClick={closeAddSelector}
            >
              Hủy
            </Button>
            <Button className="btn btn-primary" onClick={addSelectedToRoom}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 5: Xem DS Phòng có Tiện nghi */}
      <Modal
        isOpen={showRoomsListModal}
        onClose={closeRoomsListModal}
        title={"Phòng có tiện nghi: " + roomsListAmenityName}
        dialogClassName="modal-lg"
      >
        <div>
          <div className="table-responsive text-nowrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã phòng</th>
                  <th>Tên phòng</th>
                  <th>Loại phòng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {roomsListForAmenity.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      Không có phòng nào có tiện nghi này.
                    </td>
                  </tr>
                ) : (
                  roomsListForAmenity.map((r) => {
                    const statusInfo = getStatusColor(r.TinhTrang);
                    return (
                      <tr key={r._id}>
                        <td>{r.MaPhong}</td>
                        <td>{r.TenPhong}</td>
                        <td>{r.LoaiPhong}</td>
                        <td>
                          <span className={`badge ${statusInfo.bg}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="text-end mt-4 pt-3 border-top">
            <Button
              className="btn btn-outline-secondary"
              onClick={closeRoomsListModal}
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AmenticsManager;