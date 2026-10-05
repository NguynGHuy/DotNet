import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import { apiFetch } from "../services/api";

import {
    getDanhMucs,
    type DanhMuc,
} from "../services/categoryService";

import {
    getMonAn,
    getMonAns,
    type MonAn,
    type MonAnChiTiet,
    type NhomToppingMonAn,
} from "../services/menuService";

import { addToCart, clearCart } from "../services/cartService"; // Đã thêm clearCart

import RestaurantReviews from "../components/RestaurantReviews";
import FoodReviews from "../components/FoodReviews";

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
    const navigate = useNavigate();

    const { id } =
        useParams<{ id: string }>();

    const menuRef =
        useRef<HTMLElement | null>(null);

    /* =========================
       NHÀ HÀNG
    ========================= */

    const [restaurant, setRestaurant] =
        useState<Restaurant | null>(null);

    const [loading, setLoading] =
        useState(Boolean(id));

    const [error, setError] =
        useState(
            id ? "" : "Mã nhà hàng không hợp lệ."
        );

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

    const [foodDialogOpen, setFoodDialogOpen] =
        useState(false);

    const [selectedFood, setSelectedFood] =
        useState<MonAnChiTiet | null>(null);

    const [foodLoading, setFoodLoading] =
        useState(false);

    const [foodActionError, setFoodActionError] =
        useState("");

    const [foodSuccess, setFoodSuccess] =
        useState("");

    const [selectedToppingIds, setSelectedToppingIds] =
        useState<number[]>([]);

    const [quantity, setQuantity] =
        useState(1);

    const [note, setNote] =
        useState("");

    const [addingToCart, setAddingToCart] =
        useState(false);

    /* STATE XỬ LÝ TRÙNG QUÁN TRONG GIỎ HÀNG */
    const [conflictDialog, setConflictDialog] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    /* =========================
       TIME
    ========================= */

    const [currentTime, setCurrentTime] =
        useState(new Date());

    /* =========================================================
       LOAD NHÀ HÀNG
    ========================================================= */

    useEffect(() => {
        if (!id) {
            return;
        }

        const loadRestaurant = async () => {
            try {
                setLoading(true);
                setError("");

                const data =
                    await apiFetch(
                        `/nha-hang/${id}`
                    );

                setRestaurant(data);
            } catch (err) {
                console.error(
                    "Lỗi tải nhà hàng:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Không thể tải thông tin nhà hàng."
                );

                setRestaurant(null);
            } finally {
                setLoading(false);
            }
        };

        loadRestaurant();
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

    const closeFoodDialog = useCallback(() => {
        if (addingToCart) return;

        setFoodDialogOpen(false);
        setSelectedFood(null);
        setSelectedToppingIds([]);
        setQuantity(1);
        setNote("");
        setFoodActionError("");
        setFoodSuccess("");
        setConflictDialog(false);
    }, [addingToCart]);

    const handleOpenFood = async (item: MonAn) => {
        setFoodDialogOpen(true);
        setSelectedFood(null);
        setSelectedToppingIds([]);
        setQuantity(1);
        setNote("");
        setFoodActionError("");
        setFoodSuccess("");
        setConflictDialog(false);

        try {
            setFoodLoading(true);
            const detail = await getMonAn(item.maMonAn);
            setSelectedFood(detail);
        } catch (err) {
            setFoodActionError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải thông tin món ăn."
            );
        } finally {
            setFoodLoading(false);
        }
    };

    const handleToggleTopping = (
        group: NhomToppingMonAn,
        toppingId: number
    ) => {
        setFoodActionError("");
        setFoodSuccess("");

        if (selectedToppingIds.includes(toppingId)) {
            setSelectedToppingIds((current) =>
                current.filter((id) => id !== toppingId)
            );
            return;
        }

        const idsInGroup = new Set(
            group.toppings.map((topping) => topping.maTopping)
        );

        const selectedInGroup = selectedToppingIds.filter((id) =>
            idsInGroup.has(id)
        );

        if (group.chonToiDa === 1) {
            setSelectedToppingIds((current) => [
                ...current.filter((id) => !idsInGroup.has(id)),
                toppingId,
            ]);
            return;
        }

        if (
            group.chonToiDa !== null &&
            selectedInGroup.length >= group.chonToiDa
        ) {
            setFoodActionError(
                `Nhóm “${group.tenNhom}” chỉ được chọn tối đa ${group.chonToiDa} lựa chọn.`
            );
            return;
        }

        setSelectedToppingIds((current) => [...current, toppingId]);
    };

    // Hàm gọi khi bấm Thêm vào giỏ
    const handleAddToCart = async () => {
        if (!selectedFood) return;

        if (!localStorage.getItem("token")) {
            navigate("/dang-nhap");
            return;
        }

        if (!restaurant || !isRestaurantOpen(restaurant)) {
            setFoodActionError("Nhà hàng đang đóng cửa nên chưa thể nhận đơn.");
            return;
        }

        const missingRequiredGroup = selectedFood.nhomToppings.find(
            (group) =>
                group.batBuocChon &&
                !group.toppings.some((topping) =>
                    selectedToppingIds.includes(topping.maTopping)
                )
        );

        if (missingRequiredGroup) {
            setFoodActionError(
                `Vui lòng chọn ít nhất một lựa chọn trong nhóm “${missingRequiredGroup.tenNhom}”.`
            );
            return;
        }

        try {
            setAddingToCart(true);
            setFoodActionError("");
            setFoodSuccess("");

            await addToCart({
                maMonAn: selectedFood.maMonAn,
                soLuong: quantity,
                ghiChu: note.trim() || undefined,
                danhSachMaTopping: selectedToppingIds,
            });

            setFoodSuccess("Đã thêm món vào giỏ hàng.");
            window.dispatchEvent(new Event("cart-updated"));
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Lỗi không xác định";
            // Bắt lỗi trùng quán từ Backend để bật hộp thoại thay vì báo dòng chữ đỏ
            if (errMsg.includes("quán khác")) {
                setConflictDialog(true);
            } else {
                setFoodActionError(errMsg);
            }
        } finally {
            setAddingToCart(false);
        }
    };

    // Xử lý khi user bấm nút "Xóa giỏ và thêm món mới"
    const handleConfirmClearAndAdd = async () => {
        if (!selectedFood) return;
        try {
            setIsClearing(true);
            await clearCart(); // Xóa sạch giỏ cũ
            
            // Gọi lại API thêm món
            await addToCart({
                maMonAn: selectedFood.maMonAn,
                soLuong: quantity,
                ghiChu: note.trim() || undefined,
                danhSachMaTopping: selectedToppingIds,
            });
            
            setConflictDialog(false); // Đóng popup hỏi
            setFoodSuccess("Đã xóa giỏ hàng cũ và thêm món thành công.");
            window.dispatchEvent(new Event("cart-updated"));
        } catch (err) {
            setFoodActionError(err instanceof Error ? err.message : "Lỗi khi thêm món.");
            setConflictDialog(false);
        } finally {
            setIsClearing(false);
        }
    };

    useEffect(() => {
        // Chỉ khóa scroll khi có popup hiện lên
        if (foodDialogOpen || conflictDialog) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (conflictDialog) {
                    setConflictDialog(false);
                } else if (foodDialogOpen) {
                    closeFoodDialog();
                }
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [foodDialogOpen, conflictDialog, closeFoodDialog]);

    /* =========================================================
       LOADING
    ========================================================= */

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

    const selectedToppingsPrice =
        selectedFood?.nhomToppings
            .flatMap((group) => group.toppings)
            .filter((topping) =>
                selectedToppingIds.includes(topping.maTopping)
            )
            .reduce((total, topping) => total + topping.giaThem, 0) ?? 0;

    const selectedFoodTotal = selectedFood
        ? (selectedFood.gia + selectedToppingsPrice) * quantity
        : 0;

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
                                        role="button"
                                        tabIndex={0}
                                        aria-haspopup="dialog"
                                        onClick={() =>
                                            handleOpenFood(item)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();
                                                handleOpenFood(item);
                                            }
                                        }}
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

                {foodDialogOpen && (
                    <div
                        className="food-order-overlay"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeFoodDialog();
                            }
                        }}
                    >
                        <section
                            className="food-order-dialog"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="food-order-title"
                        >
                            <button
                                type="button"
                                className="food-order-close"
                                aria-label="Đóng"
                                disabled={addingToCart || isClearing}
                                onClick={closeFoodDialog}
                            >
                                ×
                            </button>

                            {foodLoading ? (
                                <div className="food-order-state">
                                    <div className="loading-spinner" />
                                    <p>Đang tải thông tin món...</p>
                                </div>
                            ) : !selectedFood ? (
                                <div className="food-order-state error">
                                    <strong>Không thể mở món ăn</strong>
                                    <p>
                                        {foodActionError ||
                                            "Món ăn không tồn tại hoặc đã ngừng bán."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="food-order-hero">
                                        <div className="food-order-image">
                                            {selectedFood.hinhAnh ? (
                                                <img
                                                    src={selectedFood.hinhAnh}
                                                    alt={selectedFood.tenMonAn}
                                                />
                                            ) : (
                                                <div>🍜</div>
                                            )}
                                        </div>

                                        <div className="food-order-summary">
                                            <span>{selectedFood.tenDanhMuc}</span>
                                            <h2 id="food-order-title">
                                                {selectedFood.tenMonAn}
                                            </h2>
                                            <p>
                                                {selectedFood.moTa ||
                                                    "Món ăn của nhà hàng."}
                                            </p>
                                            <strong>
                                                {formatMoney(selectedFood.gia)}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="food-order-body">
                                        {selectedFood.nhomToppings.map(
                                            (group) => (
                                                <fieldset
                                                    className="food-topping-group"
                                                    key={group.maNhomTopping}
                                                >
                                                    <legend>
                                                        <span>
                                                            {group.tenNhom}
                                                            {group.batBuocChon && (
                                                                <b> Bắt buộc</b>
                                                            )}
                                                        </span>
                                                        <small>
                                                            {group.chonToiDa === null
                                                                ? "Chọn tùy thích"
                                                                : `Chọn tối đa ${group.chonToiDa}`}
                                                        </small>
                                                    </legend>

                                                    {group.toppings.length === 0 ? (
                                                        <p className="food-topping-empty">
                                                            Nhóm này chưa có lựa chọn khả dụng.
                                                        </p>
                                                    ) : (
                                                        <div className="food-topping-list">
                                                            {group.toppings.map(
                                                                (topping) => (
                                                                    <label
                                                                        className="food-topping-option"
                                                                        key={topping.maTopping}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedToppingIds.includes(
                                                                                topping.maTopping
                                                                            )}
                                                                            onChange={() =>
                                                                                handleToggleTopping(
                                                                                    group,
                                                                                    topping.maTopping
                                                                                )
                                                                            }
                                                                        />
                                                                        <span>
                                                                            {topping.tenTopping}
                                                                        </span>
                                                                        <strong>
                                                                            {topping.giaThem > 0
                                                                                ? `+${formatMoney(
                                                                                      topping.giaThem
                                                                                  )}`
                                                                                : "Miễn phí"}
                                                                        </strong>
                                                                    </label>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </fieldset>
                                            )
                                        )}

                                        <div className="food-order-note">
                                            <label htmlFor="food-note">
                                                Ghi chú cho quán
                                            </label>
                                            <textarea
                                                id="food-note"
                                                maxLength={200}
                                                rows={3}
                                                value={note}
                                                placeholder="Ví dụ: ít cay, không hành..."
                                                onChange={(event) => {
                                                    setNote(event.target.value);
                                                    setFoodSuccess("");
                                                }}
                                            />
                                            <small>{note.length}/200</small>
                                        </div>

                                        <div className="food-order-quantity-row">
                                            <span>Số lượng</span>
                                            <div className="food-order-quantity">
                                                <button
                                                    type="button"
                                                    aria-label="Giảm số lượng"
                                                    disabled={quantity <= 1}
                                                    onClick={() => {
                                                        setQuantity((value) =>
                                                            Math.max(1, value - 1)
                                                        );
                                                        setFoodSuccess("");
                                                    }}
                                                >
                                                    −
                                                </button>
                                                <strong>{quantity}</strong>
                                                <button
                                                    type="button"
                                                    aria-label="Tăng số lượng"
                                                    disabled={quantity >= 100}
                                                    onClick={() => {
                                                        setQuantity((value) =>
                                                            Math.min(100, value + 1)
                                                        );
                                                        setFoodSuccess("");
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {foodActionError && !conflictDialog && (
                                            <p className="food-order-message error">
                                                {foodActionError}
                                            </p>
                                        )}

                                        {foodSuccess && (
                                            <p className="food-order-message success">
                                                {foodSuccess}
                                            </p>
                                        )}
                                    </div>

                                    <div className="food-order-footer">
                                        {foodSuccess ? (
                                            <button
                                                type="button"
                                                className="food-order-cart-link"
                                                onClick={() => navigate("/gio-hang")}
                                            >
                                                Xem giỏ hàng
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="food-order-submit"
                                                disabled={
                                                    addingToCart || !isOpen || isClearing
                                                }
                                                onClick={handleAddToCart}
                                            >
                                                <span>
                                                    {addingToCart
                                                        ? "Đang thêm..."
                                                        : isOpen
                                                          ? "Thêm vào giỏ"
                                                          : "Nhà hàng đang đóng cửa"}
                                                </span>
                                                {isOpen && !addingToCart && (
                                                    <strong>
                                                        {formatMoney(
                                                            selectedFoodTotal
                                                        )}
                                                    </strong>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </section>

                        {/* HỘP THOẠI XÁC NHẬN KHI BỊ TRÙNG QUÁN TRONG GIỎ HÀNG */}
                        {conflictDialog && (
                            <div className="conflict-overlay">
                                <div className="conflict-dialog">
                                    <h3>Tạo giỏ hàng mới?</h3>
                                    <p>Giỏ hàng của bạn đang có món từ quán khác. Để thêm món từ <strong>{restaurant.tenNhaHang}</strong>, các món trong giỏ hiện tại sẽ bị xóa.</p>
                                    <div className="conflict-actions">
                                        <button 
                                            className="conflict-btn-cancel" 
                                            disabled={isClearing} 
                                            onClick={() => setConflictDialog(false)}
                                        >
                                            Giữ giỏ hiện tại
                                        </button>
                                        <button 
                                            className="conflict-btn-confirm" 
                                            disabled={isClearing} 
                                            onClick={handleConfirmClearAndAdd}
                                        >
                                            {isClearing ? "Đang xử lý..." : "Xóa giỏ và thêm món mới"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default RestaurantDetail;