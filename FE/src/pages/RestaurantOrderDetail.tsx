import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    cancelOrder,
    getOrderById,
    getOrderStatusHistory,
    updateOrderStatus,
} from "../services/orderService";

const FLOW = [
    { code: "ChoXacNhan", label: "Chờ xác nhận" },
    { code: "DaXacNhan", label: "Đã xác nhận" },
    { code: "DangChuanBi", label: "Đang chuẩn bị" },
    { code: "DangGiao", label: "Đang giao" },
    { code: "HoanThanh", label: "Hoàn thành" },
];

const STATUS_LABEL: Record<string, string> = {
    ChoXacNhan: "Chờ xác nhận",
    DaXacNhan: "Đã xác nhận",
    DangChuanBi: "Đang chuẩn bị",
    DangGiao: "Đang giao",
    HoanThanh: "Hoàn thành",
    DaHuy: "Đã hủy",
};

const NEXT_STEP: Record<string, { id: number; label: string }> = {
    ChoXacNhan: { id: 2, label: "Xác nhận" },
    DaXacNhan: { id: 3, label: "Đang chuẩn bị" },
    DangChuanBi: { id: 4, label: "Đang giao" },
    DangGiao: { id: 5, label: "Hoàn thành" },
};

function formatMoney(value: number) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function RestaurantOrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const load = async (maDonHang: number) => {
        const [orderData, historyData] = await Promise.all([
            getOrderById(maDonHang),
            getOrderStatusHistory(maDonHang),
        ]);
        setOrder(orderData);
        setHistory(Array.isArray(historyData) ? historyData : []);
    };

    useEffect(() => {
        const maDonHang = Number(id);
        if (!id || Number.isNaN(maDonHang)) {
            setError("Mã đơn hàng không hợp lệ.");
            setLoading(false);
            return;
        }

        const run = async () => {
            try {
                setLoading(true);
                setError("");
                await load(maDonHang);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Không tải được đơn hàng.");
                setOrder(null);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);

    const handleAdvance = async () => {
        if (!order) return;
        const next = NEXT_STEP[order.trangThai];
        if (!next) return;
        try {
            setBusy(true);
            await updateOrderStatus(order.maDonHang, next.id);
            await load(order.maDonHang);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không cập nhật được trạng thái.");
        } finally {
            setBusy(false);
        }
    };

    const handleCancel = async () => {
        if (!order) return;
        const reason = window.prompt("Nhập lý do huỷ đơn hàng:");
        if (!reason) return;
        try {
            setBusy(true);
            await cancelOrder(order.maDonHang, reason);
            await load(order.maDonHang);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể huỷ đơn lúc này.");
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div className="quan-page-loading">Đang tải đơn hàng...</div>;
    }

    const currentIndex = FLOW.findIndex((step) => step.code === order?.trangThai);
    const next = order ? NEXT_STEP[order.trangThai] : undefined;
    const canCancel = order?.trangThai === "ChoXacNhan" || order?.trangThai === "DaXacNhan";

    return (
        <div className="quan-orders">
            <Link to="/quan/don-hang" className="invoice-back">
                <span aria-hidden="true">←</span>
                Danh sách đơn
            </Link>

            {error || !order ? (
                <div className="quan-empty">{error || "Không tìm thấy đơn hàng."}</div>
            ) : (
                <article className="invoice-sheet">
                    <header className="invoice-track">
                        <h1>{STATUS_LABEL[order.trangThai] || order.trangThai}</h1>
                        <p>Mã đơn {order.maDonHangHienThi}</p>
                        {order.trangThai === "DaHuy" ? (
                            <div className="invoice-cancel">Đơn đã hủy</div>
                        ) : (
                            <ol className="invoice-steps">
                                {FLOW.map((step, index) => {
                                    const reached = currentIndex >= 0 && index <= currentIndex;
                                    const passed = currentIndex >= 0 && index < currentIndex;
                                    return (
                                        <li
                                            key={step.code}
                                            className={`invoice-step${reached ? " is-reached" : ""}${passed ? " is-passed" : ""}`}
                                        >
                                            <span>{step.label}</span>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </header>

                    {(next || canCancel) && (
                        <div className="quan-order-actions">
                            {next && (
                                <button type="button" className="invoice-review" onClick={handleAdvance} disabled={busy}>
                                    {next.label}
                                </button>
                            )}
                            {canCancel && (
                                <button type="button" className="quan-order-cancel" onClick={handleCancel} disabled={busy}>
                                    Huỷ đơn
                                </button>
                            )}
                        </div>
                    )}

                    <section className="invoice-block">
                        <h2>{order.tenNhaHang}</h2>
                        <p className="invoice-muted">{new Date(order.thoiGianDat).toLocaleString("vi-VN")}</p>
                    </section>

                    <section className="invoice-block">
                        {(order.chiTiet || []).map((ct: any, index: number) => (
                            <div key={index} className="invoice-item">
                                <div className="invoice-line">
                                    <strong>{ct.tenMonAn} x{ct.soLuong}</strong>
                                    <span>{formatMoney(ct.thanhTien)}</span>
                                </div>
                                {(ct.toppings || []).map((tp: any, tpIndex: number) => (
                                    <p key={tpIndex} className="invoice-topping">+ {tp.tenTopping} x{tp.soLuong}</p>
                                ))}
                            </div>
                        ))}
                    </section>

                    <section className="invoice-block invoice-money">
                        <div className="invoice-line">
                            <span>Tổng tiền món</span>
                            <span>{formatMoney(order.tongTienHang)}</span>
                        </div>
                        <div className="invoice-line">
                            <span>Phí giao hàng</span>
                            <span>{formatMoney(order.phiShip)}</span>
                        </div>
                        <div className="invoice-line">
                            <span>Giảm giá</span>
                            <span>-{formatMoney(order.soTienGiam)}</span>
                        </div>
                        <div className="invoice-line invoice-total">
                            <span>Thành tiền</span>
                            <span>{formatMoney(order.thanhTien)}</span>
                        </div>
                    </section>

                    <section className="invoice-block">
                        <p className="invoice-receiver">{order.tenNguoiNhan} · {order.soDienThoaiNhan}</p>
                        <p className="invoice-muted">{order.diaChiGiaoHang}</p>
                        {order.ghiChu && <p className="invoice-muted">Ghi chú: {order.ghiChu}</p>}
                    </section>

                    <section className="invoice-block">
                        {history.length === 0 ? (
                            <p className="invoice-muted">Chưa có lịch sử trạng thái.</p>
                        ) : (
                            <ul className="invoice-history">
                                {history.map((item) => (
                                    <li key={item.maLichSu}>
                                        <span>{STATUS_LABEL[item.tenTrangThai] || item.tenTrangThai}</span>
                                        <time>{new Date(item.thoiGianTao).toLocaleString("vi-VN")}</time>
                                        {item.ghiChu && <small>{item.ghiChu}</small>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </article>
            )}
        </div>
    );
}

export default RestaurantOrderDetail;
