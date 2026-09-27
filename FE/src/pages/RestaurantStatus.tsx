import { useEffect, useState } from "react";
import {
    getRestaurantProfile,
    updateRestaurantStatus,
} from "../services/restaurantService";

interface Restaurant {
    maNhaHang: number;
    tenNhaHang: string;
    gioMoCua?: string;
    gioDongCua?: string;
    trangThaiDuyet?: string;
    trangThaiHoatDong?: string;
}

function QuanRestaurantStatus() {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadRestaurant();
    }, []);

    const loadRestaurant = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getRestaurantProfile();
            setRestaurant(data);
        } catch (err) {
            console.error("Lỗi lấy thông tin nhà hàng:", err);
            setError("Không thể lấy thông tin nhà hàng.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStatus = async (status: string) => {
        try {
            setUpdating(true);
            setMessage("");
            setError("");

            await updateRestaurantStatus(status);

            // Lấy lại dữ liệu mới nhất từ backend
            const data = await getRestaurantProfile();
            setRestaurant(data);

            setMessage(
                status === "MoCua"
                    ? "Nhà hàng đã được mở cửa."
                    : "Nhà hàng đã được tạm ngưng."
            );

            setTimeout(() => {
                setMessage("");
            }, 3000);
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật trạng thái nhà hàng."
            );
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="quan-page-loading">
                Đang tải trạng thái nhà hàng...
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

    const isOpen =
        restaurant.trangThaiHoatDong === "MoCua";

    return (
        <div className="quan-dashboard">
            <div className="quan-page-title">
                <div>
                    <h1>Trạng thái quán</h1>
                    <p>
                        Quản lý trạng thái mở cửa của nhà hàng.
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

            <div className="quan-status-main-card">
                <div
                    className={`quan-status-circle ${
                        isOpen ? "open" : "closed"
                    }`}
                >
                    {isOpen ? "✓" : "×"}
                </div>

                <div className="quan-status-main-info">
                    <span>Trạng thái hiện tại</span>

                    <h2>
                        {isOpen
                            ? "Đang mở cửa"
                            : "Đang đóng cửa"}
                    </h2>

                    <p>
                        {isOpen
                            ? "Khách hàng hiện có thể đặt món từ nhà hàng."
                            : "Khách hàng hiện không thể đặt món từ nhà hàng."}
                    </p>
                </div>
            </div>

            <div className="quan-section">
                <div className="quan-section-header">
                    <div>
                        <h2>Thay đổi trạng thái</h2>
                        <p>
                            Bạn có thể chủ động mở hoặc đóng cửa
                            nhà hàng.
                        </p>
                    </div>
                </div>

                <div className="quan-status-actions">
                    <button
                        className={`quan-status-button open-button ${
                            isOpen ? "selected" : ""
                        }`}
                        onClick={() =>
                            handleChangeStatus("MoCua")
                        }
                        disabled={updating || isOpen}
                    >
                        <span className="status-button-icon">
                            🟢
                        </span>

                        <div>
                            <strong>Mở cửa</strong>
                            <small>
                                Cho phép khách hàng đặt món
                            </small>
                        </div>
                    </button>

                    <button
                        className={`quan-status-button close-button ${
                            !isOpen ? "selected" : ""
                        }`}
                        onClick={() =>
                            handleChangeStatus("TamNgung")
                        }
                        disabled={updating || !isOpen}
                    >
                        <span className="status-button-icon">
                            🔴
                        </span>

                        <div>
                            <strong>Tạm Ngưng</strong>
                            <small>
                                Tạm ngừng nhận đơn hàng
                            </small>
                        </div>
                    </button>
                </div>
            </div>

            <div className="quan-section">
                <div className="quan-section-header">
                    <div>
                        <h2>Thời gian hoạt động</h2>
                        <p>
                            Thời gian hoạt động được thiết lập
                            trong thông tin nhà hàng.
                        </p>
                    </div>
                </div>

                <div className="quan-hours-card">
                    <div className="quan-hours-icon">
                        🕐
                    </div>

                    <div>
                        <span>Giờ hoạt động</span>

                        <strong>
                            {restaurant.gioMoCua
                                ? restaurant.gioMoCua.slice(0, 5)
                                : "--:--"}

                            {" - "}

                            {restaurant.gioDongCua
                                ? restaurant.gioDongCua.slice(0, 5)
                                : "--:--"}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="quan-section">
                <div className="quan-section-header">
                    <div>
                        <h2>Trạng thái duyệt</h2>
                        <p>
                            Trạng thái nhà hàng được hệ thống ghi
                            nhận.
                        </p>
                    </div>
                </div>

                <div className="quan-approval-status">
                    <span className="quan-approval-dot"></span>

                    <div>
                        <strong>
                            {restaurant.trangThaiDuyet ||
                                "Chưa xác định"}
                        </strong>

                        <span>
                            Nhà hàng của bạn đang ở trạng thái này
                            trên hệ thống.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuanRestaurantStatus;