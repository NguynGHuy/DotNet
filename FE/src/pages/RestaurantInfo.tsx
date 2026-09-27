import { useEffect, useState } from "react";
import {
    getRestaurantProfile,
    updateRestaurantProfile,
} from "../services/restaurantService";

interface Restaurant {
    maNhaHang: number;
    tenNhaHang: string;
    moTa?: string;
    diaChiQuan?: string;
    anhBia?: string;
    gioMoCua?: string;
    gioDongCua?: string;
    trangThaiDuyet?: string;
    trangThaiHoatDong?: string;
    danhGiaTrungBinh?: number;
    phiShipMacDinh?: number;
}

function QuanRestaurantInfo() {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        tenNhaHang: "",
        moTa: "",
        diaChiQuan: "",
        anhBia: "",
        gioMoCua: "",
        gioDongCua: "",
        phiShipMacDinh: 0,
    });

    useEffect(() => {
        loadRestaurant();
    }, []);

    const loadRestaurant = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getRestaurantProfile();

            setRestaurant(data);

            setForm({
                tenNhaHang: data.tenNhaHang || "",
                moTa: data.moTa || "",
                diaChiQuan: data.diaChiQuan || "",
                anhBia: data.anhBia || "",
                gioMoCua: data.gioMoCua
                    ? data.gioMoCua.slice(0, 5)
                    : "",
                gioDongCua: data.gioDongCua
                    ? data.gioDongCua.slice(0, 5)
                    : "",
                phiShipMacDinh: data.phiShipMacDinh ?? 0,
            });
        } catch (err) {
            console.error("Lỗi lấy thông tin nhà hàng:", err);
            setError("Không thể lấy thông tin nhà hàng.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                name === "phiShipMacDinh"
                    ? Number(value)
                    : value,
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const data = await updateRestaurantProfile({
                tenNhaHang: form.tenNhaHang,
                moTa: form.moTa,
                diaChiQuan: form.diaChiQuan,
                anhBia: form.anhBia,
                gioMoCua: form.gioMoCua,
                gioDongCua: form.gioDongCua,
                phiShipMacDinh: form.phiShipMacDinh,
            });

            setRestaurant(data);

            setMessage("Cập nhật thông tin nhà hàng thành công.");

            setTimeout(() => {
                setMessage("");
            }, 3000);
        } catch (err) {
            console.error("Lỗi cập nhật nhà hàng:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Cập nhật thông tin thất bại."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="quan-page-loading">
                Đang tải thông tin nhà hàng...
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="quan-empty">
                Không tìm thấy thông tin nhà hàng.
            </div>
        );
    }

    return (
        <div className="quan-dashboard">
            <div className="quan-page-title">
                <div>
                    <h1>Thông tin quán</h1>
                    <p>
                        Xem và cập nhật thông tin nhà hàng của bạn.
                    </p>
                </div>
            </div>

            {message && (
                <div className="quan-success-message">
                    ✓ {message}
                </div>
            )}

            {error && (
                <div className="quan-error-message">
                    ✕ {error}
                </div>
            )}

            <form
                className="quan-form-section"
                onSubmit={handleSubmit}
            >
                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>Thông tin cơ bản</h2>
                            <p>
                                Thông tin khách hàng sẽ nhìn thấy về
                                nhà hàng.
                            </p>
                        </div>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Tên nhà hàng</label>
                            <input
                                type="text"
                                name="tenNhaHang"
                                value={form.tenNhaHang}
                                onChange={handleChange}
                                placeholder="Nhập tên nhà hàng"
                                required
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>Địa chỉ</label>
                            <input
                                type="text"
                                name="diaChiQuan"
                                value={form.diaChiQuan}
                                onChange={handleChange}
                                placeholder="Nhập địa chỉ nhà hàng"
                            />
                        </div>

                        <div className="quan-form-group quan-form-full">
                            <label>Mô tả</label>
                            <textarea
                                name="moTa"
                                value={form.moTa}
                                onChange={handleChange}
                                placeholder="Giới thiệu về nhà hàng..."
                                rows={4}
                            />
                        </div>

                        <div className="quan-form-group quan-form-full">
                            <label>Ảnh bìa</label>
                            <input
                                type="text"
                                name="anhBia"
                                value={form.anhBia}
                                onChange={handleChange}
                                placeholder="URL ảnh bìa"
                            />
                        </div>
                    </div>
                </div>

                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>Thời gian hoạt động</h2>
                            <p>
                                Thiết lập thời gian mở cửa và đóng
                                cửa.
                            </p>
                        </div>
                    </div>

                    <div className="quan-form-grid">
                        <div className="quan-form-group">
                            <label>Giờ mở cửa</label>
                            <input
                                type="time"
                                name="gioMoCua"
                                value={form.gioMoCua}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>Giờ đóng cửa</label>
                            <input
                                type="time"
                                name="gioDongCua"
                                value={form.gioDongCua}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="quan-form-group">
                            <label>Phí ship mặc định</label>

                            <div className="quan-price-input">
                                <input
                                    type="number"
                                    name="phiShipMacDinh"
                                    value={form.phiShipMacDinh}
                                    onChange={handleChange}
                                    min={0}
                                />
                                <span>VNĐ</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="quan-section">
                    <div className="quan-section-header">
                        <div>
                            <h2>Trạng thái</h2>
                            <p>
                                Thông tin này do hệ thống quản lý.
                            </p>
                        </div>
                    </div>

                    <div className="quan-status-row">
                        <div>
                            <span>Trạng thái duyệt</span>
                            <strong>
                                {restaurant.trangThaiDuyet ||
                                    "Chưa xác định"}
                            </strong>
                        </div>

                        <div>
                            <span>Trạng thái hoạt động</span>
                            <strong>
                                {restaurant.trangThaiHoatDong ===
                                "MoCua"
                                    ? "Đang mở cửa"
                                    : "Đang đóng cửa"}
                            </strong>
                        </div>

                        <div>
                            <span>Đánh giá trung bình</span>
                            <strong>
                                ⭐{" "}
                                {restaurant.danhGiaTrungBinh ??
                                    0}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="quan-form-actions">
                    <button
                        type="button"
                        className="quan-secondary-button"
                        onClick={loadRestaurant}
                        disabled={saving}
                    >
                        Hủy thay đổi
                    </button>

                    <button
                        type="submit"
                        className="quan-primary-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Đang lưu..."
                            : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default QuanRestaurantInfo;