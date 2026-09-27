import { useEffect, useState } from "react";
import  { getRestaurantProfile } from "../services/restaurantService";

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

function QuanHome() {
    const [restaurant, setRestaurant] =
        useState<Restaurant | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRestaurant();
    }, []);

    const loadRestaurant = async () => {
        try {
            const data = await getRestaurantProfile();
            setRestaurant(data);
        } catch (error) {
            console.error("Lỗi lấy thông tin quán:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="quan-page-loading">
                Đang tải thông tin quán...
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="quan-empty">
                Không lấy được thông tin nhà hàng.
            </div>
        );
    }

    const isOpen =
        restaurant.trangThaiHoatDong === "MoCua";

    return (
        <div className="quan-dashboard">

            <div className="quan-page-title">
                <div>
                    <h1>Xin chào! 👋</h1>
                    <p>
                        Đây là khu vực quản lý nhà hàng của bạn.
                    </p>
                </div>
            </div>

            {/* THÔNG TIN TỔNG QUAN */}
            <div className="quan-stats">

                <div className="quan-stat-card">
                    <div className="quan-stat-icon">
                        🏪
                    </div>

                    <div>
                        <span>Nhà hàng</span>
                        <strong>{restaurant.tenNhaHang}</strong>
                    </div>
                </div>

                <div className="quan-stat-card">
                    <div className="quan-stat-icon">
                        {isOpen ? "🟢" : "🔴"}
                    </div>

                    <div>
                        <span>Trạng thái</span>
                        <strong>
                            {isOpen
                                ? "Đang mở cửa"
                                : "Đang đóng cửa"}
                        </strong>
                    </div>
                </div>

                <div className="quan-stat-card">
                    <div className="quan-stat-icon">
                        ⭐
                    </div>

                    <div>
                        <span>Đánh giá</span>
                        <strong>
                            {restaurant.danhGiaTrungBinh ?? 0}
                        </strong>
                    </div>
                </div>

                <div className="quan-stat-card">
                    <div className="quan-stat-icon">
                        🚚
                    </div>

                    <div>
                        <span>Phí ship</span>
                        <strong>
                            {(
                                restaurant.phiShipMacDinh ?? 0
                            ).toLocaleString("vi-VN")}{" "}
                            ₫
                        </strong>
                    </div>
                </div>

            </div>

            {/* THÔNG TIN QUÁN */}
            <div className="quan-section">

                <div className="quan-section-header">
                    <div>
                        <h2>Thông tin nhà hàng</h2>
                        <p>
                            Thông tin hiện tại của nhà hàng.
                        </p>
                    </div>

                    <button
                        className="quan-primary-button"
                        onClick={() =>
                            window.location.href =
                                "/quan/thong-tin"
                        }
                    >
                        Chỉnh sửa
                    </button>
                </div>

                <div className="quan-info-grid">

                    <div className="quan-info-item">
                        <span>Tên nhà hàng</span>
                        <strong>
                            {restaurant.tenNhaHang}
                        </strong>
                    </div>

                    <div className="quan-info-item">
                        <span>Địa chỉ</span>
                        <strong>
                            {restaurant.diaChiQuan ||
                                "Chưa cập nhật"}
                        </strong>
                    </div>

                    <div className="quan-info-item">
                        <span>Giờ mở cửa</span>
                        <strong>
                            {restaurant.gioMoCua || "--:--"} -
                            {" "}
                            {restaurant.gioDongCua || "--:--"}
                        </strong>
                    </div>

                    <div className="quan-info-item">
                        <span>Trạng thái duyệt</span>
                        <strong>
                            {restaurant.trangThaiDuyet ||
                                "Chưa xác định"}
                        </strong>
                    </div>

                </div>

            </div>

            {/* THAO TÁC NHANH */}
            <div className="quan-section">

                <div className="quan-section-header">
                    <div>
                        <h2>Thao tác nhanh</h2>
                        <p>
                            Quản lý những chức năng thường dùng.
                        </p>
                    </div>
                </div>

                <div className="quan-quick-actions">

                    <button
                        onClick={() =>
                            window.location.href =
                                "/quan/thong-tin"
                        }
                    >
                        <span>🏪</span>
                        <strong>Thông tin quán</strong>
                        <small>
                            Cập nhật thông tin nhà hàng
                        </small>
                    </button>

                    <button
                        onClick={() =>
                            window.location.href =
                                "/quan/trang-thai"
                        }
                    >
                        <span>🟢</span>
                        <strong>Trạng thái quán</strong>
                        <small>
                            Mở hoặc đóng cửa nhà hàng
                        </small>
                    </button>

                    <button
                        onClick={() =>
                            window.location.href =
                                "/quan/khuyen-mai"
                        }
                    >
                        <span>🎟️</span>
                        <strong>Khuyến mãi</strong>
                        <small>
                            Quản lý mã giảm giá
                        </small>
                    </button>

                </div>

            </div>

        </div>
    );
}

export default QuanHome;