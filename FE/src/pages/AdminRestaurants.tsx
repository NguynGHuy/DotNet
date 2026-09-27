import { useEffect, useState } from "react";
import {
    approveRestaurant,
    getPendingRestaurants,
    rejectRestaurant,
} from "../services/adminService";
import type { PendingRestaurant } from "../services/adminService";

function AdminRestaurants() {
    const [restaurants, setRestaurants] = useState<PendingRestaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getPendingRestaurants()
            .then(setRestaurants)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleDecision = async (
        restaurant: PendingRestaurant,
        approve: boolean
    ) => {
        const action = approve ? "duyệt" : "từ chối";

        if (
            !window.confirm(
                `Bạn chắc chắn muốn ${action} "${restaurant.tenNhaHang}"?`
            )
        ) {
            return;
        }

        try {
            setBusyId(restaurant.maNhaHang);
            setError("");

            if (approve) {
                await approveRestaurant(restaurant.maNhaHang);
            } else {
                await rejectRestaurant(restaurant.maNhaHang);
            }

            setRestaurants(await getPendingRestaurants());
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <main className="admin-restaurants-page">
            <div className="profile-page-header">
                <h1>Duyệt nhà hàng</h1>
                <p>
                    {loading
                        ? "Đang tải..."
                        : `${restaurants.length} nhà hàng đang chờ duyệt`}
                </p>
            </div>

            {error && <p className="auth-error">{error}</p>}

            {loading ? (
                <p>Đang tải danh sách...</p>
            ) : restaurants.length === 0 ? (
                <div className="admin-pending-empty">
                    <span>✓</span>
                    <h2>Đã xử lý hết yêu cầu</h2>
                    <p>Hiện không có nhà hàng nào chờ duyệt.</p>
                </div>
            ) : (
                <div className="admin-pending-list">
                    {restaurants.map((restaurant) => (
                        <article
                            className="admin-pending-card"
                            key={restaurant.maNhaHang}
                        >
                            <div>
                                <span className="admin-pending-badge">
                                    Chờ duyệt
                                </span>
                                <h2>{restaurant.tenNhaHang}</h2>
                                <p>
                                    📍 {restaurant.diaChiQuan || "Chưa có địa chỉ"}
                                </p>
                                <small>
                                    Mã nhà hàng: {restaurant.maNhaHang}
                                </small>
                            </div>

                            <div className="admin-pending-actions">
                                <button
                                    type="button"
                                    className="admin-reject-button"
                                    disabled={busyId === restaurant.maNhaHang}
                                    onClick={() =>
                                        handleDecision(restaurant, false)
                                    }
                                >
                                    Từ chối
                                </button>
                                <button
                                    type="button"
                                    disabled={busyId === restaurant.maNhaHang}
                                    onClick={() =>
                                        handleDecision(restaurant, true)
                                    }
                                >
                                    {busyId === restaurant.maNhaHang
                                        ? "Đang xử lý..."
                                        : "Duyệt nhà hàng"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}

export default AdminRestaurants;