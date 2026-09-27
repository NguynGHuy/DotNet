import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import RestaurantReviews from "../components/RestaurantReviews";

interface Restaurant {
    maNhaHang: number;
    tenNhaHang: string;
    moTa?: string;
    diaChiQuan?: string;
    anhBia?: string | null;
    danhGiaTrungBinh?: number;
    phiShipMacDinh?: number;
    gioMoCua?: string;
    gioDongCua?: string;
    trangThaiHoatDong?: string;
}

function isRestaurantOpen(restaurant: Restaurant): boolean {
    if (restaurant.trangThaiHoatDong !== "MoCua") {
        return false;
    }

    if (!restaurant.gioMoCua || !restaurant.gioDongCua) {
        return true;
    }

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const [openHour, openMinute] = restaurant.gioMoCua
        .slice(0, 5)
        .split(":")
        .map(Number);

    const [closeHour, closeMinute] = restaurant.gioDongCua
        .slice(0, 5)
        .split(":")
        .map(Number);

    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    if (openMinutes <= closeMinutes) {
        return (
            currentMinutes >= openMinutes &&
            currentMinutes < closeMinutes
        );
    }

    return (
        currentMinutes >= openMinutes ||
        currentMinutes < closeMinutes
    );
}

function RestaurantDetail() {
    const { id } = useParams<{ id: string }>();

    const [restaurant, setRestaurant] =
        useState<Restaurant | null>(null);

    const [loading, setLoading] = useState(true);

    const [currentTime, setCurrentTime] =
        useState(new Date());

    useEffect(() => {
        if (!id) return;

        apiFetch(`/nha-hang/${id}`)
            .then((data) => {
                console.log("Chi tiết nhà hàng:", data);
                setRestaurant(data);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);

        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <main className="restaurant-detail-page">
                <div className="detail-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin nhà hàng...</p>
                </div>
            </main>
        );
    }

    if (!restaurant) {
        return (
            <main className="restaurant-detail-page">
                <div className="detail-error">
                    <div className="detail-error-icon">
                        !
                    </div>

                    <h2>
                        Không tìm thấy nhà hàng
                    </h2>

                    <p>
                        Nhà hàng bạn đang tìm kiếm không tồn tại
                        hoặc đã bị xóa.
                    </p>

                    <Link
                        to="/nha-hang"
                        className="detail-back-button"
                    >
                        ← Xem danh sách nhà hàng
                    </Link>
                </div>
            </main>
        );
    }

    void currentTime;

    const isOpen = isRestaurantOpen(restaurant);

    const rating =
        restaurant.danhGiaTrungBinh ?? 0;

    return (
        <main className="restaurant-detail-page">

            {/* BACK */}
            <div className="restaurant-detail-container">

                <Link
                    to="/nha-hang"
                    className="restaurant-detail-back"
                >
                    <span>←</span>
                    Tất cả nhà hàng
                </Link>


                {/* HERO */}
                <section className="restaurant-detail-hero">

                    <div className="restaurant-detail-image">

                        {restaurant.anhBia ? (
                            <img
                                src={restaurant.anhBia}
                                alt={restaurant.tenNhaHang}
                            />
                        ) : (
                            <div className="restaurant-detail-placeholder">
                                <span>🍽️</span>
                            </div>
                        )}

                        <div
                            className={
                                isOpen
                                    ? "restaurant-detail-status open"
                                    : "restaurant-detail-status closed"
                            }
                        >
                            <span>●</span>

                            {isOpen
                                ? "Đang mở cửa"
                                : "Đóng cửa"}
                        </div>

                    </div>


                    {/* BASIC INFO */}
                    <div className="restaurant-detail-main">

                        <div className="restaurant-detail-heading">

                            <div>
                                <span className="restaurant-detail-eyebrow">
                                    NHÀ HÀNG
                                </span>

                                <h1>
                                    {restaurant.tenNhaHang}
                                </h1>
                            </div>

                            <div className="restaurant-detail-rating">

                                <span className="rating-star">
                                    ★
                                </span>

                                <strong>
                                    {rating > 0
                                        ? rating.toFixed(1)
                                        : "—"}
                                </strong>

                                <span>
                                    {rating > 0
                                        ? "Đánh giá"
                                        : "Chưa có đánh giá"}
                                </span>

                            </div>

                        </div>


                        {/* QUICK INFO */}
                        <div className="restaurant-detail-quick-info">

                            <div className="restaurant-quick-item">

                                <div className="restaurant-quick-icon">
                                    📍
                                </div>

                                <div>
                                    <span>
                                        Địa chỉ
                                    </span>

                                    <strong>
                                        {restaurant.diaChiQuan ||
                                            "Chưa có địa chỉ"}
                                    </strong>
                                </div>

                            </div>


                            <div className="restaurant-quick-item">

                                <div className="restaurant-quick-icon">
                                    🕐
                                </div>

                                <div>
                                    <span>
                                        Giờ hoạt động
                                    </span>

                                    <strong>
                                        {restaurant.gioMoCua
                                            ? restaurant.gioMoCua.slice(
                                                0,
                                                5
                                            )
                                            : "--:--"}

                                        {" – "}

                                        {restaurant.gioDongCua
                                            ? restaurant.gioDongCua.slice(
                                                0,
                                                5
                                            )
                                            : "--:--"}
                                    </strong>
                                </div>

                            </div>


                            <div className="restaurant-quick-item">

                                <div className="restaurant-quick-icon">
                                    🛵
                                </div>

                                <div>
                                    <span>
                                        Phí giao hàng
                                    </span>

                                    <strong>
                                        {(
                                            restaurant.phiShipMacDinh ??
                                            0
                                        ).toLocaleString(
                                            "vi-VN"
                                        )}
                                        đ
                                    </strong>
                                </div>

                            </div>

                        </div>


                        {/* DESCRIPTION */}
                        <div className="restaurant-detail-description">

                            <h2>
                                Về nhà hàng
                            </h2>

                            <p>
                                {restaurant.moTa ||
                                    "Nhà hàng chưa cập nhật mô tả."}
                            </p>

                        </div>


                        {/* ACTION */}
                        <div className="restaurant-detail-action">

                            <button
                                className="restaurant-detail-menu-button"
                                disabled={!isOpen}
                            >
                                <span>
                                    {isOpen
                                        ? "🍽️"
                                        : "🔒"}
                                </span>

                                <span>
                                    {isOpen
                                        ? "Xem thực đơn"
                                        : "Nhà hàng đang đóng cửa"}
                                </span>

                                {isOpen && (
                                    <span className="menu-arrow">
                                        →
                                    </span>
                                )}
                            </button>

                        </div>

                    </div>

                </section>


                {/* REVIEWS */}
                <section className="restaurant-detail-reviews">

                    <RestaurantReviews
                        maNhaHang={restaurant.maNhaHang}
                    />

                </section>

            </div>

        </main>
    );
}

export default RestaurantDetail;