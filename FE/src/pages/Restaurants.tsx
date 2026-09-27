import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRestaurants } from "../services/restaurantService";

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

function Restaurants() {
    const [restaurants, setRestaurants] =
        useState<Restaurant[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [filter, setFilter] =
        useState<"all" | "open" | "rating">("all");

    const [currentTime, setCurrentTime] =
        useState(new Date());

    useEffect(() => {
        getRestaurants()
            .then((data) => {
                console.log("Danh sách nhà hàng:", data);
                setRestaurants(data);
            })
            .catch((error) => {
                console.error(error);
                setError(
                    "Không thể tải danh sách nhà hàng."
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);

        return () => clearInterval(timer);
    }, []);

    const filteredRestaurants = restaurants
        .filter((restaurant) => {
            const keyword = search
                .trim()
                .toLowerCase();

            if (!keyword) return true;

            return (
                restaurant.tenNhaHang
                    .toLowerCase()
                    .includes(keyword) ||
                restaurant.diaChiQuan
                    ?.toLowerCase()
                    .includes(keyword)
            );
        })
        .filter((restaurant) => {
            if (filter === "open") {
                return isRestaurantOpen(restaurant);
            }

            return true;
        })
        .sort((a, b) => {
            if (filter === "rating") {
                return (
                    (b.danhGiaTrungBinh ?? 0) -
                    (a.danhGiaTrungBinh ?? 0)
                );
            }

            return 0;
        });

    void currentTime;

    return (
        <main className="restaurants-page">

            {/* HERO */}
            <section className="restaurants-hero">
                <div className="restaurants-hero-content">

                    <span className="restaurants-eyebrow">
                        KHÁM PHÁ ẨM THỰC
                    </span>

                    <h1>
                        Tìm nhà hàng
                        <br />
                        bạn yêu thích
                    </h1>

                    <p>
                        Khám phá những địa điểm ăn uống
                        hấp dẫn và đặt món yêu thích
                        ngay hôm nay.
                    </p>

                    <div className="restaurants-search">

                        <span className="restaurants-search-icon">
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Tìm nhà hàng hoặc địa chỉ..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                className="restaurants-search-clear"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                ×
                            </button>
                        )}

                    </div>

                </div>

                <div className="restaurants-hero-decoration">
                    <div className="food-circle food-circle-one">
                        🍜
                    </div>

                    <div className="food-circle food-circle-two">
                        🍕
                    </div>

                    <div className="food-circle food-circle-three">
                        🍔
                    </div>

                    <div className="food-circle food-circle-main">
                        🍱
                    </div>
                </div>
            </section>


            {/* CONTENT */}
            <section className="restaurants-content">

                <div className="restaurants-toolbar">

                    <div>
                        <h2>
                            Nhà hàng dành cho bạn
                        </h2>

                        {!loading && !error && (
                            <p>
                                {filteredRestaurants.length} nhà hàng
                                {search && (
                                    <>
                                        {" "}
                                        phù hợp với "{search}"
                                    </>
                                )}
                            </p>
                        )}
                    </div>

                    <div className="restaurant-filters">

                        <button
                            type="button"
                            className={
                                filter === "all"
                                    ? "restaurant-filter active"
                                    : "restaurant-filter"
                            }
                            onClick={() =>
                                setFilter("all")
                            }
                        >
                            Tất cả
                        </button>

                        <button
                            type="button"
                            className={
                                filter === "open"
                                    ? "restaurant-filter active"
                                    : "restaurant-filter"
                            }
                            onClick={() =>
                                setFilter("open")
                            }
                        >
                            <span className="filter-dot">
                                ●
                            </span>
                            Đang mở
                        </button>

                        <button
                            type="button"
                            className={
                                filter === "rating"
                                    ? "restaurant-filter active"
                                    : "restaurant-filter"
                            }
                            onClick={() =>
                                setFilter("rating")
                            }
                        >
                            ★ Đánh giá cao
                        </button>

                    </div>

                </div>


                {/* LOADING */}
                {loading && (
                    <div className="restaurants-loading">
                        <div className="restaurant-loading-spinner" />
                        <p>
                            Đang tìm nhà hàng...
                        </p>
                    </div>
                )}


                {/* ERROR */}
                {!loading && error && (
                    <div className="restaurants-error">
                        <div className="restaurants-error-icon">
                            !
                        </div>

                        <h3>
                            Không thể tải nhà hàng
                        </h3>

                        <p>
                            {error}
                        </p>
                    </div>
                )}


                {/* EMPTY */}
                {!loading &&
                    !error &&
                    filteredRestaurants.length === 0 && (
                        <div className="restaurants-empty">

                            <div className="restaurants-empty-icon">
                                🔎
                            </div>

                            <h3>
                                Không tìm thấy nhà hàng
                            </h3>

                            <p>
                                Thử tìm kiếm bằng tên nhà hàng
                                hoặc địa chỉ khác.
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setFilter("all");
                                    }}
                                >
                                    Xem tất cả nhà hàng
                                </button>
                            )}

                        </div>
                    )}


                {/* RESTAURANTS */}
                {!loading &&
                    !error &&
                    filteredRestaurants.length > 0 && (

                        <div className="restaurants-grid">

                            {filteredRestaurants.map(
                                (restaurant) => {

                                    const isOpen =
                                        isRestaurantOpen(
                                            restaurant
                                        );

                                    const rating =
                                        restaurant.danhGiaTrungBinh ??
                                        0;

                                    return (
                                        <Link
                                            key={
                                                restaurant.maNhaHang
                                            }
                                            to={`/nha-hang/${restaurant.maNhaHang}`}
                                            className="restaurant-modern-card"
                                        >

                                            {/* IMAGE */}
                                            <div className="restaurant-card-image">

                                                {restaurant.anhBia ? (
                                                    <img
                                                        src={
                                                            restaurant.anhBia
                                                        }
                                                        alt={
                                                            restaurant.tenNhaHang
                                                        }
                                                    />
                                                ) : (
                                                    <div className="restaurant-card-placeholder">
                                                        <span>
                                                            🍽️
                                                        </span>
                                                    </div>
                                                )}

                                                <div
                                                    className={
                                                        isOpen
                                                            ? "restaurant-open-badge"
                                                            : "restaurant-closed-badge"
                                                    }
                                                >
                                                    <span>
                                                        ●
                                                    </span>

                                                    {isOpen
                                                        ? "Đang mở"
                                                        : "Đóng cửa"}
                                                </div>

                                                <div className="restaurant-rating-badge">
                                                    ★{" "}
                                                    {rating.toFixed(1)}
                                                </div>

                                            </div>


                                            {/* INFO */}
                                            <div className="restaurant-card-info">

                                                <div className="restaurant-card-title-row">

                                                    <h3>
                                                        {
                                                            restaurant.tenNhaHang
                                                        }
                                                    </h3>

                                                    <span className="restaurant-arrow">
                                                        →
                                                    </span>

                                                </div>


                                                {restaurant.moTa && (
                                                    <p className="restaurant-card-description">
                                                        {
                                                            restaurant.moTa
                                                        }
                                                    </p>
                                                )}


                                                <div className="restaurant-card-meta">

                                                    {restaurant.diaChiQuan && (
                                                        <div className="restaurant-meta-item">
                                                            <span>
                                                                📍
                                                            </span>

                                                            <span className="restaurant-meta-text">
                                                                {
                                                                    restaurant.diaChiQuan
                                                                }
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="restaurant-meta-item">

                                                        <span>
                                                            🚚
                                                        </span>

                                                        <span>
                                                            Từ{" "}
                                                            {(
                                                                restaurant.phiShipMacDinh ??
                                                                0
                                                            ).toLocaleString(
                                                                "vi-VN"
                                                            )}
                                                            đ
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="restaurant-card-footer">

                                                    <span>
                                                        🍴 Đặt món ngay
                                                    </span>

                                                    <span className="restaurant-card-footer-arrow">
                                                        →
                                                    </span>

                                                </div>

                                            </div>

                                        </Link>
                                    );
                                }
                            )}

                        </div>
                    )}

            </section>

        </main>
    );
}

export default Restaurants;