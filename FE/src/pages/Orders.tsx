import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, cancelOrder } from "../services/orderService";

function Orders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await getMyOrders();
            setOrders(data);
        } catch (error) {
            console.error("Lỗi tải đơn hàng", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleCancel = async (id: number) => {
        const reason = window.prompt("Nhập lý do huỷ đơn hàng:");
        if (!reason) return;
        try {
            await cancelOrder(id, reason);
            alert("Đã huỷ đơn hàng.");
            loadOrders();
        } catch (err: any) {
            alert(err.message || "Không thể huỷ đơn lúc này.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ChoXacNhan": return "#f59e0b"; // Vàng
            case "DaXacNhan": return "#3b82f6"; // Xanh dương
            case "DangChuanBi": return "#8b5cf6";
            case "DangGiao": return "#0ea5e9";
            case "HoanThanh": return "#10b981"; // Xanh lá
            case "DaHuy": return "#ef4444";     // Đỏ
            default: return "#6b7280";
        }
    };

    if (loading) return <div className="loading-spinner" style={{ margin: "100px auto" }}></div>;

    return (
        <main className="profile-page">
            <div className="profile-page-header">
                <h1>Đơn hàng của tôi</h1>
                <p>Theo dõi trạng thái các đơn đặt món</p>
            </div>

            {orders.length === 0 ? (
                <div className="empty-result">
                    <div>🧾</div>
                    <h3>Chưa có đơn hàng nào</h3>
                    <Link to="/" className="menu-button" style={{ display: 'inline-flex', marginTop: 15 }}>Đi đặt món</Link>
                </div>
            ) : (
                <div className="order-list">
                    {orders.map(order => (
                        <div key={order.maDonHang} className="order-card">
                            <div className="order-header">
                                <div>
                                    <strong>{order.tenNhaHang}</strong>
                                    <span className="order-date">{new Date(order.thoiGianDat).toLocaleString('vi-VN')}</span>
                                </div>
                                <span className="order-status" style={{ background: `${getStatusColor(order.trangThai)}20`, color: getStatusColor(order.trangThai) }}>
                                    {order.trangThai}
                                </span>
                            </div>
                            <div className="order-body">
                                <p>Mã đơn: <strong>{order.maDonHangHienThi}</strong></p>
                                <p>Tổng tiền: <strong style={{color: '#e63946'}}>{order.thanhTien.toLocaleString()} đ</strong></p>
                            </div>
                            <div className="order-actions">
                                <Link 
                                    to={ `/don-hang/${order.maDonHang}` }
                                    className = "menu-button"
                                    style = {{ display: "inline-flex", marginRight: 8 }}>
                                    Xem chi tiết
                                </Link>
                                {(order.trangThai === "ChoXacNhan" || order.trangThai === "DaXacNhan") && (
                                    <button className="cancel-btn" onClick={() => handleCancel(order.maDonHang)}>Huỷ đơn</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}

export default Orders;