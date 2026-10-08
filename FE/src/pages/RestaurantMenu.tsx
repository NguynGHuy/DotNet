import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CircleDollarSign,
  ImageIcon,
  Pencil,
  Plus,
  Power,
  Save,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  createMonAn,
  deleteMonAn,
  ganTopping,
  getMonAn,
  getMonAns,
  goTopping,
  updateMonAn,
  updateTrangThaiMonAn,
  type MonAn,
  type MonAnChiTiet,
} from "../services/menuService";
import { getDanhMucs, type DanhMuc } from "../services/categoryService";
import { getNhomToppings, type NhomTopping } from "../services/toppingService";
import { getCurrentUser } from "../services/userService";

interface CurrentUser {
  nhaHang?: { maNhaHang: number };
}

interface MonForm {
  maDanhMuc: number;
  tenMonAn: string;
  moTa: string;
  gia: number;
  hinhAnh: string;
}

type StatusFilter = "all" | "selling" | "hidden";

const EMPTY_FORM: MonForm = {
  maDanhMuc: 0,
  tenMonAn: "",
  moTa: "",
  gia: 0,
  hinhAnh: "",
};

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function RestaurantMenu() {
  const [monAns, setMonAns] = useState<MonAn[]>([]);
  const [danhMucs, setDanhMucs] = useState<DanhMuc[]>([]);
  const [nhomToppings, setNhomToppings] = useState<NhomTopping[]>([]);
  const [form, setForm] = useState<MonForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toppingMonId, setToppingMonId] = useState<number | null>(null);
  const [monChiTiet, setMonChiTiet] = useState<MonAnChiTiet | null>(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTopping, setLoadingTopping] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getRestaurantId = async () => {
    const user = (await getCurrentUser()) as CurrentUser;
    const maNhaHang = user.nhaHang?.maNhaHang;

    if (!maNhaHang) {
      throw new Error("Không tìm thấy thông tin nhà hàng.");
    }

    return maNhaHang;
  };

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const maNhaHang = await getRestaurantId();
      const [menuData, categoryData, toppingData] = await Promise.all([
        getMonAns(maNhaHang),
        getDanhMucs(maNhaHang),
        getNhomToppings(maNhaHang),
      ]);

      setMonAns(Array.isArray(menuData) ? menuData : []);
      setDanhMucs(Array.isArray(categoryData) ? categoryData : []);
      setNhomToppings(Array.isArray(toppingData) ? toppingData : []);
    } catch (err) {
      console.error("Lỗi tải thực đơn:", err);
      setError(err instanceof Error ? err.message : "Không thể tải thực đơn.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const showMessage = (message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      maDanhMuc: danhMucs[0]?.maDanhMuc ?? 0,
    });
    setEditorOpen(true);
    setError("");
    setSuccess("");
  };

  const openEdit = (item: MonAn) => {
    setEditingId(item.maMonAn);
    setForm({
      maDanhMuc: item.maDanhMuc,
      tenMonAn: item.tenMonAn,
      moTa: item.moTa ?? "",
      gia: Number(item.gia),
      hinhAnh: item.hinhAnh ?? "",
    });
    setEditorOpen(true);
    setError("");
    setSuccess("");
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.maDanhMuc <= 0) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    if (!form.tenMonAn.trim()) {
      setError("Vui lòng nhập tên món ăn.");
      return;
    }

    if (form.gia <= 0) {
      setError("Giá món phải lớn hơn 0.");
      return;
    }

    const payload = {
      maDanhMuc: form.maDanhMuc,
      tenMonAn: form.tenMonAn.trim(),
      moTa: form.moTa.trim() || null,
      gia: form.gia,
      hinhAnh: form.hinhAnh.trim() || null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId === null) {
        await createMonAn(payload);
        showMessage("Đã thêm món ăn mới.");
      } else {
        await updateMonAn(editingId, payload);
        showMessage("Đã cập nhật món ăn.");
      }

      setEditorOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadData(false);
    } catch (err) {
      console.error("Lỗi lưu món ăn:", err);
      setError(err instanceof Error ? err.message : "Không thể lưu món ăn.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: MonAn) => {
    try {
      setBusyItemId(item.maMonAn);
      setError("");
      setSuccess("");

      await updateTrangThaiMonAn(item.maMonAn, !item.trangThai);

      showMessage(item.trangThai ? "Đã tạm ngưng bán món." : "Đã bật bán món.");

      await loadData(false);
    } catch (err) {
      console.error("Lỗi đổi trạng thái món:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể thay đổi trạng thái món.",
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDelete = async (item: MonAn) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa món "${item.tenMonAn}" không?`,
    );

    if (!confirmed) return;

    try {
      setBusyItemId(item.maMonAn);
      setError("");
      setSuccess("");

      await deleteMonAn(item.maMonAn);

      if (editingId === item.maMonAn) closeEditor();

      if (toppingMonId === item.maMonAn) {
        setToppingMonId(null);
        setMonChiTiet(null);
      }

      showMessage("Đã xóa món ăn.");
      await loadData(false);
    } catch (err) {
      console.error("Lỗi xóa món:", err);
      setError(err instanceof Error ? err.message : "Không thể xóa món ăn.");
    } finally {
      setBusyItemId(null);
    }
  };

  const openToppingManager = async (item: MonAn) => {
    try {
      setToppingMonId(item.maMonAn);
      setMonChiTiet(null);
      setLoadingTopping(true);
      setError("");
      setSuccess("");

      const detail = await getMonAn(item.maMonAn);
      setMonChiTiet(detail);
    } catch (err) {
      console.error("Lỗi tải topping của món:", err);
      setToppingMonId(null);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải nhóm topping của món.",
      );
    } finally {
      setLoadingTopping(false);
    }
  };

  const closeToppingManager = () => {
    if (loadingTopping) return;
    setToppingMonId(null);
    setMonChiTiet(null);
  };

  const isGroupAssigned = (maNhomTopping: number) =>
    monChiTiet?.nhomToppings.some(
      (group) => group.maNhomTopping === maNhomTopping,
    ) ?? false;

  const handleToggleGroup = async (group: NhomTopping) => {
    if (toppingMonId === null) return;

    try {
      setLoadingTopping(true);
      setError("");
      setSuccess("");

      if (isGroupAssigned(group.maNhomTopping)) {
        await goTopping(toppingMonId, group.maNhomTopping);
        showMessage(`Đã gỡ nhóm "${group.tenNhom}" khỏi món.`);
      } else {
        await ganTopping(toppingMonId, group.maNhomTopping);
        showMessage(`Đã gán nhóm "${group.tenNhom}" vào món.`);
      }

      const detail = await getMonAn(toppingMonId);
      setMonChiTiet(detail);
    } catch (err) {
      console.error("Lỗi gán nhóm topping:", err);
      setError(
        err instanceof Error ? err.message : "Không thể cập nhật nhóm topping.",
      );
    } finally {
      setLoadingTopping(false);
    }
  };

  const filteredMonAns = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return monAns.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.tenMonAn.toLowerCase().includes(keyword) ||
        (item.tenDanhMuc ?? "").toLowerCase().includes(keyword);

      const matchesCategory =
        categoryFilter === 0 || item.maDanhMuc === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "selling" && Boolean(item.trangThai)) ||
        (statusFilter === "hidden" && !Boolean(item.trangThai));

      return matchesKeyword && matchesCategory && matchesStatus;
    });
  }, [monAns, searchText, categoryFilter, statusFilter]);

  const sellingCount = monAns.filter((item) => item.trangThai).length;

  if (loading) {
    return <div className="quan-page-loading">Đang tải thực đơn...</div>;
  }

  return (
    <div className="merchant-menu-page">
      <header className="merchant-menu-header">
        <div>
          <span className="merchant-menu-eyebrow">QUẢN LÝ THỰC ĐƠN</span>
          <h1>Món ăn</h1>
          <p>Quản lý món, giá bán, trạng thái và nhóm topping.</p>
        </div>

        <button
          type="button"
          className="merchant-menu-add"
          onClick={openCreate}
          disabled={danhMucs.length === 0}
        >
          <Plus size={16} />
          Thêm món
        </button>
      </header>

      {danhMucs.length === 0 && (
        <div className="merchant-menu-notice warning">
          Bạn cần tạo ít nhất một danh mục trước khi thêm món.
        </div>
      )}

      {error && !editorOpen && toppingMonId === null && (
        <div className="merchant-menu-notice error">{error}</div>
      )}

      {success && (
        <div className="merchant-menu-notice success">✓ {success}</div>
      )}

      <section className="merchant-menu-toolbar">
        <div className="merchant-menu-summary">
          <div>
            <strong>{monAns.length}</strong>
            <span>Tổng món</span>
          </div>
          <div>
            <strong>{sellingCount}</strong>
            <span>Đang bán</span>
          </div>
          <div>
            <strong>{monAns.length - sellingCount}</strong>
            <span>Tạm ngưng</span>
          </div>
        </div>

        <div className="merchant-menu-filters">
          <label className="merchant-menu-search">
            <Search size={15} />
            <input
              type="search"
              value={searchText}
              placeholder="Tìm tên món..."
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>

          <label className="merchant-menu-select">
            <Tag size={15} />
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(Number(event.target.value))
              }
            >
              <option value={0}>Tất cả danh mục</option>
              {danhMucs.map((item) => (
                <option key={item.maDanhMuc} value={item.maDanhMuc}>
                  {item.tenDanhMuc}
                </option>
              ))}
            </select>
          </label>

          <label className="merchant-menu-select">
            <SlidersHorizontal size={15} />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="selling">Đang bán</option>
              <option value="hidden">Tạm ngưng</option>
            </select>
          </label>
        </div>
      </section>

      {filteredMonAns.length === 0 ? (
        <div className="merchant-menu-empty">
          <span>
            <UtensilsCrossed size={28} />
          </span>
          <h3>
            {monAns.length === 0
              ? "Chưa có món ăn"
              : "Không tìm thấy món phù hợp"}
          </h3>
          <p>
            {monAns.length === 0
              ? "Thêm món đầu tiên để bắt đầu xây dựng thực đơn."
              : "Hãy thay đổi từ khóa hoặc bộ lọc đang chọn."}
          </p>
          {monAns.length === 0 && danhMucs.length > 0 && (
            <button type="button" onClick={openCreate}>
              <Plus size={15} />
              Thêm món
            </button>
          )}
        </div>
      ) : (
        <div className="merchant-menu-grid">
          {filteredMonAns.map((item) => (
            <article
              key={item.maMonAn}
              className={`merchant-menu-card ${
                item.trangThai ? "is-selling" : "is-hidden"
              }`}
            >
              <div className="merchant-menu-image">
                <ImageIcon size={25} />

                {item.hinhAnh && (
                  <img
                    src={item.hinhAnh}
                    alt={item.tenMonAn}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <span className={item.trangThai ? "selling" : "hidden"}>
                  {item.trangThai ? "Đang bán" : "Tạm ngưng"}
                </span>
              </div>

              <div className="merchant-menu-card-body">
                <div className="merchant-menu-card-heading">
                  <div>
                    <span>{item.tenDanhMuc}</span>
                    <h2>{item.tenMonAn}</h2>
                  </div>

                  <strong>{formatMoney(item.gia)}</strong>
                </div>

                <p>{item.moTa || "Món ăn chưa có phần mô tả."}</p>

                <div className="merchant-menu-card-actions">
                  <button
                    type="button"
                    className="topping"
                    onClick={() => void openToppingManager(item)}
                    disabled={busyItemId !== null}
                  >
                    <SlidersHorizontal size={14} />
                    Topping
                  </button>

                  <button
                    type="button"
                    className="edit"
                    onClick={() => openEdit(item)}
                    disabled={busyItemId !== null}
                  >
                    <Pencil size={14} />
                    Sửa
                  </button>

                  <button
                    type="button"
                    className="status"
                    onClick={() => void handleToggleStatus(item)}
                    disabled={busyItemId !== null}
                    title={item.trangThai ? "Tạm ngưng bán" : "Bật bán"}
                  >
                    <Power size={14} />
                    {item.trangThai ? "Tắt bán" : "Bật bán"}
                  </button>

                  <button
                    type="button"
                    className="delete"
                    onClick={() => void handleDelete(item)}
                    disabled={busyItemId !== null}
                    title="Xóa món"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editorOpen && (
        <div className="merchant-menu-drawer-overlay" onMouseDown={closeEditor}>
          <form
            className="merchant-menu-drawer"
            onSubmit={handleSubmit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="merchant-menu-drawer-header">
              <div>
                <span>
                  {editingId === null ? "MÓN ĂN MỚI" : "CHỈNH SỬA MÓN"}
                </span>
                <h2>
                  {editingId === null ? "Thêm món ăn" : "Cập nhật món ăn"}
                </h2>
                <p>Điền thông tin khách hàng sẽ nhìn thấy.</p>
              </div>

              <button
                type="button"
                aria-label="Đóng"
                onClick={closeEditor}
                disabled={saving}
              >
                <X size={19} />
              </button>
            </header>

            <div className="merchant-menu-drawer-body">
              <label className="merchant-menu-field">
                <span>Danh mục</span>
                <select
                  value={form.maDanhMuc}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maDanhMuc: Number(event.target.value),
                    }))
                  }
                >
                  <option value={0}>Chọn danh mục</option>
                  {danhMucs.map((item) => (
                    <option key={item.maDanhMuc} value={item.maDanhMuc}>
                      {item.tenDanhMuc}
                    </option>
                  ))}
                </select>
              </label>

              <label className="merchant-menu-field">
                <span>Tên món ăn</span>
                <input
                  autoFocus
                  type="text"
                  value={form.tenMonAn}
                  maxLength={150}
                  placeholder="Ví dụ: Trà sữa trân châu"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tenMonAn: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="merchant-menu-field">
                <span>Giá bán</span>
                <div className="merchant-menu-price-input">
                  <CircleDollarSign size={16} />
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.gia}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        gia: Number(event.target.value),
                      }))
                    }
                  />
                  <strong>đ</strong>
                </div>
              </label>

              <label className="merchant-menu-field">
                <span>Đường dẫn hình ảnh</span>
                <div className="merchant-menu-icon-input">
                  <ImageIcon size={16} />
                  <input
                    type="url"
                    value={form.hinhAnh}
                    placeholder="https://..."
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hinhAnh: event.target.value,
                      }))
                    }
                  />
                </div>
              </label>

              {form.hinhAnh.trim() && (
                <div className="merchant-menu-image-preview">
                  <ImageIcon size={24} />
                  <img
                    key={form.hinhAnh}
                    src={form.hinhAnh}
                    alt="Xem trước món ăn"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <label className="merchant-menu-field">
                <span>Mô tả món ăn</span>
                <textarea
                  rows={4}
                  value={form.moTa}
                  maxLength={500}
                  placeholder="Mô tả thành phần hoặc hương vị..."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      moTa: event.target.value,
                    }))
                  }
                />
                <small>{form.moTa.length}/500 ký tự</small>
              </label>

              {error && <p className="merchant-menu-form-error">{error}</p>}
            </div>

            <footer className="merchant-menu-drawer-footer">
              <button
                type="button"
                className="cancel"
                onClick={closeEditor}
                disabled={saving}
              >
                Hủy
              </button>

              <button type="submit" className="save" disabled={saving}>
                <Save size={15} />
                {saving
                  ? "Đang lưu..."
                  : editingId === null
                    ? "Thêm món"
                    : "Lưu thay đổi"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {toppingMonId !== null && (
        <div
          className="merchant-topping-overlay"
          onMouseDown={closeToppingManager}
        >
          <section
            className="merchant-topping-dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="merchant-topping-header">
              <div>
                <span>THIẾT LẬP TÙY CHỌN</span>
                <h2>Nhóm topping</h2>
                <p>{monChiTiet?.tenMonAn || "Đang tải thông tin món..."}</p>
              </div>

              <button
                type="button"
                aria-label="Đóng"
                onClick={closeToppingManager}
                disabled={loadingTopping}
              >
                <X size={18} />
              </button>
            </header>

            <div className="merchant-topping-body">
              {loadingTopping && !monChiTiet ? (
                <div className="merchant-topping-loading">
                  Đang tải nhóm topping...
                </div>
              ) : nhomToppings.length === 0 ? (
                <div className="merchant-topping-empty">
                  Chưa có nhóm topping. Hãy tạo nhóm topping trước.
                </div>
              ) : (
                <div className="merchant-topping-list">
                  {nhomToppings.map((group) => {
                    const assigned = isGroupAssigned(group.maNhomTopping);

                    return (
                      <label
                        key={group.maNhomTopping}
                        className={`merchant-topping-row ${
                          assigned ? "selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={assigned}
                          disabled={loadingTopping}
                          onChange={() => void handleToggleGroup(group)}
                        />

                        <span className="merchant-topping-check" />

                        <div>
                          <strong>{group.tenNhom}</strong>
                          <p>
                            {group.batBuocChon ? "Bắt buộc chọn" : "Tùy chọn"}
                            {group.chonToiDa
                              ? ` · Tối đa ${group.chonToiDa}`
                              : ""}
                          </p>
                        </div>

                        <em>{assigned ? "Đã gán" : "Chưa gán"}</em>
                      </label>
                    );
                  })}
                </div>
              )}

              {error && <p className="merchant-menu-form-error">{error}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenu;
