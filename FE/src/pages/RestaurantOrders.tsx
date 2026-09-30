import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrderStatuses, getRestaurantOrders } from "../services/orderService";

const STATUS_LABEL: Record<string, string> = {
    ChoXacNhan: "Chờ xác nhận",
    DaXacNhan: "Đã xác nhận",
    DangChuanBi: "Đang chuẩn bị",
    DangGiao: "Đang giao",
    HoanThanh: "Hoàn thành",
    DaHuy: "Đã hủy",
};

function RestaurantOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getOrderStatuses()
            .then((data) => setStatuses(Array.isArray(data) ? data : []))
            .catch(() => setStatuses([]));
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getRestaurantOrders(selectedStatus ?? undefined);
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Không tải được đơn hàng.");
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedStatus]);

    return (
        <div className="quan-orders">
            <div className="quan-page-title">
                <div>
                    <h1>Đơn hàng</h1>
                    <p>Các đơn khách đặt tại quán của bạn.</p>
                </div>
            </div>

            <div className="quan-order-tabs">
                <button
                    type="button"
                    className={selectedStatus === null ? "is-active" : ""}
                    onClick={() => setSelectedStatus(null)}
                >
                    Tất cả
                </button>
                {statuses.map((status) => (
                    <button
                        key={status.maTrangThai}
                        type="button"
                        className={selectedStatus === status.maTrangThai ? "is-active" : ""}
                        onClick={() => setSelectedStatus(status.maTrangThai)}
                    >
                        {STATUS_LABEL[status.tenTrangThai] || status.tenTrangThai}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="quan-page-loading">Đang tải đơn hàng...</div>
            ) : error ? (
                <div className="quan-empty">{error}</div>
            ) : orders.length === 0 ? (
                <div className="quan-empty">Chưa có đơn hàng nào.</div>
            ) : (
                <div className="quan-order-list">
                    {orders.map((order) => (
                        <Link
                            key={order.maDonHang}
                            to={`/quan/don-hang/${order.maDonHang}`}
                            className="quan-order-row"
                        >
                            <div>
                                <strong>{order.maDonHangHienThi}</strong>
                                <span>{order.tenNguoiNhan}</span>
                                <span>{new Date(order.thoiGianDat).toLocaleString("vi-VN")}</span>
                            </div>
                            <div>
                                <em>{STATUS_LABEL[order.trangThai] || order.trangThai}</em>
                                <b>{Number(order.thanhTien).toLocaleString("vi-VN")} đ</b>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RestaurantOrders;
