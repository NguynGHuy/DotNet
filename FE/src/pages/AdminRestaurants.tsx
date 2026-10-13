import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import Pagination from "../components/Pagination";

interface DecisionState {
    restaurant: PendingRestaurant;
    approve: boolean;
}

function AdminRestaurants() {
    const PAGE_SIZE = 10;
    const [restaurants, setRestaurants] = useState<PendingRestaurant[]>([]);
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [decision, setDecision] = useState<DecisionState | null>(null);
    const [error, setError] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [rejectReason, setRejectReason] = useState("");

    const loadRestaurants = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError("");

            const result = await getPendingRestaurants({
                pageNumber,
                pageSize: PAGE_SIZE,
                search: keyword.trim() || undefined,
            });
            setRestaurants(result.items);
            setTotalItems(result.totalItems);
            setTotalPages(result.totalPages);
            if (result.pageNumber !== pageNumber) setPageNumber(result.pageNumber);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải danh sách nhà hàng."
            );
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [keyword, pageNumber]);

    useEffect(() => {
        let cancelled = false;

        getPendingRestaurants({
            pageNumber,
            pageSize: PAGE_SIZE,
            search: keyword.trim() || undefined,
        })
            .then((result) => {
                if (cancelled) return;

                setRestaurants(result.items);
                setTotalItems(result.totalItems);
                setTotalPages(result.totalPages);
                setError("");

                if (result.pageNumber !== pageNumber) {
                    setPageNumber(result.pageNumber);
                }
            })
            .catch((err: unknown) => {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Không thể tải danh sách nhà hàng."
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [keyword, pageNumber]);

    const closeDecision = () => {
        if (busyId !== null) return;
        setDecision(null);
        setRejectReason("");
    };

    const handleDecision = async () => {
        if (!decision || busyId !== null) return;

        const { restaurant, approve } = decision;

        if (!approve && !rejectReason.trim()) {
            setError("Vui lòng nhập lý do từ chối.");
            return;
        }

        try {
            setBusyId(restaurant.maNhaHang);
            setError("");

            if (approve) {
                await approveRestaurant(restaurant.maNhaHang);
            } else {
                await rejectRestaurant(
                    restaurant.maNhaHang,
                    rejectReason.trim()
                );
            }

            await loadRestaurants(false);
            setDecision(null);
            setRejectReason("");
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
                        <strong>{totalItems}</strong>
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
                            onChange={(event) => {
                                setLoading(true);
                                setError("");
                                setKeyword(event.target.value);
                                setPageNumber(1);
                            }}
                        />
                    </label>

                    <span>
                        <strong>{totalItems}</strong> yêu cầu
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
                        <strong>
                            {keyword.trim()
                                ? "Không tìm thấy nhà hàng"
                                : "Đã xử lý hết yêu cầu"}
                        </strong>
                        <p>
                            {keyword.trim()
                                ? "Hãy thử tìm bằng tên, địa chỉ hoặc mã nhà hàng khác."
                                : "Hiện không có nhà hàng nào đang chờ duyệt."}
                        </p>
                    </div>
                ) : (
                    <div className="admin-restaurant-request-list">
                        {restaurants.map((restaurant) => (
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
                                    <Link
                                        className="admin-contract-view-link"
                                        to={`/admin/nha-hang/${restaurant.maNhaHang}/ho-so`}
                                    >
                                        Xem hồ sơ & hợp đồng
                                    </Link>
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

                {!loading && !error && totalPages > 1 && (
                    <Pagination
                        pageNumber={pageNumber}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={(page) => {
                            if (page === pageNumber) return;

                            setLoading(true);
                            setError("");
                            setPageNumber(page);
                        }}
                    />
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
                            <label className="admin-contract-reject-reason">
                                <span>Lý do từ chối</span>
                                <textarea
                                    rows={3}
                                    maxLength={500}
                                    value={rejectReason}
                                    disabled={busyId !== null}
                                    placeholder="Nêu rõ thông tin hoặc giấy tờ cần bổ sung..."
                                    onChange={(event) => setRejectReason(event.target.value)}
                                />
                            </label>
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
