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

    // Trường hợp quán mở qua đêm
    return (
        currentMinutes >= openMinutes ||
        currentMinutes < closeMinutes
    );
}

function Home() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        getRestaurants()
            .then((data) => {
                console.log("Danh sách nhà hàng:", data);

                // Sắp xếp theo đánh giá cao → thấp
                // rồi lấy tối đa 6 nhà hàng
                const featuredRestaurants = [...data]
                    .sort(
                        (a: Restaurant, b: Restaurant) =>
                            (b.danhGiaTrungBinh ?? 0) -
                            (a.danhGiaTrungBinh ?? 0)
                    )
                    .slice(0, 6);

                setRestaurants(featuredRestaurants);
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

        return () => {
            clearInterval(timer);
        };
    }, []);

    void currentTime;

    return (
        <main className="home-page">

            {/* =========================
                HERO
            ========================= */}
            <section className="home-hero">
                <div className="home-hero-content">

                    <h1>
                        Đặt món ngon,
                        <br />
                        giao tận nơi 🍜
                    </h1>

                    <p>
                        Khám phá những nhà hàng yêu thích
                        và đặt món ăn ngay hôm nay.
                    </p>

                    <Link
                        to="/nha-hang"
                        className="hero-button"
                    >
                        Khám phá nhà hàng
                    </Link>

                </div>
            </section>


            {/* =========================
                NHÀ HÀNG NỔI BẬT
            ========================= */}
            <section className="restaurant-section">

                <div className="section-header">

                    <div>
                        <h2>
                            Nhà hàng nổi bật
                        </h2>

                        <p>
                            Những nhà hàng được đánh giá cao
                        </p>
                    </div>

                    <Link
                        to="/nha-hang"
                        className="view-all-link"
                    >
                        Xem tất cả →
                    </Link>

                </div>


                {loading && (
                    <p className="restaurant-message">
                        Đang tải nhà hàng...
                    </p>
                )}


                {error && (
                    <p className="restaurant-error">
                        {error}
                    </p>
                )}


                {!loading &&
                    !error &&
                    restaurants.length === 0 && (
                        <p className="restaurant-message">
                            Hiện chưa có nhà hàng.
                        </p>
                    )}


                {!loading &&
                    !error &&
                    restaurants.length > 0 && (

                        <div className="restaurant-grid">

                            {restaurants.map((restaurant) => {

                                const isOpen =
                                    isRestaurantOpen(
                                        restaurant
                                    );

                                return (
                                    <Link
                                        key={
                                            restaurant.maNhaHang
                                        }
                                        to={`/nha-hang/${restaurant.maNhaHang}`}
                                        className="restaurant-card"
                                    >

                                        <div className="restaurant-image">

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
                                                <div className="restaurant-image-placeholder">
                                                    🍽️
                                                </div>
                                            )}

                                            <span
                                                className={
                                                    isOpen
                                                        ? "restaurant-status open"
                                                        : "restaurant-status closed"
                                                }
                                            >
                                                {isOpen
                                                    ? "● Đang mở cửa"
                                                    : "● Đóng cửa"}
                                            </span>

                                        </div>


                                        <div className="restaurant-card-content">

                                            <h3>
                                                {
                                                    restaurant.tenNhaHang
                                                }
                                            </h3>

                                            <div className="restaurant-rating">
                                                ⭐{" "}
                                                {(
                                                    restaurant.danhGiaTrungBinh ??
                                                    0
                                                ).toFixed(1)}
                                            </div>

                                            {restaurant.moTa && (
                                                <p className="restaurant-description">
                                                    {
                                                        restaurant.moTa
                                                    }
                                                </p>
                                            )}

                                            {restaurant.diaChiQuan && (
                                                <p className="restaurant-address">
                                                    📍{" "}
                                                    {
                                                        restaurant.diaChiQuan
                                                    }
                                                </p>
                                            )}

                                            <p className="restaurant-shipping">
                                                🚚 Phí ship:{" "}
                                                {(
                                                    restaurant.phiShipMacDinh ??
                                                    0
                                                ).toLocaleString(
                                                    "vi-VN"
                                                )}
                                                đ
                                            </p>

                                        </div>

                                    </Link>
                                );
                            })}

                        </div>
                    )}


            </section>

        </main>
    );
}

export default Home;