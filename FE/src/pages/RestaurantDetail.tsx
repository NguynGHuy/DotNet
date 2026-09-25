import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../services/api";

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

function RestaurantDetail() {
    const { id } = useParams<{ id: string }>();

    const [restaurant, setRestaurant] =
        useState<Restaurant | null>(null);

    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <main className= "restaurant-detail-page" >
            <div className="detail-loading" >
                <div className="loading-spinner" > </div>
                    < p > Đang tải thông tin nhà hàng...</p>
                        </div>
                        </main>
        );
    }

    if (!restaurant) {
        return (
            <main className= "restaurant-detail-page" >
            <div className="detail-error" >
                <div>😕</div>
                    < h2 > Không tìm thấy nhà hàng </h2>
                        <p>
                        Nhà hàng bạn đang tìm kiếm không tồn tại
                        hoặc đã bị xóa.
                    </p>

            < Link to = "/" className = "back-home-button" >
                        ← Về trang chủ
            </Link>
            </div>
            </main>
        );
    }

    const isOpen =
        restaurant.trangThaiHoatDong === "MoCua";

    return (
        <main className= "restaurant-detail-page" >

        {/* BACK */ }
        < Link to = "/" className = "detail-back" >
                ← Quay lại danh sách nhà hàng
        </Link>

    {/* RESTAURANT HERO */ }
    <section className="restaurant-detail-card" >

    {/* IMAGE */ }
        < div className = "detail-image" >

            {
                restaurant.anhBia ? (
                    <img
                            src= { restaurant.anhBia }
                            alt={ restaurant.tenNhaHang }
                />
                    ) : (
                    <div className="detail-image-placeholder" >
                            🍽️
                    </div>
                )
}

<span
                        className={
    isOpen
        ? "detail-status open"
        : "detail-status closed"
}
                    >
{
    isOpen
    ? "● Đang mở cửa"
        : "● Đóng cửa"
}
    </span>
    </div>

{/* CONTENT */ }
<div className="detail-content" >

    <div className="detail-title-row" >

        <div>
        <h1>
        { restaurant.tenNhaHang }
        </h1>

        < div className = "detail-rating" >
                                ⭐{ " " }
{
    restaurant.danhGiaTrungBinh !==
    undefined
    ? restaurant.danhGiaTrungBinh.toFixed(
        1
    )
    : "Chưa có đánh giá"
}
</div>
    </div>

    </div>

{/* INFO */ }
<div className="detail-info-list" >

    <div className="detail-info-item" >
        <span className="detail-info-icon" >
                                📍
</span>

    < div >
    <span className="detail-info-label" >
        Địa chỉ
            </span>

            <p>
{
    restaurant.diaChiQuan ||
    "Chưa có địa chỉ"
}
</p>
    </div>
    </div>

    < div className = "detail-info-item" >
        <span className="detail-info-icon" >
                                🕐
</span>

    < div >
    <span className="detail-info-label" >
        Giờ hoạt động
            </span>

            <p>
{
    restaurant.gioMoCua
    ? restaurant.gioMoCua.slice(
        0,
        5
    )
    : "--:--"
}

{ " - " }

{
    restaurant.gioDongCua
    ? restaurant.gioDongCua.slice(
        0,
        5
    )
    : "--:--"
}
</p>
    </div>
    </div>

    < div className = "detail-info-item" >
        <span className="detail-info-icon" >
                                🛵
</span>

    < div >
    <span className="detail-info-label" >
        Phí giao hàng
            </span>

            <p>
{
    restaurant.phiShipMacDinh !==
    undefined
    ? restaurant.phiShipMacDinh.toLocaleString(
        "vi-VN"
    )
    : "0"
} { " " }
đ
    </p>
    </div>
    </div>

    </div>

{/* DESCRIPTION */ }
<div className="detail-description" >

    <h3>
    Về nhà hàng
        </h3>

        <p>
{
    restaurant.moTa ||
    "Chưa có mô tả về nhà hàng."
}
</p>

    </div>

{/* ACTION */ }
<div className="detail-actions" >

    <button
                            className="menu-button"
disabled = {!isOpen}
                        >
    <span>🍽️</span>

{
    isOpen
        ? "Xem thực đơn"
        : "Nhà hàng đang đóng cửa"
}

{
    isOpen && (
        <span>→</span>
                            )
}
</button>

    </div>

    </div>
    </section>

    </main>
    );
}

export default RestaurantDetail;