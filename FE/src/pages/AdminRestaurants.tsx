import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Building2,
    Check,
    CheckCircle2,
    Clock3,
    MapPin,
    RefreshCw,
    Search,
    Store,
    X,
    XCircle,
} from "lucide-react";
import {
    approveRestaurant,
    getPendingRestaurants,
    rejectRestaurant,
} from "../services/adminService";
import type { PendingRestaurant } from "../services/adminService";

interface DecisionState {
    restaurant: PendingRestaurant;
    approve: boolean;
}

function AdminRestaurants() {
    const [restaurants, setRestaurants] = useState<PendingRestaurant[]>([]);
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [decision, setDecision] = useState<DecisionState | null>(null);
    const [error, setError] = useState("");

    const loadRestaurants = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError("");

            const result = await getPendingRestaurants();
            setRestaurants(Array.isArray(result) ? result : []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải danh sách nhà hàng."
            );
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRestaurants();
    }, [loadRestaurants]);

    const filteredRestaurants = useMemo(() => {
        const value = keyword.trim().toLocaleLowerCase("vi-VN");

        if (!value) return restaurants;

        return restaurants.filter((restaurant) => {
            const name = restaurant.tenNhaHang.toLocaleLowerCase("vi-VN");
            const address = (restaurant.diaChiQuan ?? "")
                .toLocaleLowerCase("vi-VN");
            const id = String(restaurant.maNhaHang);

            return (
                name.includes(value) ||
                address.includes(value) ||
                id.includes(value)
            );
        });
    }, [keyword, restaurants]);

    const closeDecision = () => {
        if (busyId !== null) return;
        setDecision(null);
    };

    const handleDecision = async () => {
        if (!decision || busyId !== null) return;

        const { restaurant, approve } = decision;

        try {
            setBusyId(restaurant.maNhaHang);
            setError("");

            if (approve) {
                await approveRestaurant(restaurant.maNhaHang);
            } else {
                await rejectRestaurant(restaurant.maNhaHang);
            }

            await loadRestaurants(false);
            setDecision(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : approve
                      ? "Không thể duyệt nhà hàng."
                      : "Không thể từ chối nhà hàng."
            );
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="admin-restaurants-pro">
            <header className="admin-restaurants-heading">
                <div>
                    <span>Kiểm duyệt đối tác</span>
                    <h1>Duyệt nhà hàng</h1>
                    <p>
                        Kiểm tra và xử lý các yêu cầu đăng ký nhà hàng mới.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-restaurants-refresh"
                    disabled={loading}
                    onClick={() => void loadRestaurants()}
                >
                    <RefreshCw size={15} />
                    Tải lại
                </button>
            </header>

            <section className="admin-restaurants-overview">
                <div className="admin-pending-count">
                    <span>
                        <Clock3 size={20} />
                    </span>

                    <div>
                        <small>Đang chờ xử lý</small>
                        <strong>{restaurants.length}</strong>
                    </div>
                </div>

                <div className="admin-pending-description">
                    <Building2 size={18} />
                    <p>
                        Chỉ duyệt những nhà hàng có thông tin đăng ký hợp lệ
                        và đáp ứng điều kiện hoạt động của hệ thống.
                    </p>
                </div>
            </section>

            <section className="admin-restaurants-panel">
                <div className="admin-restaurants-toolbar">
                    <label className="admin-restaurant-search">
                        <Search size={16} />
                        <input
                            type="search"
                            placeholder="Tìm tên, địa chỉ hoặc mã nhà hàng..."
                            value={keyword}
                            onChange={(event) =>
                                setKeyword(event.target.value)
                            }
                        />
                    </label>

                    <span>
                        <strong>{filteredRestaurants.length}</strong> yêu cầu
                    </span>
                </div>

                {error && (
                    <div className="admin-restaurants-error" role="alert">
                        <XCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="admin-restaurants-loading">
                        <RefreshCw size={21} />
                        <span>Đang tải danh sách...</span>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="admin-restaurants-empty">
                        <span>
                            <CheckCircle2 size={27} />
                        </span>
                        <strong>Đã xử lý hết yêu cầu</strong>
                        <p>Hiện không có nhà hàng nào đang chờ duyệt.</p>
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="admin-restaurants-empty">
                        <span>
                            <Search size={25} />
                        </span>
                        <strong>Không tìm thấy nhà hàng</strong>
                        <p>Hãy thử tìm bằng tên hoặc mã nhà hàng khác.</p>
                    </div>
                ) : (
                    <div className="admin-restaurant-request-list">
                        {filteredRestaurants.map((restaurant) => (
                            <article
                                key={restaurant.maNhaHang}
                                className="admin-restaurant-request"
                            >
                                <div className="admin-restaurant-request-icon">
                                    <Store size={21} />
                                </div>

                                <div className="admin-restaurant-request-info">
                                    <div>
                                        <span className="admin-waiting-badge">
                                            <i aria-hidden="true" />
                                            Chờ duyệt
                                        </span>

                                        <small>
                                            Mã #{restaurant.maNhaHang}
                                        </small>
                                    </div>

                                    <h2>{restaurant.tenNhaHang}</h2>

                                    <p>
                                        <MapPin size={14} />
                                        {restaurant.diaChiQuan ||
                                            "Chưa cập nhật địa chỉ"}
                                    </p>
                                </div>

                                <div className="admin-restaurant-request-actions">
                                    <button
                                        type="button"
                                        className="reject"
                                        disabled={busyId !== null}
                                        onClick={() =>
                                            setDecision({
                                                restaurant,
                                                approve: false,
                                            })
                                        }
                                    >
                                        <X size={15} />
                                        Từ chối
                                    </button>

                                    <button
                                        type="button"
                                        className="approve"
                                        disabled={busyId !== null}
                                        onClick={() =>
                                            setDecision({
                                                restaurant,
                                                approve: true,
                                            })
                                        }
                                    >
                                        <Check size={15} />
                                        Duyệt nhà hàng
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {decision && (
                <div
                    className="admin-decision-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-decision-title"
                    onMouseDown={closeDecision}
                >
                    <section
                        className={`admin-decision-dialog ${
                            decision.approve ? "approve" : "reject"
                        }`}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="admin-decision-close"
                            aria-label="Đóng"
                            disabled={busyId !== null}
                            onClick={closeDecision}
                        >
                            <X size={18} />
                        </button>

                        <div className="admin-decision-icon">
                            {decision.approve ? (
                                <CheckCircle2 size={25} />
                            ) : (
                                <XCircle size={25} />
                            )}
                        </div>

                        <h2 id="admin-decision-title">
                            {decision.approve
                                ? "Duyệt nhà hàng?"
                                : "Từ chối nhà hàng?"}
                        </h2>

                        <p>
                            Bạn đang {decision.approve ? "duyệt" : "từ chối"}{" "}
                            <strong>
                                {decision.restaurant.tenNhaHang}
                            </strong>
                            .
                        </p>

                        {!decision.approve && (
                            <div className="admin-decision-warning">
                                Nhà hàng sẽ không thể hoạt động trên hệ thống
                                sau khi bị từ chối.
                            </div>
                        )}

                        <div className="admin-decision-actions">
                            <button
                                type="button"
                                className="cancel"
                                disabled={busyId !== null}
                                onClick={closeDecision}
                            >
                                Quay lại
                            </button>

                            <button
                                type="button"
                                className={
                                    decision.approve ? "approve" : "reject"
                                }
                                disabled={busyId !== null}
                                onClick={() => void handleDecision()}
                            >
                                {busyId !== null
                                    ? "Đang xử lý..."
                                    : decision.approve
                                      ? "Xác nhận duyệt"
                                      : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default AdminRestaurants;