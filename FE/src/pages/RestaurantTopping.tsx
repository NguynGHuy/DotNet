import { useEffect, useState } from "react";

import {
    createNhomTopping,
    createTopping,
    deleteNhomTopping,
    deleteTopping,
    getNhomToppings,
    getToppings,
    updateNhomTopping,
    updateTopping,
    updateTrangThaiTopping,
    type NhomTopping,
    type Topping,
} from "../services/toppingService";

import { getCurrentUser } from "../services/userService";

interface CurrentUser {
    nhaHang?: {
        maNhaHang: number;
    };
}

function RestaurantTopping() {
    const [nhomToppings, setNhomToppings] =
        useState<NhomTopping[]>([]);

    const [toppings, setToppings] =
        useState<Topping[]>([]);

    const [selectedNhom, setSelectedNhom] =
        useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadingToppings, setLoadingToppings] =
        useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showGroupForm, setShowGroupForm] =
        useState(false);

    const [groupName, setGroupName] = useState("");
    const [groupRequired, setGroupRequired] =
        useState(false);
    const [groupMax, setGroupMax] =
        useState<number | null>(1);

    const [editGroupId, setEditGroupId] =
        useState<number | null>(null);

    const [editGroupName, setEditGroupName] =
        useState("");
    const [editGroupRequired, setEditGroupRequired] =
        useState(false);
    const [editGroupMax, setEditGroupMax] =
        useState<number | null>(1);

    const [showToppingForm, setShowToppingForm] =
        useState(false);

    const [toppingName, setToppingName] =
        useState("");
    const [toppingPrice, setToppingPrice] =
        useState(0);

    const [editToppingId, setEditToppingId] =
        useState<number | null>(null);

    const [editToppingName, setEditToppingName] =
        useState("");
    const [editToppingPrice, setEditToppingPrice] =
        useState(0);

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

    const loadToppings = async (
        maNhomTopping: number
    ) => {
        try {
            setLoadingToppings(true);

            const data = await getToppings(
                maNhomTopping
            );

            setToppings(data);
        } catch (err) {
            console.error("Lỗi tải topping:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải topping."
            );
        } finally {
            setLoadingToppings(false);
        }
    };

    const loadGroups = async (
        preferredGroupId?: number
    ) => {
        try {
            setLoading(true);
            setError("");

            const maNhaHang = await getRestaurantId();

            const data = await getNhomToppings(
                maNhaHang
            );

            setNhomToppings(data);

            if (data.length === 0) {
                setSelectedNhom(null);
                setToppings([]);
                return;
            }

            const nextSelected =
                preferredGroupId &&
                data.some(
                    (group) =>
                        group.maNhomTopping ===
                        preferredGroupId
                )
                    ? preferredGroupId
                    : selectedNhom &&
                        data.some(
                            (group) =>
                                group.maNhomTopping ===
                                selectedNhom
                        )
                      ? selectedNhom
                      : data[0].maNhomTopping;

            setSelectedNhom(nextSelected);

            await loadToppings(nextSelected);
        } catch (err) {
            console.error(
                "Lỗi tải nhóm topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải nhóm topping."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const handleSelectGroup = async (
        id: number
    ) => {
        setSelectedNhom(id);

        setEditToppingId(null);
        setShowToppingForm(false);

        await loadToppings(id);
    };

    const resetCreateGroup = () => {
        setGroupName("");
        setGroupRequired(false);
        setGroupMax(1);
        setShowGroupForm(false);
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setError(
                "Vui lòng nhập tên nhóm topping."
            );
            return;
        }

        if (
            groupMax !== null &&
            groupMax <= 0
        ) {
            setError(
                "Số lựa chọn tối đa phải lớn hơn 0."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await createNhomTopping({
                tenNhom: groupName.trim(),
                batBuocChon: groupRequired,
                chonToiDa: groupMax,
            });

            resetCreateGroup();

            setSuccess(
                "Thêm nhóm topping thành công."
            );

            await loadGroups();
        } catch (err) {
            console.error(
                "Lỗi tạo nhóm topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tạo nhóm topping."
            );
        } finally {
            setSaving(false);
        }
    };

    const startEditGroup = (
        group: NhomTopping
    ) => {
        setEditGroupId(group.maNhomTopping);
        setEditGroupName(group.tenNhom);
        setEditGroupRequired(group.batBuocChon);
        setEditGroupMax(group.chonToiDa);

        setShowGroupForm(false);
        setError("");
        setSuccess("");
    };

    const resetEditGroup = () => {
        setEditGroupId(null);
        setEditGroupName("");
        setEditGroupRequired(false);
        setEditGroupMax(1);
    };

    const handleUpdateGroup = async () => {
        if (editGroupId === null) {
            return;
        }

        if (!editGroupName.trim()) {
            setError(
                "Tên nhóm topping không được để trống."
            );
            return;
        }

        if (
            editGroupMax !== null &&
            editGroupMax <= 0
        ) {
            setError(
                "Số lựa chọn tối đa phải lớn hơn 0."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await updateNhomTopping(
                editGroupId,
                {
                    tenNhom:
                        editGroupName.trim(),
                    batBuocChon:
                        editGroupRequired,
                    chonToiDa: editGroupMax,
                }
            );

            resetEditGroup();

            setSuccess(
                "Cập nhật nhóm topping thành công."
            );

            await loadGroups(editGroupId);
        } catch (err) {
            console.error(
                "Lỗi cập nhật nhóm:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật nhóm topping."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroup = async (
        group: NhomTopping
    ) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa nhóm "${group.tenNhom}" không?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await deleteNhomTopping(
                group.maNhomTopping
            );

            setSuccess(
                "Xóa nhóm topping thành công."
            );

            if (
                editGroupId ===
                group.maNhomTopping
            ) {
                resetEditGroup();
            }

            await loadGroups();
        } catch (err) {
            console.error(
                "Lỗi xóa nhóm topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa nhóm topping."
            );
        }
    };

    const resetCreateTopping = () => {
        setToppingName("");
        setToppingPrice(0);
        setShowToppingForm(false);
    };

    const handleCreateTopping = async () => {
        if (selectedNhom === null) {
            setError(
                "Vui lòng chọn nhóm topping."
            );
            return;
        }

        if (!toppingName.trim()) {
            setError(
                "Vui lòng nhập tên topping."
            );
            return;
        }

        if (toppingPrice < 0) {
            setError(
                "Giá topping không được nhỏ hơn 0."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await createTopping({
                maNhomTopping: selectedNhom,
                tenTopping: toppingName.trim(),
                giaThem: toppingPrice,
            });

            resetCreateTopping();

            setSuccess(
                "Thêm topping thành công."
            );

            await loadToppings(selectedNhom);
        } catch (err) {
            console.error(
                "Lỗi tạo topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tạo topping."
            );
        } finally {
            setSaving(false);
        }
    };

    const startEditTopping = (
        item: Topping
    ) => {
        setEditToppingId(item.maTopping);
        setEditToppingName(item.tenTopping);
        setEditToppingPrice(item.giaThem);

        setShowToppingForm(false);

        setError("");
        setSuccess("");
    };

    const resetEditTopping = () => {
        setEditToppingId(null);
        setEditToppingName("");
        setEditToppingPrice(0);
    };

    const handleUpdateTopping = async () => {
        if (
            editToppingId === null ||
            selectedNhom === null
        ) {
            return;
        }

        if (!editToppingName.trim()) {
            setError(
                "Tên topping không được để trống."
            );
            return;
        }

        if (editToppingPrice < 0) {
            setError(
                "Giá topping không được nhỏ hơn 0."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await updateTopping(
                editToppingId,
                {
                    tenTopping:
                        editToppingName.trim(),
                    giaThem:
                        editToppingPrice,
                }
            );

            resetEditTopping();

            setSuccess(
                "Cập nhật topping thành công."
            );

            await loadToppings(selectedNhom);
        } catch (err) {
            console.error(
                "Lỗi cập nhật topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật topping."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleToggleTopping = async (
        item: Topping
    ) => {
        if (selectedNhom === null) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await updateTrangThaiTopping(
                item.maTopping,
                !item.trangThai
            );

            setSuccess(
                item.trangThai
                    ? "Đã tắt topping."
                    : "Đã bật topping."
            );

            await loadToppings(selectedNhom);
        } catch (err) {
            console.error(
                "Lỗi đổi trạng thái topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể thay đổi trạng thái topping."
            );
        }
    };

    const handleDeleteTopping = async (
        item: Topping
    ) => {
        if (selectedNhom === null) {
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa topping "${item.tenTopping}" không?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await deleteTopping(item.maTopping);

            setSuccess(
                "Xóa topping thành công."
            );

            if (
                editToppingId ===
                item.maTopping
            ) {
                resetEditTopping();
            }

            await loadToppings(selectedNhom);
        } catch (err) {
            console.error(
                "Lỗi xóa topping:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa topping."
            );
        }
    };

    const formatMoney = (value: number) =>
        `${Number(value || 0).toLocaleString(
            "vi-VN"
        )} đ`;

    if (loading) {
        return (
            <div className="quan-page-loading">
                Đang tải topping...
            </div>
        );
    }

    return (
        <div className="quan-dashboard">
            <div className="quan-page-title">
                <div>
                    <h1>Topping</h1>
                    <p>
                        Quản lý nhóm topping và các lựa
                        chọn của nhà hàng.
                    </p>
                </div>

                <button
                    type="button"
                    className="quan-primary-button"
                    onClick={() => {
                        setShowGroupForm(
                            (prev) => !prev
                        );

                        resetEditGroup();
                    }}
                >
                    {showGroupForm
                        ? "Đóng"
                        : "+ Thêm nhóm"}
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

            {showGroupForm && (
                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>Thêm nhóm topping</h2>
                        </div>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Tên nhóm</label>

                            <input
                                value={groupName}
                                placeholder="Ví dụ: Chọn size"
                                onChange={(e) =>
                                    setGroupName(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>
                                Số lựa chọn tối đa
                            </label>

                            <input
                                type="number"
                                min={1}
                                value={
                                    groupMax ?? ""
                                }
                                onChange={(e) =>
                                    setGroupMax(
                                        e.target.value ===
                                            ""
                                            ? null
                                            : Number(
                                                  e.target
                                                      .value
                                              )
                                    )
                                }
                            />
                        </div>

                        <div className="quan-form-group quan-form-full">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={
                                        groupRequired
                                    }
                                    onChange={(e) =>
                                        setGroupRequired(
                                            e.target
                                                .checked
                                        )
                                    }
                                />
                                {" "}
                                Khách bắt buộc phải chọn
                                topping trong nhóm này
                            </label>
                        </div>
                    </div>

                    <div className="quan-form-actions">
                        <button
                            type="button"
                            className="quan-secondary-button"
                            onClick={resetCreateGroup}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="quan-primary-button"
                            onClick={handleCreateGroup}
                            disabled={saving}
                        >
                            {saving
                                ? "Đang lưu..."
                                : "Thêm nhóm"}
                        </button>
                    </div>
                </div>
            )}

            {editGroupId !== null && (
                <div className="quan-section">
                    <div className="quan-section-header">
                        <h2>Sửa nhóm topping</h2>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Tên nhóm</label>

                            <input
                                value={editGroupName}
                                onChange={(e) =>
                                    setEditGroupName(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>
                                Số lựa chọn tối đa
                            </label>

                            <input
                                type="number"
                                min={1}
                                value={
                                    editGroupMax ?? ""
                                }
                                onChange={(e) =>
                                    setEditGroupMax(
                                        e.target.value ===
                                            ""
                                            ? null
                                            : Number(
                                                  e.target
                                                      .value
                                              )
                                    )
                                }
                            />
                        </div>

                        <div className="quan-form-group quan-form-full">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={
                                        editGroupRequired
                                    }
                                    onChange={(e) =>
                                        setEditGroupRequired(
                                            e.target
                                                .checked
                                        )
                                    }
                                />
                                {" "}
                                Bắt buộc chọn
                            </label>
                        </div>
                    </div>

                    <div className="quan-form-actions">
                        <button
                            type="button"
                            className="quan-secondary-button"
                            onClick={resetEditGroup}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="quan-primary-button"
                            onClick={handleUpdateGroup}
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            )}

            <div className="quan-section">
                <div className="quan-section-header">
                    <div>
                        <h2>Nhóm topping</h2>
                        <p>
                            Chọn một nhóm để quản lý các
                            topping bên trong.
                        </p>
                    </div>
                </div>

                {nhomToppings.length === 0 ? (
                    <div className="quan-placeholder">
                        Chưa có nhóm topping.
                    </div>
                ) : (
                    <div className="quan-management-list">
                        {nhomToppings.map(
                            (group) => (
                                <div
                                    key={
                                        group.maNhomTopping
                                    }
                                    className={`quan-management-item ${
                                        selectedNhom ===
                                        group.maNhomTopping
                                            ? "is-selected"
                                            : ""
                                    }`}
                                >
                                    <div>
                                        <strong>
                                            {group.tenNhom}
                                        </strong>

                                        <p>
                                            {group.batBuocChon
                                                ? "Bắt buộc"
                                                : "Tùy chọn"}

                                            {" · "}

                                            {group.chonToiDa
                                                ? `Tối đa ${group.chonToiDa} lựa chọn`
                                                : "Không giới hạn"}
                                        </p>
                                    </div>

                                    <div className="quan-management-actions">
                                        <button
                                            type="button"
                                            className="quan-primary-button"
                                            onClick={() =>
                                                handleSelectGroup(
                                                    group.maNhomTopping
                                                )
                                            }
                                        >
                                            Chọn
                                        </button>

                                        <button
                                            type="button"
                                            className="quan-secondary-button"
                                            onClick={() =>
                                                startEditGroup(
                                                    group
                                                )
                                            }
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            type="button"
                                            className="quan-danger-button"
                                            onClick={() =>
                                                handleDeleteGroup(
                                                    group
                                                )
                                            }
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {selectedNhom !== null && (
                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>
                                Danh sách topping
                            </h2>

                            <p>
                                {nhomToppings.find(
                                    (group) =>
                                        group.maNhomTopping ===
                                        selectedNhom
                                )?.tenNhom ??
                                    "Nhóm topping"}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="quan-primary-button"
                            onClick={() => {
                                setShowToppingForm(
                                    (prev) => !prev
                                );

                                resetEditTopping();
                            }}
                        >
                            + Thêm topping
                        </button>
                    </div>

                    {showToppingForm && (
                        <div className="quan-inline-form">
                            <div className="quan-form-grid">
                                <div className="quan-form-group">
                                    <label>
                                        Tên topping
                                    </label>

                                    <input
                                        value={
                                            toppingName
                                        }
                                        onChange={(e) =>
                                            setToppingName(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="quan-form-group">
                                    <label>
                                        Giá thêm
                                    </label>

                                    <input
                                        type="number"
                                        min={0}
                                        value={
                                            toppingPrice
                                        }
                                        onChange={(e) =>
                                            setToppingPrice(
                                                Number(
                                                    e.target
                                                        .value
                                                )
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="quan-form-actions">
                                <button
                                    className="quan-secondary-button"
                                    onClick={
                                        resetCreateTopping
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    className="quan-primary-button"
                                    onClick={
                                        handleCreateTopping
                                    }
                                >
                                    Thêm topping
                                </button>
                            </div>
                        </div>
                    )}

                    {editToppingId !== null && (
                        <div className="quan-inline-form">
                            <div className="quan-form-grid">
                                <div className="quan-form-group">
                                    <label>
                                        Tên topping
                                    </label>

                                    <input
                                        value={
                                            editToppingName
                                        }
                                        onChange={(e) =>
                                            setEditToppingName(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="quan-form-group">
                                    <label>
                                        Giá thêm
                                    </label>

                                    <input
                                        type="number"
                                        min={0}
                                        value={
                                            editToppingPrice
                                        }
                                        onChange={(e) =>
                                            setEditToppingPrice(
                                                Number(
                                                    e.target
                                                        .value
                                                )
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="quan-form-actions">
                                <button
                                    className="quan-secondary-button"
                                    onClick={
                                        resetEditTopping
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    className="quan-primary-button"
                                    onClick={
                                        handleUpdateTopping
                                    }
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    )}

                    {loadingToppings ? (
                        <p>Đang tải topping...</p>
                    ) : toppings.length === 0 ? (
                        <div className="quan-placeholder">
                            Chưa có topping trong nhóm
                            này.
                        </div>
                    ) : (
                        <div className="quan-management-list">
                            {toppings.map((item) => (
                                <div
                                    key={
                                        item.maTopping
                                    }
                                    className="quan-management-item"
                                >
                                    <div>
                                        <strong>
                                            {
                                                item.tenTopping
                                            }
                                        </strong>

                                        <p>
                                            {formatMoney(
                                                item.giaThem
                                            )}
                                            {" · "}
                                            {item.trangThai
                                                ? "Đang bán"
                                                : "Đã tắt"}
                                        </p>
                                    </div>

                                    <div className="quan-management-actions">
                                        <button
                                            className="quan-secondary-button"
                                            onClick={() =>
                                                startEditTopping(
                                                    item
                                                )
                                            }
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            className={
                                                item.trangThai
                                                    ? "quan-secondary-button"
                                                    : "quan-primary-button"
                                            }
                                            onClick={() =>
                                                handleToggleTopping(
                                                    item
                                                )
                                            }
                                        >
                                            {item.trangThai
                                                ? "Tắt"
                                                : "Bật"}
                                        </button>

                                        <button
                                            className="quan-danger-button"
                                            onClick={() =>
                                                handleDeleteTopping(
                                                    item
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
            )}
        </div>
    );
}

export default RestaurantTopping;