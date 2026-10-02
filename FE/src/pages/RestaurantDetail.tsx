import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import { apiFetch } from "../services/api";

import {
    getDanhMucs,
    type DanhMuc,
} from "../services/categoryService";

import {
    getMonAns,
    type MonAn,
} from "../services/menuService";

import RestaurantReviews from "../components/RestaurantReviews";
import type { Restaurant } from "../services/restaurantService";
import FoodReviews from "../components/FoodReviews";

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

/* =========================================================
   KIỂM TRA NHÀ HÀNG CÓ ĐANG MỞ CỬA
========================================================= */

function isRestaurantOpen(
    restaurant: Restaurant
): boolean {
    if (
        restaurant.trangThaiHoatDong !==
        "MoCua"
    ) {
        return false;
    }

    if (
        !restaurant.gioMoCua ||
        !restaurant.gioDongCua
    ) {
        return true;
    }

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    const [openHour, openMinute] =
        restaurant.gioMoCua
            .slice(0, 5)
            .split(":")
            .map(Number);

    const [closeHour, closeMinute] =
        restaurant.gioDongCua
            .slice(0, 5)
            .split(":")
            .map(Number);

    const openMinutes =
        openHour * 60 + openMinute;

    const closeMinutes =
        closeHour * 60 + closeMinute;

    // Trường hợp mở và đóng trong cùng ngày
    if (openMinutes <= closeMinutes) {
        return (
            currentMinutes >= openMinutes &&
            currentMinutes < closeMinutes
        );
    }

    // Trường hợp mở xuyên đêm
    return (
        currentMinutes >= openMinutes ||
        currentMinutes < closeMinutes
    );
}

/* =========================================================
   FORMAT TIỀN
========================================================= */

function formatMoney(value: number) {
    return `${Number(
        value || 0
    ).toLocaleString("vi-VN")} đ`;
}

/* =========================================================
   COMPONENT
========================================================= */

function RestaurantDetail() {
    const { id } =
        useParams<{ id: string }>();

    const menuRef =
        useRef<HTMLElement | null>(null);

    /* =========================
       NHÀ HÀNG
    ========================= */

    const [restaurant, setRestaurant] =
        useState<Restaurant | null>(null);

    const [loadedRestaurantId, setLoadedRestaurantId] =
        useState<string | null>(null);

    const loading = loadedRestaurantId !== id;

    const [error, setError] =
        useState("");

    /* =========================
       MENU
    ========================= */

    const [danhMucs, setDanhMucs] =
        useState<DanhMuc[]>([]);

    const [monAns, setMonAns] =
        useState<MonAn[]>([]);

    const [menuLoading, setMenuLoading] =
        useState(true);

    const [menuError, setMenuError] =
        useState("");

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState<number>(0);

    const [searchTerm, setSearchTerm] =
        useState("");

    /* =========================
       TIME
    ========================= */

    const [currentTime, setCurrentTime] =
        useState(new Date());

    /* =========================================================
       LOAD NHÀ HÀNG
    ========================================================= */

    useEffect(() => {
        const restaurantId = Number(id);

        if (!id || !Number.isInteger(restaurantId) || restaurantId <= 0) {
            return;
        }

        let cancelled = false;

        const loadRestaurant = async () => {
            try {
                const data = await apiFetch(`/nha-hang/${restaurantId}`);

                if (cancelled) return;

                setRestaurant(data);
                setError("");
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Không thể tải thông tin nhà hàng."
                );
                setRestaurant(null);
            } finally {
                if (!cancelled) {
                    setLoadedRestaurantId(id);
                }
            }
        };

        void loadRestaurant();

        return () => {
            cancelled = true;
        };
    }, [id]);

    /* =========================================================
       LOAD MENU + DANH MỤC
    ========================================================= */

    useEffect(() => {
        if (!restaurant?.maNhaHang) {
            return;
        }

        const loadMenu = async () => {
            try {
                setMenuLoading(true);
                setMenuError("");

                const [
                    categoryData,
                    menuData,
                ] = await Promise.all([
                    getDanhMucs(
                        restaurant.maNhaHang
                    ),

                    getMonAns(
                        restaurant.maNhaHang
                    ),
                ]);

                /* =========================
                   SẮP XẾP DANH MỤC
                ========================= */

                const sortedCategories =
                    [...categoryData].sort(
                        (a, b) =>
                            (a.thuTuHienThi ??
                                0) -
                            (b.thuTuHienThi ??
                                0)
                    );

                setDanhMucs(
                    sortedCategories
                );

                /*
                    Khách chỉ thấy món
                    đang được quán bật bán.
                */
                const activeFoods =
                    menuData.filter(
                        (item) =>
                            item.trangThai
                    );

                setMonAns(activeFoods);
            } catch (err) {
                console.error(
                    "Lỗi tải thực đơn:",
                    err
                );

                setMenuError(
                    err instanceof Error
                        ? err.message
                        : "Không thể tải thực đơn."
                );

                setDanhMucs([]);
                setMonAns([]);
            } finally {
                setMenuLoading(false);
            }
        };

        loadMenu();
    }, [restaurant?.maNhaHang]);

    /* =========================================================
       CẬP NHẬT GIỜ
    ========================================================= */

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);

        return () =>
            clearInterval(timer);
    }, []);

    /*
        currentTime được dùng để component
        render lại mỗi 30 giây và tính
        trạng thái mở/đóng lại.
    */
    void currentTime;

    /* =========================================================
       FILTER MENU
    ========================================================= */

    const filteredFoods =
        useMemo(() => {
            const keyword =
                searchTerm
                    .trim()
                    .toLowerCase();

            return monAns.filter(
                (item) => {
                    const matchCategory =
                        selectedCategory ===
                            0 ||
                        item.maDanhMuc ===
                            selectedCategory;

                    const matchSearch =
                        !keyword ||
                        item.tenMonAn
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        (
                            item.moTa ?? ""
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            );

                    return (
                        matchCategory &&
                        matchSearch
                    );
                }
            );
        }, [
            monAns,
            selectedCategory,
            searchTerm,
        ]);

    /* =========================================================
       SCROLL ĐẾN MENU
    ========================================================= */

    const handleViewMenu = () => {
        menuRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    /* =========================================================
       LOADING
    ========================================================= */

    const restaurantId = Number(id);

    if (!id || !Number.isInteger(restaurantId) || restaurantId <= 0) {
        return (
            <main className="restaurant-detail-page">
                <p className="auth-error">Mã nhà hàng không hợp lệ.</p>
                <Link to="/">← Về trang chủ</Link>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="restaurant-detail-page">
                <div className="detail-loading">
                    <div className="loading-spinner" />

                    <p>
                        Đang tải thông tin
                        nhà hàng...
                    </p>
                </div>
            </main>
        );
    }

    /* =========================================================
       ERROR
    ========================================================= */

    if (
        error ||
        !restaurant
    ) {
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
                        {error ||
                            "Nhà hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."}
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

    const isOpen =
        isRestaurantOpen(restaurant);

    const rating =
        restaurant.danhGiaTrungBinh ??
        0;

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <main className="restaurant-detail-page">
            <div className="restaurant-detail-container">
                {/* =========================
                    BACK
                ========================= */}

                <Link
                    to="/nha-hang"
                    className="restaurant-detail-back"
                >
                    <span>←</span>
                    Tất cả nhà hàng
                </Link>

                {/* =========================
                    HERO
                ========================= */}

                <section className="restaurant-detail-hero">
                    {/* IMAGE */}

                    <div className="restaurant-detail-image">
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
                            <div className="restaurant-detail-placeholder">
                                <span>
                                    🍽️
                                </span>
                            </div>
                        )}

                        <div
                            className={
                                isOpen
                                    ? "restaurant-detail-status open"
                                    : "restaurant-detail-status closed"
                            }
                        >
                            <span>
                                ●
                            </span>

                            {isOpen
                                ? "Đang mở cửa"
                                : "Đóng cửa"}
                        </div>
                    </div>

                    {/* =========================
                        INFO
                    ========================= */}

                    <div className="restaurant-detail-main">
                        <div className="restaurant-detail-heading">
                            <div>
                                <span className="restaurant-detail-eyebrow">
                                    NHÀ HÀNG
                                </span>

                                <h1>
                                    {
                                        restaurant.tenNhaHang
                                    }
                                </h1>
                            </div>

                            <div className="restaurant-detail-rating">
                                <span className="rating-star">
                                    ★
                                </span>

                                <strong>
                                    {rating >
                                    0
                                        ? rating.toFixed(
                                              1
                                          )
                                        : "—"}
                                </strong>

                                <span>
                                    {rating >
                                    0
                                        ? "Đánh giá"
                                        : "Chưa có đánh giá"}
                                </span>
                            </div>
                        </div>

                        {/* =========================
                            QUICK INFO
                        ========================= */}

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
                                        {formatMoney(
                                            restaurant.phiShipMacDinh ??
                                                0
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* =========================
                            DESCRIPTION
                        ========================= */}

                        <div className="restaurant-detail-description">
                            <h2>
                                Về nhà hàng
                            </h2>

                            <p>
                                {restaurant.moTa ||
                                    "Nhà hàng chưa cập nhật mô tả."}
                            </p>
                        </div>

                        {/* =========================
                            ACTION
                        ========================= */}

                        <div className="restaurant-detail-action">
                            <button
                                type="button"
                                className="restaurant-detail-menu-button"
                                onClick={
                                    handleViewMenu
                                }
                            >
                                <span>
                                    🍽️
                                </span>

                                <span>
                                    Xem thực đơn
                                </span>

                                <span className="menu-arrow">
                                    ↓
                                </span>
                            </button>

                            {!isOpen && (
                                <p className="customer-menu-closed-note">
                                    Nhà hàng đang
                                    đóng cửa. Bạn
                                    vẫn có thể xem
                                    thực đơn nhưng
                                    hiện chưa thể
                                    đặt món.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* =================================================
                    MENU KHÁCH HÀNG
                ================================================= */}

                <section
                    ref={menuRef}
                    className="customer-menu-section"
                >
                    {/* TITLE */}

                    <div className="customer-menu-heading">
                        <div>
                            <span className="customer-menu-eyebrow">
                                THỰC ĐƠN
                            </span>

                            <h2>
                                Món ăn của{" "}
                                {
                                    restaurant.tenNhaHang
                                }
                            </h2>

                            <p>
                                Khám phá các món
                                đang được phục vụ
                                tại nhà hàng.
                            </p>
                        </div>

                        <div className="customer-menu-count">
                            {
                                filteredFoods.length
                            }{" "}
                            món
                        </div>
                    </div>

                    {/* =========================
                        SEARCH
                    ========================= */}

                    <div className="customer-menu-toolbar">
                        <div className="customer-menu-search">
                            <span>
                                🔍
                            </span>

                            <input
                                type="text"
                                placeholder="Tìm món ăn..."
                                value={
                                    searchTerm
                                }
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target
                                            .value
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* =========================
                        CATEGORY
                    ========================= */}

                    <div className="customer-menu-categories">
                        <button
                            type="button"
                            className={
                                selectedCategory ===
                                0
                                    ? "customer-category-button active"
                                    : "customer-category-button"
                            }
                            onClick={() =>
                                setSelectedCategory(
                                    0
                                )
                            }
                        >
                            Tất cả
                        </button>

                        {danhMucs.map(
                            (category) => (
                                <button
                                    type="button"
                                    key={
                                        category.maDanhMuc
                                    }
                                    className={
                                        selectedCategory ===
                                        category.maDanhMuc
                                            ? "customer-category-button active"
                                            : "customer-category-button"
                                    }
                                    onClick={() =>
                                        setSelectedCategory(
                                            category.maDanhMuc
                                        )
                                    }
                                >
                                    {
                                        category.tenDanhMuc
                                    }
                                </button>
                            )
                        )}
                    </div>

                    {/* =========================
                        CONTENT
                    ========================= */}

                    {menuLoading ? (
                        <div className="customer-menu-state">
                            <div className="loading-spinner" />

                            <p>
                                Đang tải thực
                                đơn...
                            </p>
                        </div>
                    ) : menuError ? (
                        <div className="customer-menu-state error">
                            <div>
                                ⚠️
                            </div>

                            <h3>
                                Không thể tải
                                thực đơn
                            </h3>

                            <p>
                                {menuError}
                            </p>
                        </div>
                    ) : monAns.length ===
                      0 ? (
                        <div className="customer-menu-state">
                            <div className="customer-menu-empty-icon">
                                🍽️
                            </div>

                            <h3>
                                Nhà hàng chưa có
                                món ăn
                            </h3>

                            <p>
                                Thực đơn đang được
                                cập nhật.
                            </p>
                        </div>
                    ) : filteredFoods.length ===
                      0 ? (
                        <div className="customer-menu-state">
                            <div className="customer-menu-empty-icon">
                                🔎
                            </div>

                            <h3>
                                Không tìm thấy món
                            </h3>

                            <p>
                                Hãy thử danh mục
                                hoặc từ khóa khác.
                            </p>
                        </div>
                    ) : (
                        <div className="customer-menu-grid">
                            {filteredFoods.map(
                                (item) => (
                                    <article
                                        key={
                                            item.maMonAn
                                        }
                                        className="customer-food-card"
                                    >
                                        {/* IMAGE */}

                                        <div className="customer-food-image">
                                            {item.hinhAnh ? (
                                                <img
                                                    src={
                                                        item.hinhAnh
                                                    }
                                                    alt={
                                                        item.tenMonAn
                                                    }
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="customer-food-placeholder">
                                                    🍜
                                                </div>
                                            )}

                                            <span className="customer-food-category">
                                                {
                                                    item.tenDanhMuc
                                                }
                                            </span>
                                        </div>

                                        {/* BODY */}

                                        <div className="customer-food-content">
                                            <div className="customer-food-top">
                                                <h3>
                                                    {
                                                        item.tenMonAn
                                                    }
                                                </h3>

                                                {item.danhGiaTrungBinh >
                                                    0 && (
                                                    <span className="customer-food-rating">
                                                        ★{" "}
                                                        {item.danhGiaTrungBinh.toFixed(
                                                            1
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="customer-food-description">
                                                {item.moTa ||
                                                    "Món ăn của nhà hàng."}
                                            </p>

                                            <div className="customer-food-bottom">
                                                <strong className="customer-food-price">
                                                    {formatMoney(
                                                        item.gia
                                                    )}
                                                </strong>

                                                <span className="customer-food-available">
                                                    ● Đang bán
                                                </span>
                                            </div>
                                            <FoodReviews maMonAn={item.maMonAn} />

                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>

                {/* =================================================
                    REVIEWS
                ================================================= */}

                <section className="restaurant-detail-reviews">
                    <RestaurantReviews
                        maNhaHang={
                            restaurant.maNhaHang
                        }
                    />
                </section>
            </div>
        </main>
    );
}

export default RestaurantDetail;