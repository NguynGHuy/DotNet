import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getCustomerProfile,
    updateCustomerProfile,
} from "../services/customerService";

import type { CustomerProfile } from "../services/customerService";

function Profile() {
    const [profile, setProfile] =
        useState<CustomerProfile | null>(null);

    const [hoTen, setHoTen] = useState("");
    const [ngaySinh, setNgaySinh] = useState("");
    const [gioiTinh, setGioiTinh] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getCustomerProfile();

            console.log("Hồ sơ khách hàng:", data);

            setProfile(data);

            setHoTen(data.hoTen || "");
            setNgaySinh(data.ngaySinh || "");
            setGioiTinh(data.gioiTinh || "");
        } catch (error) {
            console.error("PROFILE ERROR:", error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Không thể tải hồ sơ.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setError("");

        if (!hoTen.trim()) {
            setError("Vui lòng nhập họ tên.");
            return;
        }

        if (hoTen.trim().length < 2) {
            setError("Họ tên phải có ít nhất 2 ký tự.");
            return;
        }

        if (ngaySinh) {
            const selectedDate = new Date(ngaySinh);
            const today = new Date();

            if (selectedDate > today) {
                setError("Ngày sinh không thể ở tương lai.");
                return;
            }
        }

        try {
            setSaving(true);

            const data = await updateCustomerProfile({
                hoTen: hoTen.trim(),
                ngaySinh: ngaySinh || null,
                gioiTinh: gioiTinh || null,
            });

            console.log("Cập nhật hồ sơ:", data);

            alert("Cập nhật hồ sơ thành công!");

            await loadProfile();

            const updatedUser = {
                hoTen: hoTen.trim(),
            };

            window.dispatchEvent(
                new CustomEvent("profile-updated", {
                    detail: updatedUser,
                })
            );
        } catch (error) {
            console.error("UPDATE PROFILE ERROR:", error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Cập nhật hồ sơ thất bại.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className= "profile-page" >
            <div className="profile-loading" >
                <div className="loading-spinner" > </div>
                    < p > Đang tải hồ sơ...</p>
                        </div>
                        </main>
        );
    }

    if (!profile) {
        return (
            <main className= "profile-page" >
            <div className="profile-error" >
                <div>😕</div>

                    < h2 > Không tìm thấy hồ sơ </h2>

                        <p>
        {
            error ||
            "Không thể tải thông tin tài khoản của bạn."
        }
        </p>

            < Link to = "/" className = "profile-back-button" >
                        ← Về trang chủ
            </Link>
            </div>
            </main>
        );
    }

    const avatarName =
        profile.hoTen?.charAt(0).toUpperCase() || "U";

    return (
        <main className= "profile-page" >

        {/* BACK */ }
        < Link to = "/" className = "profile-back" >
                ← Về trang chủ
        </Link>

    {/* HEADER */ }
    <div className="profile-page-header" >
        <div>
        <h1>Hồ sơ cá nhân </h1>

            <p>
                        Quản lý thông tin tài khoản của bạn
        </p>
        </div>
        </div>

    {/* PROFILE CARD */ }
    <section className="profile-main-card" >

    {/* USER HEADER */ }
        < div className = "profile-user-header" >

            <div className="profile-avatar" >
            { avatarName }
                </div>

                < div className = "profile-user-text" >
                    <h2>{ profile.hoTen } </h2>

                    < p > { profile.email || "Chưa có email" } </p>
                    </div>

                    </div>

    {/* ACCOUNT INFO */ }
    <div className="profile-section" >

        <h3>Thông tin tài khoản </h3>

            < div className = "profile-info-grid" >

    {/*             <div className="profile-info-box" >
                    <span className="profile-info-icon" >
                                🆔
    </span>

        < div >
        <span className="profile-info-label" >
            Mã khách hàng
                </span>

                <strong>
    { profile.maKhachHang }
    </strong>
        </div>
        </div> */}

        < div className = "profile-info-box" >
            <span className="profile-info-icon" >
                                📧
    </span>

        < div >
        <span className="profile-info-label" >
            Email
            </span>

            <strong>
    { profile.email || "Chưa có" }
    </strong>
        </div>
        </div>

        < div className = "profile-info-box" >
            <span className="profile-info-icon" >
                                📱
    </span>

        < div >
        <span className="profile-info-label" >
            Số điện thoại
                </span>

                <strong>
    {
        profile.soDienThoai ||
        "Chưa có"
    }
    </strong>
        </div>
        </div>

        < div className = "profile-info-box" >
            <span className="profile-info-icon" >
                                ⭐
    </span>

        < div >
        <span className="profile-info-label" >
            Điểm tích lũy
                </span>

                < strong className = "profile-points" >
                { profile.diemTichLuy } điểm
                    </strong>
                    </div>
                    </div>

                    </div>

                    </div>

                    < div className = "profile-divider" > </div>

    {/* PERSONAL INFO */ }
    <div className="profile-section" >

        <h3>Thông tin cá nhân </h3>

            < div className = "profile-form-grid" >

            {/* NAME */ }
                < div className = "profile-form-group full" >
                    <label>Họ và tên </label>

                        < input
    type = "text"
    value = { hoTen }
    onChange = {(e) =>
    setHoTen(e.target.value)
}
placeholder = "Nhập họ và tên"
    />
    </div>

{/* DATE */ }
<div className="profile-form-group" >

    <label>Ngày sinh </label>

        < input
type = "date"
value = { ngaySinh }
onChange = {(e) =>
setNgaySinh(e.target.value)
                                }
                            />

    </div>

{/* GENDER */ }
<div className="profile-form-group" >

    <label>Giới tính </label>

        < select
value = { gioiTinh }
onChange = {(e) =>
setGioiTinh(e.target.value)
                                }
                            >
    <option value="" >
        Chưa chọn
            </option>

            < option value = "Nam" >
                Nam
                </option>

                < option value = "Nữ" >
                    Nữ
                    </option>

                    < option value = "Khác" >
                        Khác
                        </option>
                        </select>

                        </div>

                        </div>

{
    error && (
        <div className="profile-error-message" >
                            ⚠️ { error }
    </div>
                    )
}

<div className="profile-save-area" >

    <button
                            className="profile-save-button"
onClick = { handleUpdate }
disabled = { saving }
    >
{
    saving?(
                                <>
    <span className="button-spinner" > </span>
                                    Đang lưu...
</>
                            ) : (
    <>
    Lưu thay đổi
        <span>→</span>
            </>
                            )}
</button>

    </div>

    </div>

    < div className = "profile-divider" > </div>

{/* ADDRESS */ }
<Link
                    to="/dia-chi"
className = "profile-address-link"
    >
    <div className="profile-address-icon" >
                        📍
</div>

    < div className = "profile-address-text" >
        <strong>
        Địa chỉ giao hàng
            </strong>

            <span>
                            Quản lý các địa chỉ nhận hàng của bạn
    </span>
    </div>

    < span className = "profile-address-arrow" >
                        →
</span>
    </Link>

    </section>

    </main>
    );
}

export default Profile;