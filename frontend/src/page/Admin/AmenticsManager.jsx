import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  getRooms,
  assignAmenityToRoom,
  removeAmenityFromRoom,
} from "../../services/amenticsService";

const AmenticsManager = () => {
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    item: null,
  });
  // UI: filtering, sorting, pagination, toasts, confirm
  const [amenityFilter, setAmenityFilter] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [showRoomModal, setShowRoomModal] = useState(false);
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
    try {
      const a = await getAmenities();
      setItems(a || []);
      const r = await getRooms();
      setRooms(r || []);
    } catch (e) {
      console.error(e);
      showToast("Lấy danh sách tiện nghi thất bại", "danger");
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

  const getStatusEmoji = (status) => {
    const map = {
      Trống: "🟢",
      "Đang sử dụng": "🔵",
      "Đang dọn dẹp": "🟡",
      "Bảo trì": "🟡",
      "Hoạt động": "🟢",
      "Chưa gán": "⚪️",
      "Ngưng sử dụng": "🔴",
      Hư: "🔴",
      "Đã đặt": "🟣",
    };
    return map[status] || "⚪️";
  };

  const openViewRoom = (r) => {
    setRoomForModal(r);
    setShowRoomModal(true);
  };
  const closeViewRoom = () => {
    setRoomForModal(null);
    setShowRoomModal(false);
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

  const toggleSelectToAssign = (code) => {
    setToAssignCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const addSelectedToRoom = async () => {
    if (!roomForModal) return showToast("Không có phòng được chọn", "warning");
    if (!toAssignCodes.length)
      return showToast("Chọn tiện nghi để thêm", "warning");
    try {
      await Promise.all(
        toAssignCodes.map((code) => assignAmenityToRoom(code, roomForModal._id))
      );
      await load();
      closeManageRoom();
      showToast(
        `Đã thêm ${toAssignCodes.length} tiện nghi vào phòng ${roomForModal.MaPhong}`,
        "success"
      );
    } catch (e) {
      console.error(e);
      showToast("Thêm tiện nghi thất bại: " + (e.message || e), "danger");
    }
  };

  const openCreate = () =>
    setModal({
      open: true,
      mode: "create",
      item: {
        TenTienNghi: "",
        TrangThai: "Hoạt động",
        roomIds: [],
        assignToAll: false,
      },
    });
  const openEdit = (it) =>
    setModal({ open: true, mode: "edit", item: { ...it } });
  const close = () => setModal({ open: false, mode: "create", item: null });

  const handleSave = async () => {
    try {
      if (modal.mode === "create") {
        const payload = {
          TenTienNghi: modal.item.TenTienNghi,
          TrangThai: modal.item.TrangThai,
          roomIds: modal.item.roomIds,
          assignToAll: modal.item.assignToAll,
        };
        await createAmenity(payload);
        await load();
        close();
        showToast("Đã tạo tiện nghi mới.", "success");
        return;
      }

      // edit mode: update TenTienNghi and TrangThai across Room documents that contain this MaTienNghi
      const code = modal.item.MaTienNghi;
      const newName =
        modal.mode === "edit"
          ? editAmenityInputRef.current
            ? String(editAmenityInputRef.current.value || "")
            : modal.item.TenTienNghi
          : modal.item.TenTienNghi;
      const newStatus = modal.item.TrangThai;

      // snapshot rooms before update to detect whether anything actually changes
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

      // call API to update
      await updateAmenity(code, { TenTienNghi: newName, TrangThai: newStatus });

      // reload fresh data
      await load();

      // fetch fresh rooms to examine actual stored values
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

      // If the new status is 'Ngưng sử dụng' remove this amenity from rooms
      // but keep it in the global list. Because the global list is derived from rooms,
      // we keep a single sentinel assignment on the first room to preserve the item.
      if (String(newStatus || "").trim() === "Ngưng sử dụng") {
        try {
          const roomsWith = freshRoomsWith || [];
          if (!rooms || !rooms.length) {
            showToast("Không có phòng trong hệ thống để xử lý.", "warning");
            close();
            return;
          }

          const firstRoomId = rooms[0]._id;

          // We'll remove from all rooms except keep one sentinel assignment on firstRoomId
          const toRemove = roomsWith
            .map((r) => r._id)
            .filter((id) => id !== firstRoomId);

          // If the amenity wasn't present anywhere, ensure it exists in sentinel room
          if (roomsWith.length === 0) {
            // ensure it is present at least on the sentinel room so it stays in the global list
            await assignAmenityToRoom(code, firstRoomId, {});
            await load();
            showToast(
              `Đã cập nhật tiện nghi ‘${newName}’ và giữ trong danh sách chung.`,
              "success"
            );
            close();
            return;
          }

          if (toRemove.length > 0) {
            await Promise.all(
              toRemove.map((rid) => removeAmenityFromRoom(code, rid))
            );
          }

          // If the sentinel room didn't already have it, ensure it's assigned there
          const sentinelHas = (roomsWith || []).some(
            (r) => r._id === firstRoomId
          );
          if (!sentinelHas) {
            await assignAmenityToRoom(code, firstRoomId, {});
          }

          await load();
          const removedCount = toRemove.length;
          showToast(
            `Đã cập nhật tiện nghi ‘${newName}’ và đã gỡ khỏi ${removedCount} phòng (giữ trong danh sách chung).`,
            "success"
          );
          close();
          return;
        } catch (err) {
          console.error(err);
          showToast(
            "Lỗi khi gỡ tiện nghi khỏi phòng. Vui lòng thử lại.",
            "danger"
          );
          close();
          return;
        }
      }

      // Determine result and show appropriate message per spec for non-removed statuses
      if (roomsWithBefore.length === 0) {
        // no room had this amenity -> nothing changed
        showToast("Không có thông tin nào được chỉnh sửa.", "warning");
      } else if (roomsAlreadyMatchingBefore === roomsWithBefore.length) {
        // all rooms already had the same values
        showToast("Không có thông tin nào được chỉnh sửa.", "warning");
      } else if (freshMatching > 0) {
        showToast(`Đã cập nhật tiện nghi ‘${newName}’ thành công.`, "success");
      } else {
        // fallback: if update returned but we cannot detect change
        showToast("Đã cập nhật tiện nghi.", "info");
      }

      close();
    } catch (e) {
      console.error(e);
      showToast("Lỗi hệ thống — vui lòng thử lại.", "danger");
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

  // focus the new-amenity input when the modal opens; use uncontrolled input to avoid re-render caret jumps
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

  // focus the edit modal input when opened and populate the uncontrolled input
  useEffect(() => {
    if (modal.open && modal.mode === "edit") {
      const t = setTimeout(() => {
        try {
          const input = editAmenityInputRef.current;
          if (input) {
            input.value = modal.item?.TenTienNghi || "";
            input.focus();
            // place caret at end
            const len = String(input.value || "").length;
            input.setSelectionRange && input.setSelectionRange(len, len);
          }
        } catch (e) {
          /* ignore */
        }
      }, 30);
      return () => clearTimeout(t);
    }
    // when modal closes, clear ref value
    if (!modal.open && editAmenityInputRef.current) {
      try {
        editAmenityInputRef.current.value = "";
      } catch (e) {}
    }
  }, [modal.open, modal.mode, modal.item]);

  const handleAddNewAmenity = async () => {
    const val = newAmenityInputRef.current
      ? String(newAmenityInputRef.current.value || "")
      : newAmenityName || "";
    if (!val || !val.trim()) return showToast("Nhập tên tiện nghi", "warning");
    if (!rooms || !rooms.length)
      return showToast(
        "Không có phòng để chèn tiện nghi. Tạo phòng trước.",
        "warning"
      );
    try {
      const firstRoomId = rooms[0]._id;
      // create with default status 'Chưa gán' and assign to first room so it persists
      await createAmenity({
        TenTienNghi: val.trim(),
        TrangThai: "Chưa gán",
        roomIds: [firstRoomId],
      });
      await load();
      showToast(
        `Đã thêm tiện nghi '${val.trim()}' vào danh sách chung.`,
        "success"
      );
      // clear the uncontrolled input
      if (newAmenityInputRef.current) newAmenityInputRef.current.value = "";
      closeNewAmenity();
    } catch (e) {
      console.error(e);
      showToast("Thêm tiện nghi thất bại: " + (e.message || e), "danger");
    }
  };

  const handleDelete = async (code) => {
    // Prevent deleting if any room that has this amenity is currently in use
    try {
      const fresh = await getRooms();
      const roomsWith = (fresh || []).filter((r) =>
        (r.TienNghi || []).some((t) => t.MaTienNghi === code)
      );
      const blocking = roomsWith.filter(isRoomInUse);
      if (blocking.length) {
        showToast(
          `Không thể xóa: tiện nghi đang được gán cho phòng đang sử dụng (${blocking
            .map((b) => b.MaPhong || b._id)
            .join(", ")})`,
          "warning"
        );
        return;
      }
    } catch (e) {
      // fallback to local state check
      const roomsWith = (rooms || []).filter((r) =>
        (r.TienNghi || []).some((t) => t.MaTienNghi === code)
      );
      const blocking = roomsWith.filter(isRoomInUse);
      if (blocking.length) {
        showToast(
          `Không thể xóa: tiện nghi đang được gán cho phòng đang sử dụng (${blocking
            .map((b) => b.MaPhong || b._id)
            .join(", ")})`,
          "warning"
        );
        return;
      }
    }

    // use confirm modal (simple delete without cascade)
    openConfirm(
      `Xóa tiện nghi ${code}`,
      `Bạn có chắc chắn muốn xóa tiện nghi ${code}?`,
      async () => {
        try {
          await deleteAmenity(code);
          await load();
          showToast("Xóa thành công", "success");
        } catch (e) {
          console.error(e);
          showToast("Xóa thất bại: " + (e.message || e), "danger");
        }
      }
    );
  };

  // assign to room is no longer available from the global amenities table

  const handleUnassign = async (code, roomId) => {
    // Prevent unassigning if the room is currently in use
    try {
      const fresh = await getRooms();
      const target =
        (fresh || []).find((r) => r._id === roomId) ||
        (rooms || []).find((r) => r._id === roomId);
      if (isRoomInUse(target)) {
        showToast(
          "Không thể gỡ tiện nghi khi phòng đang được sử dụng.",
          "warning"
        );
        return;
      }
    } catch (e) {
      const target = (rooms || []).find((r) => r._id === roomId);
      if (isRoomInUse(target)) {
        showToast(
          "Không thể gỡ tiện nghi khi phòng đang được sử dụng.",
          "warning"
        );
        return;
      }
    }

    openConfirm("Gỡ tiện nghi", `Gỡ tiện nghi khỏi phòng?`, async () => {
      try {
        await removeAmenityFromRoom(code, roomId);
        // reload lists
        await load();
        // ensure the open room modal reflects the updated room data
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
          // fallback: remove from local modal state
          setRoomForModal((prev) => ({
            ...(prev || {}),
            TienNghi: (prev?.TienNghi || []).filter(
              (t) => t.MaTienNghi !== code
            ),
          }));
        }
        showToast("Đã gỡ", "success");
      } catch (e) {
        console.error(e);
        showToast("Gỡ thất bại: " + (e.message || e), "danger");
      }
    });
  };

  // Toast helper
  const showToast = (message, variant = "success", ttl = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  };

  // Confirm modal helper
  const openConfirm = (title, message, onConfirm) => {
    setConfirmModal({ open: true, title, message, onConfirm });
  };

  const closeConfirm = () =>
    setConfirmModal({ open: false, title: "", message: "", onConfirm: null });

  // Portal helper to ensure modals/toasts mount at document.body and sit above other stacking contexts
  const PortalModal = ({
    children,
    width = 720,
    z = 1060,
    backdrop = true,
  }) => {
    if (typeof document === "undefined") return null;
    // center horizontally, place slightly below top so modal looks like attached screenshot
    const containerStyle = {
      position: "fixed",
      inset: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingTop: 56,
      zIndex: z,
      overflowY: "auto",
    };

    const boxStyle = {
      position: "relative",
      zIndex: z + 1,
      width: typeof width === "number" ? width : width,
      maxWidth: "calc(100% - 48px)",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 12px 32px rgba(24,39,75,0.15)",
      padding: 0,
      overflow: "hidden",
      maxHeight: "80vh",
    };

    const backdropNode = backdrop ? (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(13,24,45,0.45)",
          zIndex: z,
        }}
      />
    ) : null;

    const content = (
      <div style={containerStyle}>
        <div style={boxStyle}>{children}</div>
        {backdropNode}
      </div>
    );
    return ReactDOM.createPortal(content, document.body);
  };

  return (
    <div className="card p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Quản lý Tiện nghi</h4>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div>
          {/* Filters: amenity filter, page size */}

          <table className="table table-striped">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên tiện nghi</th>
                <th>Trạng thái</th>
                <th>Số phòng đang có</th>
                <th>⚙️</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.MaTienNghi}>
                  <td>{it.MaTienNghi}</td>
                  <td>{it.TenTienNghi}</td>
                  <td>
                    {getStatusEmoji(it.TrangThai)} {it.TrangThai}
                  </td>
                  <td className="d-flex align-items-center gap-2">
                    <div>{it.countRooms ?? 0}</div>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        openRoomsList(it.MaTienNghi, it.TenTienNghi)
                      }
                    >
                      Xem
                    </button>
                  </td>
                  <td>
                    <button
                      title="Sửa"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openEdit(it)}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="d-flex justify-content-end mb-3">
            <button
              className="btn btn-outline-primary"
              onClick={openNewAmenity}
            >
              ➕ Thêm tiện nghi mới
            </button>
          </div>

          <div className="mt-4">
            <h5>Danh sách phòng (gỡ tiện nghi)</h5>
            <div className="small text-muted">
              Hiển thị toàn bộ phòng và số tiện nghi. Chọn Xem để xem chi tiết
              hoặc Quản lý để thêm/gỡ tiện nghi.
            </div>
            <div className="table-responsive mt-2">
              <div className="d-flex gap-3 mb-3 align-items-end">
                <div style={{ minWidth: 240 }}>
                  <label className="form-label small mb-0">
                    Lọc phòng theo tiện nghi
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
                <div style={{ minWidth: 120 }}>
                  <label className="form-label small mb-0">
                    Số hàng / trang
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
              {/* derive filtered / sorted / paged rooms */}
              {/* compute on render to keep state minimal */}
              {/**/}
              {(() => {
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

                return (
                  <>
                    <table className="table table-striped">
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
                              handleSort("Tang");
                              setCurrentPage(1);
                            }}
                          >
                            Tầng
                            {sortKey === "Tang"
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
                      <tbody>
                        {pageItems.map((r) => (
                          <tr key={r._id}>
                            <td>{r.MaPhong}</td>
                            <td>{r.TenPhong}</td>
                            <td>{r.LoaiPhong}</td>
                            <td>{r.Tang}</td>
                            <td>
                              {getStatusEmoji(r.TinhTrang)} {r.TinhTrang}
                            </td>
                            <td>
                              {(r.TienNghi && r.TienNghi.length) || 0} tiện nghi
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openManageRoom(r)}
                              >
                                ⚙️ Quản lý
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* pagination controls */}
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="small text-muted">
                        Hiển thị {start + 1}-
                        {Math.min(start + pageItems.length, total)} trên {total}{" "}
                        phòng
                      </div>
                      <div>
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
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showNewAmenityModal && (
        <PortalModal width={520} z={12500} backdrop={true}>
          <div className="card p-3">
            <h5>Thêm tiện nghi mới</h5>
            <div className="mb-2">
              <label className="form-label">Tên tiện nghi</label>
              <input
                ref={newAmenityInputRef}
                className="form-control"
                defaultValue={newAmenityName}
              />
            </div>
            <div className="mb-2 small text-muted">
              Trạng thái mặc định: <strong>Chưa gán</strong> (sẽ xuất hiện khi
              gán vào phòng)
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={closeNewAmenity}>
                ❌ Hủy
              </button>
              <button className="btn btn-primary" onClick={handleAddNewAmenity}>
                ✅ Thêm
              </button>
            </div>
          </div>
        </PortalModal>
      )}

      {modal.open && (
        <PortalModal width={720} z={12000} backdrop={true}>
          <div className="card p-3">
            <h5>
              {modal.mode === "create" ? "Tạo tiện nghi" : "Sửa tiện nghi"}
            </h5>
            <div className="mb-2">
              <label className="form-label">Tên tiện nghi</label>
              {modal.mode === "edit" ? (
                // uncontrolled input to avoid caret jump when changing other fields
                <input
                  ref={editAmenityInputRef}
                  className="form-control"
                  defaultValue={modal.item?.TenTienNghi || ""}
                />
              ) : (
                <input
                  className="form-control"
                  value={modal.item.TenTienNghi}
                  onChange={(e) =>
                    setModal((m) => ({
                      ...m,
                      item: { ...m.item, TenTienNghi: e.target.value },
                    }))
                  }
                />
              )}
            </div>
            <div className="mb-2">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-select"
                value={modal.item.TrangThai}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    item: { ...m.item, TrangThai: e.target.value },
                  }))
                }
              >
                <option>Hoạt động</option>
                <option>Bảo trì</option>
                <option>Ngưng sử dụng</option>
              </select>
            </div>
            {modal.mode === "create" && (
              <>
                <div className="mb-2">
                  <label className="form-label">
                    Gán cho phòng (chọn nhiều bằng Ctrl)
                  </label>
                  <select
                    className="form-select"
                    multiple
                    value={modal.item.roomIds}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions).map(
                        (o) => o.value
                      );
                      setModal((m) => ({
                        ...m,
                        item: { ...m.item, roomIds: opts },
                      }));
                    }}
                  >
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.MaPhong || r.TenPhong || r._id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={modal.item.assignToAll}
                    onChange={(e) =>
                      setModal((m) => ({
                        ...m,
                        item: { ...m.item, assignToAll: e.target.checked },
                      }))
                    }
                    id="assignAll"
                  />
                  <label className="form-check-label" htmlFor="assignAll">
                    Gán cho tất cả phòng
                  </label>
                </div>
              </>
            )}

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={close}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Lưu
              </button>
            </div>
          </div>
        </PortalModal>
      )}
      {/* Room View Modal */}
      {showRoomModal && roomForModal && (
        <PortalModal width={720} z={12000} backdrop={true}>
          <div className="card p-3">
            <h5>
              Chi tiết phòng: {roomForModal.MaPhong} - {roomForModal.TenPhong}
            </h5>
            <div className="mt-2">
              <div className="small text-muted">
                Tầng: {roomForModal.Tang} — Trạng thái: {roomForModal.TinhTrang}
              </div>
              <div className="mt-3">
                <h6>Tiện nghi</h6>
                <div className="d-flex gap-2 flex-wrap">
                  {(roomForModal.TienNghi || []).map((tn) => (
                    <div
                      key={tn.MaTienNghi}
                      className="badge bg-light text-dark p-2 border"
                    >
                      {tn.TenTienNghi}{" "}
                      <button
                        className="btn btn-sm btn-link text-danger p-0 ms-2"
                        onClick={() =>
                          handleUnassign(tn.MaTienNghi, roomForModal._id)
                        }
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={closeViewRoom}>
                Đóng
              </button>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Manage Room Modal (add amenities) */}
      {showManageModal && roomForModal && (
        <PortalModal width={720} z={12000} backdrop={true}>
          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Quản lý tiện nghi cho phòng: {roomForModal.MaPhong}
              </h5>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={openAddSelector}
                >
                  ➕ Thêm tiện nghi
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={closeManageRoom}
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="small text-muted mt-2">
              Các tiện nghi hiện có của phòng — bấm ❌ để gỡ từng tiện nghi.
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }} className="mt-3">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Mã TN</th>
                    <th>Tên tiện nghi</th>
                    <th>Trạng thái</th>
                    <th>⚙️</th>
                  </tr>
                </thead>
                <tbody>
                  {(roomForModal.TienNghi || []).map((tn) => (
                    <tr key={tn.MaTienNghi}>
                      <td>{tn.MaTienNghi}</td>
                      <td>{tn.TenTienNghi}</td>
                      <td>
                        {getStatusEmoji(tn.TrangThai || tn.TrangThai)}{" "}
                        {tn.TrangThai || "Hoạt động"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleUnassign(tn.MaTienNghi, roomForModal._id)
                          }
                        >
                          ❌ Gỡ
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!(roomForModal.TienNghi && roomForModal.TienNghi.length) && (
                    <tr>
                      <td colSpan={4} className="text-muted">
                        Phòng chưa có tiện nghi nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Add-from-global selector (checkbox list) */}
      {showAddSelector && roomForModal && (
        <PortalModal width={720} z={13000} backdrop={true}>
          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Chọn tiện nghi để gán cho phòng: {roomForModal.MaPhong}
              </h5>
            </div>
            <div className="small text-muted mt-2">
              Tick các tiện nghi từ danh sách chung. Các mục đã có sẽ được tick
              sẵn.
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }} className="mt-3">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th></th>
                    <th>Tên tiện nghi</th>
                    <th>Mã TN</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.MaTienNghi}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={toAssignCodes.includes(a.MaTienNghi)}
                          onChange={() => toggleSelectToAssign(a.MaTienNghi)}
                        />
                      </td>
                      <td>{a.TenTienNghi}</td>
                      <td>{a.MaTienNghi}</td>
                      <td>{a.TrangThai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={closeAddSelector}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    // only add new codes (don't re-add existing)
                    const existing = (roomForModal.TienNghi || []).map(
                      (t) => t.MaTienNghi
                    );
                    const toAdd = toAssignCodes.filter(
                      (c) => !existing.includes(c)
                    );
                    if (!toAdd.length) {
                      showToast("Không có tiện nghi mới để thêm", "info");
                      setShowAddSelector(false);
                      return;
                    }
                    await Promise.all(
                      toAdd.map((code) =>
                        assignAmenityToRoom(code, roomForModal._id)
                      )
                    );
                    // reload and update roomForModal
                    const freshRooms = await getRooms();
                    setRooms(freshRooms || []);
                    const updated = (freshRooms || []).find(
                      (rr) => rr._id === roomForModal._id
                    );
                    setRoomForModal(updated || roomForModal);
                    showToast(`Đã thêm ${toAdd.length} tiện nghi`, "success");
                  } catch (e) {
                    console.error(e);
                    showToast(
                      "Thêm tiện nghi thất bại: " + (e.message || e),
                      "danger"
                    );
                  } finally {
                    setShowAddSelector(false);
                  }
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Rooms list modal (click count to view which rooms have the amenity) */}
      {showRoomsListModal && (
        <PortalModal width={680} z={13000} backdrop={true}>
          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Phòng đang có tiện nghi: {roomsListAmenityName}
              </h5>
              <div>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={closeRoomsListModal}
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="mt-3" style={{ maxHeight: 420, overflowY: "auto" }}>
              {roomsListForAmenity.length ? (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Mã phòng</th>
                      <th>Tên</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomsListForAmenity.map((r) => (
                      <tr key={r._id}>
                        <td>{r.MaPhong}</td>
                        <td>{r.TenPhong}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              closeRoomsListModal();
                              openManageRoom(r);
                            }}
                          >
                            Quản lý
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="small text-muted">
                  Không có phòng nào đang sử dụng tiện nghi này.
                </div>
              )}
            </div>
          </div>
        </PortalModal>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <PortalModal width={520} z={12000} backdrop={true}>
          <div className="card p-3">
            <h5>{confirmModal.title}</h5>
            <div className="mt-2 small text-muted">{confirmModal.message}</div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={closeConfirm}>
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    if (typeof confirmModal.onConfirm === "function")
                      await confirmModal.onConfirm();
                  } catch (e) {
                    console.error(e);
                  }
                  closeConfirm();
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Toasts container (portal) */}
      {ReactDOM.createPortal(
        <div style={{ position: "fixed", right: 20, top: 20, zIndex: 13000 }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`alert alert-${t.variant} shadow-sm d-flex align-items-center`}
              style={{ minWidth: 240, marginBottom: 8 }}
              role="alert"
            >
              <div style={{ flex: 1 }}>{t.message}</div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() =>
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                }
              ></button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default AmenticsManager;
