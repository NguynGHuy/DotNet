import { useEffect, useState } from "react";
import {
    createDanhMuc,
    deleteDanhMuc,
    getDanhMucs,
    updateDanhMuc,
    type DanhMuc,
} from "../services/categoryService";
import { getCurrentUser } from "../services/userService";

interface CurrentUser {
    nhaHang?: {
        maNhaHang: number;
    };
}

function RestaurantCategory() {
    const [danhMucs, setDanhMucs] = useState<DanhMuc[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);

    const [tenDanhMuc, setTenDanhMuc] = useState("");
    const [thuTuHienThi, setThuTuHienThi] = useState(0);

    const [editId, setEditId] = useState<number | null>(null);
    const [editTenDanhMuc, setEditTenDanhMuc] = useState("");
    const [editThuTuHienThi, setEditThuTuHienThi] = useState(0);

    const getRestaurantId = async () => {
        const user = (await getCurrentUser()) as CurrentUser;

        const maNhaHang = user.nhaHang?.maNhaHang;

        if (!maNhaHang) {
            throw new Error("Không tìm thấy thông tin nhà hàng.");
        }

        return maNhaHang;
    };

    const loadDanhMucs = async () => {
        try {
            setLoading(true);
            setError("");

            const maNhaHang = await getRestaurantId();

            const data = await getDanhMucs(maNhaHang);

            const sorted = [...data].sort(
                (a, b) =>
                    (a.thuTuHienThi ?? 0) -
                    (b.thuTuHienThi ?? 0)
            );

            setDanhMucs(sorted);
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải danh mục."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDanhMucs();
    }, []);

    const resetCreateForm = () => {
        setTenDanhMuc("");
        setThuTuHienThi(0);
        setShowCreateForm(false);
    };

    const resetEditForm = () => {
        setEditId(null);
        setEditTenDanhMuc("");
        setEditThuTuHienThi(0);
    };

    const handleCreate = async () => {
        if (!tenDanhMuc.trim()) {
            setError("Vui lòng nhập tên danh mục.");
            return;
        }

        if (thuTuHienThi < 0) {
            setError("Thứ tự hiển thị không được nhỏ hơn 0.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await createDanhMuc(
                tenDanhMuc.trim(),
                thuTuHienThi
            );

            resetCreateForm();

            setSuccess("Thêm danh mục thành công.");

            await loadDanhMucs();
        } catch (err) {
            console.error("Lỗi tạo danh mục:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tạo danh mục."
            );
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (item: DanhMuc) => {
        setEditId(item.maDanhMuc);
        setEditTenDanhMuc(item.tenDanhMuc);
        setEditThuTuHienThi(item.thuTuHienThi ?? 0);

        setError("");
        setSuccess("");
    };

    const handleUpdate = async () => {
        if (editId === null) {
            return;
        }

        if (!editTenDanhMuc.trim()) {
            setError("Tên danh mục không được để trống.");
            return;
        }

        if (editThuTuHienThi < 0) {
            setError("Thứ tự hiển thị không được nhỏ hơn 0.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await updateDanhMuc(
                editId,
                editTenDanhMuc.trim(),
                editThuTuHienThi
            );

            resetEditForm();

            setSuccess("Cập nhật danh mục thành công.");

            await loadDanhMucs();
        } catch (err) {
            console.error("Lỗi cập nhật danh mục:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật danh mục."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
            "Bạn có chắc muốn xóa danh mục này không?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await deleteDanhMuc(id);

            setSuccess("Xóa danh mục thành công.");

            if (editId === id) {
                resetEditForm();
            }

            await loadDanhMucs();
        } catch (err) {
            console.error("Lỗi xóa danh mục:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa danh mục."
            );
        }
    };

    if (loading) {
        return (
            <div className="quan-page-loading">
                Đang tải danh mục...
            </div>
        );
    }

    return (
        <div className="quan-dashboard">
            <div className="quan-page-title">
                <div>
                    <h1>Danh mục món ăn</h1>
                    <p>
                        Quản lý các danh mục hiển thị trong
                        thực đơn của nhà hàng.
                    </p>
                </div>

                <button
                    type="button"
                    className="quan-primary-button"
                    onClick={() => {
                        setShowCreateForm((prev) => !prev);
                        resetEditForm();
                        setError("");
                        setSuccess("");
                    }}
                >
                    {showCreateForm
                        ? "Đóng"
                        : "+ Thêm danh mục"}
                </button>
            </div>

            {error && (
                <div className="quan-error-message">
                    ✕ {error}
                </div>
            )}

            {success && (
                <div className="quan-success-message">
                    ✓ {success}
                </div>
            )}

            {showCreateForm && (
                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>Thêm danh mục</h2>
                            <p>
                                Tạo danh mục mới cho thực đơn.
                            </p>
                        </div>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Tên danh mục</label>

                            <input
                                type="text"
                                value={tenDanhMuc}
                                placeholder="Ví dụ: Trà sữa"
                                onChange={(e) =>
                                    setTenDanhMuc(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>Thứ tự hiển thị</label>

                            <input
                                type="number"
                                min={0}
                                value={thuTuHienThi}
                                onChange={(e) =>
                                    setThuTuHienThi(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="quan-form-actions">
                        <button
                            type="button"
                            className="quan-secondary-button"
                            onClick={resetCreateForm}
                            disabled={saving}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="quan-primary-button"
                            onClick={handleCreate}
                            disabled={saving}
                        >
                            {saving
                                ? "Đang lưu..."
                                : "Thêm danh mục"}
                        </button>
                    </div>
                </div>
            )}

            {editId !== null && (
                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>Sửa danh mục</h2>
                            <p>
                                Cập nhật tên và thứ tự hiển thị.
                            </p>
                        </div>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Tên danh mục</label>

                            <input
                                type="text"
                                value={editTenDanhMuc}
                                onChange={(e) =>
                                    setEditTenDanhMuc(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>Thứ tự hiển thị</label>

                            <input
                                type="number"
                                min={0}
                                value={editThuTuHienThi}
                                onChange={(e) =>
                                    setEditThuTuHienThi(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="quan-form-actions">
                        <button
                            type="button"
                            className="quan-secondary-button"
                            onClick={resetEditForm}
                            disabled={saving}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="quan-primary-button"
                            onClick={handleUpdate}
                            disabled={saving}
                        >
                            {saving
                                ? "Đang lưu..."
                                : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            )}

            <div className="quan-section">
                <div className="quan-section-header">
                    <div>
                        <h2>Danh sách danh mục</h2>
                        <p>
                            Hiện có {danhMucs.length} danh mục.
                        </p>
                    </div>
                </div>

                {danhMucs.length === 0 ? (
                    <div className="quan-placeholder">
                        <div className="quan-empty-icon">
                            📂
                        </div>

                        <h3>Chưa có danh mục</h3>

                        <p>
                            Hãy tạo danh mục đầu tiên cho
                            thực đơn.
                        </p>
                    </div>
                ) : (
                    <div className="quan-management-list">
                        {danhMucs.map((item) => (
                            <div
                                key={item.maDanhMuc}
                                className="quan-management-item"
                            >
                                <div>
                                    <strong>
                                        {item.tenDanhMuc}
                                    </strong>

                                    <p>
                                        Thứ tự hiển thị:{" "}
                                        {item.thuTuHienThi ?? 0}
                                    </p>
                                </div>

                                <div className="quan-management-actions">
                                    <button
                                        type="button"
                                        className="quan-secondary-button"
                                        onClick={() =>
                                            startEdit(item)
                                        }
                                    >
                                        Sửa
                                    </button>

                                    <button
                                        type="button"
                                        className="quan-danger-button"
                                        onClick={() =>
                                            handleDelete(
                                                item.maDanhMuc
                                            )
                                        }
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RestaurantCategory;