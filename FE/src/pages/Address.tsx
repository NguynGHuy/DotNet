import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    getAddresses,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
} from "../services/addressService";

import type {
    Address,
    AddressRequest,
} from "../services/addressService";

function AddressPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState<AddressRequest>({
        tenNguoiNhan: "",
        soDienThoaiNhan: "",
        diaChiCuThe: "",
        ghiChu: "",
        macDinh: false,
    });

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAddresses();

            console.log("Danh sách địa chỉ:", data);

            setAddresses(data);
        } catch (error) {
            console.error("ADDRESS ERROR:", error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Không thể tải danh sách địa chỉ.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        }));
    };

    const handleSetDefault = async (id: number) => {
        try {
            setError("");

            await setDefaultAddress(id);

            alert("Đã đặt địa chỉ làm mặc định.");

            await loadAddresses();
        } catch (error) {
            console.error("SET DEFAULT ADDRESS ERROR:", error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Không thể đặt địa chỉ mặc định.");
            }
        }
    };
    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
            "Bạn có chắc muốn xóa địa chỉ này không?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await deleteAddress(id);

            alert("Xóa địa chỉ thành công.");

            await loadAddresses();
        } catch (error) {
            console.error("DELETE ADDRESS ERROR:", error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Không thể xóa địa chỉ.");
            }
        }
    };
    const handleEdit = (address: Address) => {
        setEditingId(address.maDiaChi);

        setForm({
            tenNguoiNhan: address.tenNguoiNhan,
            soDienThoaiNhan: address.soDienThoaiNhan,
            diaChiCuThe: address.diaChiCuThe,
            ghiChu: address.ghiChu || "",
            macDinh: address.macDinh,
        });

        setShowForm(true);
        setError("");
    };
    const handleSave = async () => {
        setError("");

        if (!form.tenNguoiNhan.trim()) {
            setError("Vui lòng nhập tên người nhận.");
            return;
        }

        if (!form.soDienThoaiNhan.trim()) {
            setError("Vui lòng nhập số điện thoại.");
            return;
        }

        if (!/^[0-9]{10,11}$/.test(form.soDienThoaiNhan.trim())) {
            setError("Số điện thoại phải có 10-11 chữ số.");
            return;
        }

        if (!form.diaChiCuThe.trim()) {
            setError("Vui lòng nhập địa chỉ cụ thể.");
            return;
        }

        try {
            setSaving(true);

            const request: AddressRequest = {
                ...form,
                tenNguoiNhan: form.tenNguoiNhan.trim(),
                soDienThoaiNhan: form.soDienThoaiNhan.trim(),
                diaChiCuThe: form.diaChiCuThe.trim(),
                ghiChu: form.ghiChu?.trim() || null,
            };

            if (editingId !== null) {
                await updateAddress(editingId, request);

                alert("Cập nhật địa chỉ thành công.");
            } else {
                await createAddress(request);

                alert("Thêm địa chỉ thành công.");
            }

            setForm({
                tenNguoiNhan: "",
                soDienThoaiNhan: "",
                diaChiCuThe: "",
                ghiChu: "",
                macDinh: false,
            });

            setEditingId(null);
            setShowForm(false);

            await loadAddresses();
        } catch (error) {
            console.error("SAVE ADDRESS ERROR:", error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    editingId !== null
                        ? "Không thể cập nhật địa chỉ."
                        : "Không thể thêm địa chỉ."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className= "address-page" >
        <div className="address-container" >

            <div className="address-header" >
                <div>
                <h2>Địa chỉ giao hàng </h2>
                    < p > Quản lý địa chỉ nhận hàng của bạn </p>
                        </div>

                        < button onClick = {() => setShowForm(true)
}>
    + Thêm địa chỉ
        </button>
        </div>

{
    error && (
        <p className="auth-error" >
        { error }
            </p>
        )
}

{
    showForm && (
        <div className="address-form" >
        <h3>
            { editingId !== null
            ? "Sửa địa chỉ"
            : "Thêm địa chỉ mới"
            }
        </h3>

                < div className = "form-group" >
                    <label>Tên người nhận </label>

                        < input
    type = "text"
    name = "tenNguoiNhan"
    placeholder = "Nhập tên người nhận"
    value = { form.tenNguoiNhan }
    onChange = { handleChange }
        />
        </div>

        < div className = "form-group" >
            <label>Số điện thoại </label>

                < input
    type = "text"
    name = "soDienThoaiNhan"
    placeholder = "Nhập số điện thoại"
    value = { form.soDienThoaiNhan }
    onChange = { handleChange }
        />
        </div>

        < div className = "form-group" >
            <label>Địa chỉ cụ thể </label>

                < input
    type = "text"
    name = "diaChiCuThe"
    placeholder = "Số nhà, đường, phường/xã..."
    value = { form.diaChiCuThe }
    onChange = { handleChange }
        />
        </div>

        < div className = "form-group" >
            <label>Ghi chú </label>

                < textarea
    name = "ghiChu"
    placeholder = "Ví dụ: Giao giờ hành chính..."
    value = { form.ghiChu || "" }
    onChange = { handleChange }
        />
        </div>

        < label className = "checkbox-row" >
            <input
                type="checkbox"
    name = "macDinh"
    checked = { form.macDinh }
    onChange = { handleChange }
        />

        <span>Đặt làm địa chỉ mặc định </span>
            </label>

            < div className = "address-form-actions" >
                <button
                type="button"
onClick = {() => {
    setShowForm(false);
    setEditingId(null);
    setError("");

    setForm({
        tenNguoiNhan: "",
        soDienThoaiNhan: "",
        diaChiCuThe: "",
        ghiChu: "",
        macDinh: false,
    });
}}
              >
    Hủy
    </button>

    < button
type = "button"
onClick = { handleSave }
disabled = { saving }
    >
{
    saving
    ? "Đang lưu..."
        : editingId !== null
            ? "Cập nhật địa chỉ"
            : "Lưu địa chỉ"
}
    </button>
    </div>
    </div>
        )}

{
    addresses.length === 0 ? (
        <div className= "empty-address" >
        <p>Bạn chưa có địa chỉ giao hàng.</p>

    {
        !showForm && (
            <button onClick={ () => setShowForm(true) }>
                + Thêm địa chỉ
                    </button>
            )
    }
    </div>
        ) : (
        <div className= "address-list" >
        {
            addresses.map((address) => (
                <div
                className= "address-card"
                key = { address.maDiaChi }
                >
                <div className="address-card-header" >
                <div>
                <strong>{ address.tenNguoiNhan } </strong>
                < span > { address.soDienThoaiNhan } </span>
            </div>

                  {
                    address.macDinh && (
                        <span className="default-badge">
                            Mặc định
                        </ span >
                  )
        }
        </div>

        < p className = "address-text" >
        { address.diaChiCuThe }
            </p>

    {
        address.ghiChu && (
            <p className="address-note" >
                Ghi chú: { address.ghiChu }
        </p>
                )
    }

    <div className="address-actions" >
        {!address.macDinh && (
            <button
                      onClick={
        () =>
            handleSetDefault(address.maDiaChi)
    }
                    >
        Đặt mặc định
            </button>
                  )
}

<button onClick={ () => handleEdit(address) }>
    Sửa
    </button>

    < button
        onClick = {() => handleDelete(address.maDiaChi)} >Xóa
   </button>
    </div>
    </div>
            ))}
</div>
        )}

<div className="address-back" >
    <Link to="/ho-so" >
            ← Quay lại hồ sơ
    </Link>
    </div>

    </div>
    </main>
  );
}

export default AddressPage;