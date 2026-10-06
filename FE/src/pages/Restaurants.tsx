import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRestaurants } from "../services/restaurantService";
import type { Restaurant } from "../services/restaurantService";
import {
    CircleDot,
    Search,
    SearchX,
    ArrowRight,
    Bike,
    ImageIcon,
    MapPin,
    SlidersHorizontal,
    Star,
    Store,
    X,
} from "lucide-react";
// interface Restaurant {
//     maNhaHang: number;
//     tenNhaHang: string;
//     moTa?: string;
//     diaChiQuan?: string;
//     anhBia?: string | null;
//     danhGiaTrungBinh?: number;
//     phiShipMacDinh?: number;
//     gioMoCua?: string;
//     gioDongCua?: string;
//     trangThaiHoatDong?: string;
// }

function isRestaurantOpen(
    restaurant: Restaurant
): boolean {
    return restaurant.dangMoCua;
}
function getRestaurantStatusLabel(
    restaurant: Restaurant
): string {
    if (restaurant.dangMoCua) {
        return "Đang mở";
    }

    if (
        restaurant.cheDoHoatDong ===
        "TamNgung"
    ) {
        return "Tạm ngưng";
    }

    if (
        restaurant.cheDoHoatDong ===
            "TuDong" &&
        restaurant.gioMoCua
    ) {
        return `Mở lúc ${restaurant.gioMoCua.slice(
            0,
            5
        )}`;
    }

    return "Đã đóng";
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

    useEffect(() => {
        let cancelled = false;

        const loadRestaurants = async () => {
            try {
                const data = await getRestaurants();
                if (cancelled) return;

                console.log("Danh sách nhà hàng:", data);
                setRestaurants(data);
                setError("");
            } catch (error) {
                if (cancelled) return;
                console.error(error);
                setError(
                    "Không thể tải danh sách nhà hàng."
                );
            } finally {
                if (cancelled) return;
                setLoading(false);
            }
        };

        void loadRestaurants();
        const timer = window.setInterval(() => void loadRestaurants(), 15000);
        const refresh = () => void loadRestaurants();
        window.addEventListener("focus", refresh);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            window.removeEventListener("focus", refresh);
        };
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

    return (
        <main className="restaurants-page">

            {/* HERO */}
            <section className="restaurants-hero">
    <div className="restaurants-hero-content">
        <div className="restaurants-eyebrow">
            <Store
                size={16}
                strokeWidth={2}
            />

            <span>
                Khám phá nhà hàng
            </span>
        </div>

        <h1>
            Hôm nay bạn muốn ăn gì?
        </h1>

        <p>
            Tìm kiếm nhà hàng yêu thích
            theo tên hoặc địa chỉ và bắt đầu
            đặt món.
        </p>

        <div className="restaurants-search">
            <Search
                size={20}
                strokeWidth={2}
                className="restaurants-search-icon"
            />

            <input
                type="text"
                placeholder="Tìm tên nhà hàng hoặc địa chỉ..."
                value={search}
                onChange={(event) =>
                    setSearch(
                        event.target.value
                    )
                }
            />

            {search && (
                <button
                    type="button"
                    className="restaurants-search-clear"
                    onClick={() =>
                        setSearch("")
                    }
                    aria-label="Xóa từ khóa tìm kiếm"
                >
                    <X
                        size={17}
                        strokeWidth={2}
                    />
                </button>
            )}
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
                            className={`restaurant-filter ${
                                filter === "all"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setFilter("all")
                            }
                        >
                            <SlidersHorizontal
                                size={15}
                                strokeWidth={2}
                            />

                            <span>Tất cả</span>
                        </button>

                        <button
                            type="button"
                            className={`restaurant-filter ${
                                filter === "open"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setFilter("open")
                            }
                        >
                            <CircleDot
                                size={15}
                                strokeWidth={2}
                            />

                            <span>Đang mở</span>
                        </button>

                        <button
                            type="button"
                            className={`restaurant-filter ${
                                filter === "rating"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setFilter("rating")
                            }
                        >
                            <Star
                                size={15}
                                strokeWidth={2}
                            />

                            <span>Đánh giá cao</span>
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
                                <SearchX
                                    size={28}
                                    strokeWidth={1.8}
                                />
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

                                    const statusLabel =
                                        getRestaurantStatusLabel(
                                            restaurant
                                        );

                                    const rating =
                                        restaurant.danhGiaTrungBinh ??
                                        0;

                                    const shippingFee =
                                        restaurant.phiShipMacDinh ??
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
                                                        <ImageIcon
                                                            size={48}
                                                            strokeWidth={1.3}
                                                        />

                                                        <span>
                                                            Chưa có ảnh
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
                                                    <span className="restaurant-status-dot" />

                                                    {statusLabel}
                                                </div>

                                                <div className="restaurant-rating-badge">
                                                    <Star
                                                        size={15}
                                                        fill="currentColor"
                                                        strokeWidth={1.8}
                                                    />

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
                                                        <ArrowRight
                                                            size={16}
                                                            strokeWidth={2}
                                                        />
                                                    </span>
                                                </div>

                                                {restaurant.moTa && (
                                                    <p className="restaurant-card-description">
                                                        {restaurant.moTa}
                                                    </p>
                                                )}

                                                <div className="restaurant-card-meta">
                                                    <div className="restaurant-meta-item">
                                                        <MapPin
                                                            size={16}
                                                            strokeWidth={1.9}
                                                        />

                                                        <span className="restaurant-meta-text">
                                                            {restaurant.diaChiQuan ||
                                                                "Chưa cập nhật địa chỉ"}
                                                        </span>
                                                    </div>

                                                    <div className="restaurant-meta-item">
                                                        <Bike
                                                            size={17}
                                                            strokeWidth={1.9}
                                                        />

                                                        <span>
                                                            {shippingFee > 0
                                                                ? `Phí giao hàng ${shippingFee.toLocaleString(
                                                                    "vi-VN"
                                                                )}đ`
                                                                : "Miễn phí giao hàng"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="restaurant-card-footer">
                                                    <span>
                                                        Xem thực đơn
                                                    </span>

                                                    <ArrowRight
                                                        size={16}
                                                        strokeWidth={2}
                                                    />
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
