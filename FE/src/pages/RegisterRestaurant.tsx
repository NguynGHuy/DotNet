import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    registerRestaurant,
} from "../services/authService";

function RegisterRestaurant() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        matKhau: "",
        soDienThoai: "",
        tenNhaHang: "",
        moTa: "",
        diaChiQuan: "",
        anhBia: "",
        gioMoCua: "07:00",
        gioDongCua: "22:00",
        phiShipMacDinh: 15000,
    });

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {
        const {
            name,
            value,
        } = e.target;

        setForm((prev) => ({
            ...prev,

            [name]:
                name === "phiShipMacDinh"
                    ? Number(value)
                    : value,
        }));
    };

    const handleSubmit = async () => {
        setError("");

        if (!form.tenNhaHang.trim()) {
            setError(
                "Vui lòng nhập tên nhà hàng."
            );

            return;
        }

        if (!form.email.trim()) {
            setError(
                "Vui lòng nhập email."
            );

            return;
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(
                form.email.trim()
            )
        ) {
            setError(
                "Email không đúng định dạng."
            );

            return;
        }

        if (form.matKhau.length < 6) {
            setError(
                "Mật khẩu phải có ít nhất 6 ký tự."
            );

            return;
        }

        if (!form.soDienThoai.trim()) {
            setError(
                "Vui lòng nhập số điện thoại."
            );

            return;
        }

        if (!form.diaChiQuan.trim()) {
            setError(
                "Vui lòng nhập địa chỉ nhà hàng."
            );

            return;
        }

        if (form.phiShipMacDinh < 0) {
            setError(
                "Phí giao hàng không được âm."
            );

            return;
        }

        if (
            form.gioMoCua &&
            form.gioDongCua &&
            form.gioMoCua === form.gioDongCua
        ) {
            setError(
                "Giờ mở cửa và đóng cửa không được giống nhau."
            );

            return;
        }

        try {
            setLoading(true);

            await registerRestaurant({
                email:
                    form.email
                        .trim(),

                matKhau:
                    form.matKhau,

                soDienThoai:
                    form.soDienThoai
                        .trim(),

                tenNhaHang:
                    form.tenNhaHang
                        .trim(),

                moTa:
                    form.moTa.trim() ||
                    null,

                diaChiQuan:
                    form.diaChiQuan
                        .trim(),

                anhBia:
                    form.anhBia.trim() ||
                    null,

                gioMoCua:
                    form.gioMoCua ||
                    null,

                gioDongCua:
                    form.gioDongCua ||
                    null,

                phiShipMacDinh:
                    form.phiShipMacDinh,
            });

            alert(
                "Đăng ký nhà hàng thành công. Vui lòng chờ Admin duyệt."
            );

            navigate("/dang-nhap");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Đăng ký nhà hàng thất bại."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-card register-card">
                <h2>
                    Đăng ký nhà hàng
                </h2>

                <p className="auth-description">
                    Tạo tài khoản dành cho
                    chủ nhà hàng
                </p>

                <div className="form-group">
                    <label>
                        Tên nhà hàng
                    </label>

                    <input
                        name="tenNhaHang"
                        value={
                            form.tenNhaHang
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Nhập tên nhà hàng"
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>

                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={
                            handleChange
                        }
                        placeholder="Email chủ nhà hàng"
                    />
                </div>

                <div className="form-group">
                    <label>
                        Mật khẩu
                    </label>

                    <input
                        type="password"
                        name="matKhau"
                        value={
                            form.matKhau
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Nhập mật khẩu"
                    />
                </div>

                <div className="form-group">
                    <label>
                        Số điện thoại
                    </label>

                    <input
                        name="soDienThoai"
                        value={
                            form.soDienThoai
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Số điện thoại"
                    />
                </div>

                <div className="form-group">
                    <label>
                        Địa chỉ quán
                    </label>

                    <input
                        name="diaChiQuan"
                        value={
                            form.diaChiQuan
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Địa chỉ nhà hàng"
                    />
                </div>

                <div className="form-group">
                    <label>
                        Mô tả
                    </label>

                    <textarea
                        name="moTa"
                        value={form.moTa}
                        onChange={
                            handleChange
                        }
                        placeholder="Giới thiệu nhà hàng"
                    />
                </div>

                <div className="form-group">
                    <label>
                        URL ảnh bìa
                    </label>

                    <input
                        name="anhBia"
                        value={
                            form.anhBia
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="https://..."
                    />
                </div>

                <div className="form-group">
                    <label>
                        Giờ mở cửa
                    </label>

                    <input
                        type="time"
                        name="gioMoCua"
                        value={
                            form.gioMoCua
                        }
                        onChange={
                            handleChange
                        }
                    />
                </div>

                <div className="form-group">
                    <label>
                        Giờ đóng cửa
                    </label>

                    <input
                        type="time"
                        name="gioDongCua"
                        value={
                            form.gioDongCua
                        }
                        onChange={
                            handleChange
                        }
                    />
                </div>

                <div className="form-group">
                    <label>
                        Phí giao hàng mặc định
                    </label>

                    <input
                        type="number"
                        min={0}
                        name="phiShipMacDinh"
                        value={
                            form.phiShipMacDinh
                        }
                        onChange={
                            handleChange
                        }
                    />
                </div>

                {error && (
                    <p className="auth-error">
                        {error}
                    </p>
                )}

                <button
                    className="auth-button"
                    onClick={
                        handleSubmit
                    }
                    disabled={loading}
                >
                    {loading
                        ? "Đang đăng ký..."
                        : "Đăng ký nhà hàng"}
                </button>

                <p className="auth-footer">
                    Đăng ký khách hàng?{" "}
                    <Link to="/dang-ky">
                        Tại đây
                    </Link>
                </p>

                <p className="auth-footer">
                    Đã có tài khoản?{" "}
                    <Link to="/dang-nhap">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default RegisterRestaurant;