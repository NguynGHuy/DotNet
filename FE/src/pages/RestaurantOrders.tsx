import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import {
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    ChefHat,
    CircleX,
    ClipboardList,
    Clock3,
    PackageOpen,
    RefreshCw,
    Truck,
    UserRound,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import {
    getOrderStatuses,
    getRestaurantOrders,
} from "../services/orderService";

interface OrderStatus {
    maTrangThai: number;
    tenTrangThai: string;
}

interface RestaurantOrderSummary {
    maDonHang: number;
    maDonHangHienThi: string;
    tenNguoiNhan: string;
    thoiGianDat: string;
    trangThai: string;
    thanhTien: number;
}

interface StatusMeta {
    label: string;
    className: string;
    icon: LucideIcon;
}

const STATUS_META: Record<string, StatusMeta> = {
    ChoXacNhan: {
        label: "Chờ xác nhận",
        className: "pending",
        icon: Clock3,
    },
    DaXacNhan: {
        label: "Đã xác nhận",
        className: "confirmed",
        icon: BadgeCheck,
    },
    DangChuanBi: {
        label: "Đang chuẩn bị",
        className: "preparing",
        icon: ChefHat,
    },
    DangGiao: {
        label: "Đang giao",
        className: "delivering",
        icon: Truck,
    },
    HoanThanh: {
        label: "Hoàn thành",
        className: "completed",
        icon: CheckCircle2,
    },
    DaHuy: {
        label: "Đã hủy",
        className: "cancelled",
        icon: CircleX,
    },
};

function getStatusMeta(status: string): StatusMeta {
    return (
        STATUS_META[status] ?? {
            label: status || "Không xác định",
            className: "default",
            icon: Clock3,
        }
    );
}

function formatMoney(value: number) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatOrderTime(value: string) {
    return new Date(value).toLocaleString("vi-VN");
}

function RestaurantOrders() {
    const [orders, setOrders] = useState<
        RestaurantOrderSummary[]
    >([]);

    const [statuses, setStatuses] = useState<OrderStatus[]>([]);

    const [selectedStatus, setSelectedStatus] =
        useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getOrderStatuses()
            .then((data) => {
                if (!cancelled) {
                    setStatuses(
                        Array.isArray(data) ? data : []
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setStatuses([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getRestaurantOrders(
                selectedStatus ?? undefined
            );

            setOrders(
                Array.isArray(data)
                    ? (data as RestaurantOrderSummary[])
                    : []
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không tải được đơn hàng."
            );

            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [selectedStatus]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const currentFilterLabel = useMemo(() => {
        if (selectedStatus === null) {
            return "Tất cả đơn hàng";
        }

        const selected = statuses.find(
            (status) =>
                status.maTrangThai === selectedStatus
        );

        if (!selected) {
            return "Đơn hàng đã lọc";
        }

        return getStatusMeta(selected.tenTrangThai).label;
    }, [selectedStatus, statuses]);

    return (
        <main className="quan-orders merchant-orders-page">
            <header className="merchant-orders-header">
                <div className="merchant-orders-heading">
                    <span className="merchant-orders-heading-icon">
                        <ClipboardList size={22} />
                    </span>

                    <div>
                        <span>Quản lý vận hành</span>
                        <h1>Đơn hàng của quán</h1>

                        <p>
                            Theo dõi và xử lý các đơn khách đã đặt
                            tại nhà hàng.
                        </p>
                    </div>
                </div>

                <div className="merchant-orders-count">
                    <strong>
                        {loading ? "—" : orders.length}
                    </strong>

                    <span>đơn đang hiển thị</span>
                </div>
            </header>

            <section className="merchant-order-filter-section">
                <div className="merchant-order-filter-heading">
                    <div>
                        <strong>Lọc theo trạng thái</strong>
                        <span>{currentFilterLabel}</span>
                    </div>

                    <button
                        type="button"
                        className="merchant-orders-refresh"
                        disabled={loading}
                        onClick={() => void loadOrders()}
                    >
                        <RefreshCw
                            size={14}
                            className={
                                loading ? "is-spinning" : ""
                            }
                        />

                        Làm mới
                    </button>
                </div>

                <nav
                    className="merchant-order-tabs"
                    aria-label="Lọc đơn hàng theo trạng thái"
                >
                    <button
                        type="button"
                        className={`merchant-order-tab tab-all ${
                            selectedStatus === null
                                ? "is-active"
                                : ""
                        }`}
                        onClick={() =>
                            setSelectedStatus(null)
                        }
                    >
                        <ClipboardList size={14} />
                        Tất cả
                    </button>

                    {statuses.map((status) => {
                        const meta = getStatusMeta(
                            status.tenTrangThai
                        );

                        const StatusIcon = meta.icon;

                        return (
                            <button
                                key={status.maTrangThai}
                                type="button"
                                className={`merchant-order-tab tab-${meta.className} ${
                                    selectedStatus ===
                                    status.maTrangThai
                                        ? "is-active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setSelectedStatus(
                                        status.maTrangThai
                                    )
                                }
                            >
                                <StatusIcon size={14} />
                                {meta.label}
                            </button>
                        );
                    })}
                </nav>
            </section>

            {loading ? (
                <section className="merchant-orders-loading">
                    <div className="loading-spinner" />

                    <p>Đang tải đơn hàng...</p>
                </section>
            ) : error ? (
                <section className="merchant-orders-error">
                    <CircleX size={25} />

                    <h2>Không tải được đơn hàng</h2>
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => void loadOrders()}
                    >
                        <RefreshCw size={15} />
                        Thử lại
                    </button>
                </section>
            ) : orders.length === 0 ? (
                <section className="merchant-orders-empty">
                    <span>
                        <PackageOpen size={28} />
                    </span>

                    <h2>Chưa có đơn hàng</h2>

                    <p>
                        Hiện chưa có đơn nào thuộc trạng thái
                        “{currentFilterLabel}”.
                    </p>

                    {selectedStatus !== null && (
                        <button
                            type="button"
                            onClick={() =>
                                setSelectedStatus(null)
                            }
                        >
                            Xem tất cả đơn hàng
                        </button>
                    )}
                </section>
            ) : (
                <section className="merchant-order-list">
                    {orders.map((order) => {
                        const status = getStatusMeta(
                            order.trangThai
                        );

                        const StatusIcon = status.icon;

                        return (
                            <Link
                                key={order.maDonHang}
                                to={`/quan/don-hang/${order.maDonHang}`}
                                className={`merchant-order-card order-${status.className}`}
                                aria-label={`Xem chi tiết đơn ${order.maDonHangHienThi}`}
                            >
                                <div className="merchant-order-status-mark">
                                    <StatusIcon size={18} />
                                </div>

                                <div className="merchant-order-primary">
                                    <div className="merchant-order-code-row">
                                        <strong>
                                            {
                                                order.maDonHangHienThi
                                            }
                                        </strong>

                                        <span
                                            className={`merchant-order-status status-${status.className}`}
                                        >
                                            <StatusIcon
                                                size={13}
                                            />

                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="merchant-order-customer">
                                        <UserRound size={13} />

                                        <span>
                                            {order.tenNguoiNhan}
                                        </span>
                                    </div>

                                    <time>
                                        <Clock3 size={12} />

                                        {formatOrderTime(
                                            order.thoiGianDat
                                        )}
                                    </time>
                                </div>

                                <div className="merchant-order-price">
                                    <span>Thành tiền</span>

                                    <strong>
                                        {formatMoney(
                                            order.thanhTien
                                        )}
                                    </strong>
                                </div>

                                <div className="merchant-order-open">
                                    <span>Xem đơn</span>
                                    <ArrowRight size={16} />
                                </div>
                            </Link>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

export default RestaurantOrders;