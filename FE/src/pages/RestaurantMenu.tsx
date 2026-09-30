import { useEffect, useState } from "react";

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

import {
    getDanhMucs,
    type DanhMuc,
} from "../services/categoryService";

import {
    getNhomToppings,
    type NhomTopping,
} from "../services/toppingService";

import { getCurrentUser } from "../services/userService";

interface CurrentUser {
    nhaHang?: {
        maNhaHang: number;
    };
}

interface MonForm {
    maDanhMuc: number;
    tenMonAn: string;
    moTa: string;
    gia: number;
    hinhAnh: string;
}

const EMPTY_FORM: MonForm = {
    maDanhMuc: 0,
    tenMonAn: "",
    moTa: "",
    gia: 0,
    hinhAnh: "",
};

function RestaurantMenu() {
    const [monAns, setMonAns] = useState<MonAn[]>([]);
    const [danhMucs, setDanhMucs] = useState<DanhMuc[]>([]);
    const [nhomToppings, setNhomToppings] =
        useState<NhomTopping[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [createForm, setCreateForm] =
        useState<MonForm>(EMPTY_FORM);

    const [editId, setEditId] =
        useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<MonForm>(EMPTY_FORM);

    const [toppingMonId, setToppingMonId] =
        useState<number | null>(null);

    const [monChiTiet, setMonChiTiet] =
        useState<MonAnChiTiet | null>(null);

    const [loadingTopping, setLoadingTopping] =
        useState(false);

    const getRestaurantId = async () => {
        const user = (await getCurrentUser()) as CurrentUser;

        const maNhaHang = user.nhaHang?.maNhaHang;

        if (!maNhaHang) {
            throw new Error(
                "Không tìm thấy thông tin nhà hàng."
            );
        }

        return maNhaHang;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const maNhaHang = await getRestaurantId();

            const [menuData, categoryData, toppingData] =
                await Promise.all([
                    getMonAns(maNhaHang),
                    getDanhMucs(maNhaHang),
                    getNhomToppings(maNhaHang),
                ]);

            setMonAns(menuData);
            setDanhMucs(categoryData);
            setNhomToppings(toppingData);
        } catch (err) {
            console.error("Lỗi tải thực đơn:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải thực đơn."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetCreateForm = () => {
        setCreateForm(EMPTY_FORM);
        setShowCreateForm(false);
    };

    const resetEditForm = () => {
        setEditId(null);
        setEditForm(EMPTY_FORM);
    };

    const handleCreate = async () => {
        if (createForm.maDanhMuc <= 0) {
            setError("Vui lòng chọn danh mục.");
            return;
        }

        if (!createForm.tenMonAn.trim()) {
            setError("Vui lòng nhập tên món ăn.");
            return;
        }

        if (createForm.gia <= 0) {
            setError("Giá món phải lớn hơn 0.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await createMonAn({
                maDanhMuc: createForm.maDanhMuc,
                tenMonAn: createForm.tenMonAn.trim(),
                moTa:
                    createForm.moTa.trim() || null,
                gia: createForm.gia,
                hinhAnh:
                    createForm.hinhAnh.trim() || null,
            });

            resetCreateForm();

            setSuccess("Thêm món ăn thành công.");

            await loadData();
        } catch (err) {
            console.error("Lỗi tạo món:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tạo món ăn."
            );
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (item: MonAn) => {
        setEditId(item.maMonAn);

        setEditForm({
            maDanhMuc: item.maDanhMuc,
            tenMonAn: item.tenMonAn,
            moTa: item.moTa ?? "",
            gia: item.gia,
            hinhAnh: item.hinhAnh ?? "",
        });

        setShowCreateForm(false);
        setError("");
        setSuccess("");
    };

    const handleUpdate = async () => {
        if (editId === null) {
            return;
        }

        if (editForm.maDanhMuc <= 0) {
            setError("Vui lòng chọn danh mục.");
            return;
        }

        if (!editForm.tenMonAn.trim()) {
            setError("Tên món không được để trống.");
            return;
        }

        if (editForm.gia <= 0) {
            setError("Giá món phải lớn hơn 0.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await updateMonAn(editId, {
                maDanhMuc: editForm.maDanhMuc,
                tenMonAn: editForm.tenMonAn.trim(),
                moTa: editForm.moTa.trim() || null,
                gia: editForm.gia,
                hinhAnh:
                    editForm.hinhAnh.trim() || null,
            });

            resetEditForm();

            setSuccess("Cập nhật món ăn thành công.");

            await loadData();
        } catch (err) {
            console.error("Lỗi cập nhật món:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật món ăn."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (item: MonAn) => {
        try {
            setError("");
            setSuccess("");

            await updateTrangThaiMonAn(
                item.maMonAn,
                !item.trangThai
            );

            setSuccess(
                item.trangThai
                    ? "Đã tắt bán món ăn."
                    : "Đã bật bán món ăn."
            );

            await loadData();
        } catch (err) {
            console.error(
                "Lỗi đổi trạng thái món:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể thay đổi trạng thái món."
            );
        }
    };

    const handleDelete = async (item: MonAn) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa món "${item.tenMonAn}" không?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await deleteMonAn(item.maMonAn);

            setSuccess("Xóa món ăn thành công.");

            if (editId === item.maMonAn) {
                resetEditForm();
            }

            if (toppingMonId === item.maMonAn) {
                setToppingMonId(null);
                setMonChiTiet(null);
            }

            await loadData();
        } catch (err) {
            console.error("Lỗi xóa món:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa món ăn."
            );
        }
    };

    const openToppingManager = async (
        item: MonAn
    ) => {
        try {
            setLoadingTopping(true);
            setError("");
            setSuccess("");

            const detail = await getMonAn(
                item.maMonAn
            );

            setToppingMonId(item.maMonAn);
            setMonChiTiet(detail);
        } catch (err) {
            console.error(
                "Lỗi tải topping của món:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải nhóm topping của món."
            );
        } finally {
            setLoadingTopping(false);
        }
    };

    const isGroupAssigned = (
        maNhomTopping: number
    ) => {
        return (
            monChiTiet?.nhomToppings.some(
                (group) =>
                    group.maNhomTopping ===
                    maNhomTopping
            ) ?? false
        );
    };

    const reloadCurrentDish = async () => {
        if (toppingMonId === null) {
            return;
        }

        const detail = await getMonAn(
            toppingMonId
        );

        setMonChiTiet(detail);
    };

    const handleToggleGroup = async (
        group: NhomTopping
    ) => {
        if (toppingMonId === null) {
            return;
        }

        try {
            setLoadingTopping(true);
            setError("");
            setSuccess("");

            if (
                isGroupAssigned(
                    group.maNhomTopping
                )
            ) {
                await goTopping(
                    toppingMonId,
                    group.maNhomTopping
                );

                setSuccess(
                    `Đã gỡ nhóm "${group.tenNhom}" khỏi món.`
                );
            } else {
                await ganTopping(
                    toppingMonId,
                    group.maNhomTopping
                );

                setSuccess(
                    `Đã gán nhóm "${group.tenNhom}" vào món.`
                );
            }

            await reloadCurrentDish();
        } catch (err) {
            console.error(
                "Lỗi gán nhóm topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật nhóm topping."
            );
        } finally {
            setLoadingTopping(false);
        }
    };

    const formatMoney = (value: number) =>
        `${Number(value || 0).toLocaleString(
            "vi-VN"
        )} đ`;

    if (loading) {
        return (
            <div className="quan-page-loading">
                Đang tải thực đơn...
            </div>
        );
    }

    return (
        <div className="quan-dashboard">
            <div className="quan-page-title">
                <div>
                    <h1>Thực đơn</h1>
                    <p>
                        Quản lý món ăn, giá bán, trạng thái
                        và nhóm topping.
                    </p>
                </div>

                <button
                    type="button"
                    className="quan-primary-button"
                    onClick={() => {
                        setShowCreateForm(
                            (prev) => !prev
                        );

                        resetEditForm();

                        setError("");
                        setSuccess("");
                    }}
                >
                    {showCreateForm
                        ? "Đóng"
                        : "+ Thêm món"}
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
                            <h2>Thêm món ăn</h2>
                            <p>
                                Nhập thông tin món mới.
                            </p>
                        </div>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Danh mục</label>

                            <select
                                value={
                                    createForm.maDanhMuc
                                }
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        maDanhMuc: Number(
                                            e.target.value
                                        ),
                                    })
                                }
                            >
                                <option value={0}>
                                    -- Chọn danh mục --
                                </option>

                                {danhMucs.map((item) => (
                                    <option
                                        key={
                                            item.maDanhMuc
                                        }
                                        value={
                                            item.maDanhMuc
                                        }
                                    >
                                        {
                                            item.tenDanhMuc
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="quan-form-group">
                            <label>Tên món</label>

                            <input
                                value={
                                    createForm.tenMonAn
                                }
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        tenMonAn:
                                            e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>Giá bán</label>

                            <input
                                type="number"
                                min={0}
                                value={createForm.gia}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        gia: Number(
                                            e.target.value
                                        ),
                                    })
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>URL hình ảnh</label>

                            <input
                                value={
                                    createForm.hinhAnh
                                }
                                placeholder="https://..."
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        hinhAnh:
                                            e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="quan-form-group quan-form-full">
                            <label>Mô tả</label>

                            <textarea
                                value={createForm.moTa}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        moTa: e.target.value,
                                    })
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
                                : "Thêm món"}
                        </button>
                    </div>
                </div>
            )}

            {editId !== null && (
                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>Sửa món ăn</h2>
                            <p>
                                Cập nhật thông tin món.
                            </p>
                        </div>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Danh mục</label>

                            <select
                                value={
                                    editForm.maDanhMuc
                                }
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        maDanhMuc: Number(
                                            e.target.value
                                        ),
                                    })
                                }
                            >
                                {danhMucs.map((item) => (
                                    <option
                                        key={
                                            item.maDanhMuc
                                        }
                                        value={
                                            item.maDanhMuc
                                        }
                                    >
                                        {
                                            item.tenDanhMuc
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="quan-form-group">
                            <label>Tên món</label>

                            <input
                                value={
                                    editForm.tenMonAn
                                }
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        tenMonAn:
                                            e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>Giá bán</label>

                            <input
                                type="number"
                                min={0}
                                value={editForm.gia}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        gia: Number(
                                            e.target.value
                                        ),
                                    })
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>URL hình ảnh</label>

                            <input
                                value={
                                    editForm.hinhAnh
                                }
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        hinhAnh:
                                            e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="quan-form-group quan-form-full">
                            <label>Mô tả</label>

                            <textarea
                                value={editForm.moTa}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        moTa: e.target.value,
                                    })
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

            {toppingMonId !== null && (
                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>
                                Nhóm topping của món
                            </h2>

                            <p>
                                {monChiTiet
                                    ? monChiTiet.tenMonAn
                                    : "Đang tải..."}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="quan-secondary-button"
                            onClick={() => {
                                setToppingMonId(null);
                                setMonChiTiet(null);
                            }}
                        >
                            Đóng
                        </button>
                    </div>

                    {loadingTopping ? (
                        <p>Đang xử lý...</p>
                    ) : nhomToppings.length === 0 ? (
                        <div className="quan-placeholder">
                            <p>
                                Chưa có nhóm topping.
                                Hãy tạo nhóm topping trước.
                            </p>
                        </div>
                    ) : (
                        <div className="quan-management-list">
                            {nhomToppings.map(
                                (group) => {
                                    const assigned =
                                        isGroupAssigned(
                                            group.maNhomTopping
                                        );

                                    return (
                                        <div
                                            key={
                                                group.maNhomTopping
                                            }
                                            className="quan-management-item"
                                        >
                                            <div>
                                                <strong>
                                                    {
                                                        group.tenNhom
                                                    }
                                                </strong>

                                                <p>
                                                    {group.batBuocChon
                                                        ? "Bắt buộc chọn"
                                                        : "Tùy chọn"}

                                                    {group.chonToiDa
                                                        ? ` · Tối đa ${group.chonToiDa}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className={
                                                    assigned
                                                        ? "quan-secondary-button"
                                                        : "quan-primary-button"
                                                }
                                                onClick={() =>
                                                    handleToggleGroup(
                                                        group
                                                    )
                                                }
                                            >
                                                {assigned
                                                    ? "Gỡ khỏi món"
                                                    : "Gán vào món"}
                                            </button>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="quan-section">
                <div className="quan-section-header">
                    <div>
                        <h2>Danh sách món ăn</h2>
                        <p>
                            Hiện có {monAns.length} món.
                        </p>
                    </div>
                </div>

                {monAns.length === 0 ? (
                    <div className="quan-placeholder">
                        <div className="quan-empty-icon">
                            🍜
                        </div>

                        <h3>Chưa có món ăn</h3>

                        <p>
                            Hãy thêm món đầu tiên cho
                            thực đơn.
                        </p>
                    </div>
                ) : (
                    <div className="quan-management-list">
                        {monAns.map((item) => (
                            <div
                                key={item.maMonAn}
                                className="quan-management-item quan-menu-item"
                            >
                                <div className="quan-menu-info">
                                    {item.hinhAnh && (
                                        <img
                                            src={item.hinhAnh}
                                            alt={
                                                item.tenMonAn
                                            }
                                            className="quan-menu-image"
                                        />
                                    )}

                                    <div>
                                        <strong>
                                            {item.tenMonAn}
                                        </strong>

                                        <p>
                                            {
                                                item.tenDanhMuc
                                            }
                                            {" · "}
                                            {formatMoney(
                                                item.gia
                                            )}
                                        </p>

                                        <span
                                            className={
                                                item.trangThai
                                                    ? "quan-status-active"
                                                    : "quan-status-inactive"
                                            }
                                        >
                                            {item.trangThai
                                                ? "Đang bán"
                                                : "Đã tắt"}
                                        </span>
                                    </div>
                                </div>

                                <div className="quan-management-actions">
                                    <button
                                        type="button"
                                        className="quan-secondary-button"
                                        onClick={() =>
                                            openToppingManager(
                                                item
                                            )
                                        }
                                    >
                                        Topping
                                    </button>

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
                                        className={
                                            item.trangThai
                                                ? "quan-secondary-button"
                                                : "quan-primary-button"
                                        }
                                        onClick={() =>
                                            handleToggleStatus(
                                                item
                                            )
                                        }
                                    >
                                        {item.trangThai
                                            ? "Tắt bán"
                                            : "Bật bán"}
                                    </button>

                                    <button
                                        type="button"
                                        className="quan-danger-button"
                                        onClick={() =>
                                            handleDelete(item)
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

export default RestaurantMenu;