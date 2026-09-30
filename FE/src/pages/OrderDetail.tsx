import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById, getOrderStatusHistory } from "../services/orderService";

const FLOW = [
    { code: "ChoXacNhan", label: "Chờ xác nhận", hint: "Quán sẽ xác nhận đơn trong ít phút." },
    { code: "DaXacNhan", label: "Đã xác nhận", hint: "Quán đã nhận đơn của bạn." },
    { code: "DangChuanBi", label: "Đang chuẩn bị", hint: "Quán đang chuẩn bị món." },
    { code: "DangGiao", label: "Đang giao", hint: "Đơn đang trên đường giao tới bạn." },
    { code: "HoanThanh", label: "Hoàn thành", hint: "Đơn đã giao thành công." },
];

const STATUS_LABEL: Record<string, string> = {
    ChoXacNhan: "Chờ xác nhận",
    DaXacNhan: "Đã xác nhận",
    DangChuanBi: "Đang chuẩn bị",
    DangGiao: "Đang giao",
    HoanThanh: "Hoàn thành",
    DaHuy: "Đã hủy",
};

function formatMoney(value: number) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const maDonHang = Number(id);

        if (!id || Number.isNaN(maDonHang)) {
            setError("Mã đơn hàng không hợp lệ.");
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const [orderData, historyData] = await Promise.all([
                    getOrderById(maDonHang),
                    getOrderStatusHistory(maDonHang),
                ]);

                setOrder(orderData);
                setHistory(Array.isArray(historyData) ? historyData : []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Không tải được đơn hàng."
                );
                setOrder(null);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    if (loading) {
        return <div className="loading-spinner" style={{ margin: "100px auto" }}></div>;
    }

    const currentIndex = FLOW.findIndex((step) => step.code === order?.trangThai);
    const latestNote = history.length > 0 ? history[history.length - 1].ghiChu : "";
    const statusHint =
        order?.trangThai === "DaHuy"
            ? latestNote || "Đơn hàng đã được hủy."
            : latestNote || FLOW[currentIndex]?.hint || "";

    return (
        <main className="profile-page">
            <Link to="/don-hang" className="invoice-back">
                <span aria-hidden="true">←</span>
                Đơn hàng của tôi
            </Link>

            {error || !order ? (
                <div className="empty-result">
                    <h3>{error || "Không tìm thấy đơn hàng."}</h3>
                    <Link to="/don-hang" className="menu-button" style={{ display: "inline-flex", marginTop: 15 }}>
                        Quay lại danh sách
                    </Link>
                </div>
            ) : (
                <article className="invoice-sheet">
                    <header className="invoice-track">
                        <h1>{STATUS_LABEL[order.trangThai] || order.trangThai}</h1>
                        {statusHint && <p>{statusHint}</p>}

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

                    {order.trangThai === "HoanThanh" && (
                        <button type="button" className="invoice-review">
                            Đánh giá đơn hàng
                        </button>
                    )}

                    <section className="invoice-block">
                        <h2>{order.tenNhaHang}</h2>
                        <p className="invoice-muted">
                            {new Date(order.thoiGianDat).toLocaleString("vi-VN")}
                        </p>
                    </section>

                    <section className="invoice-block">
                        {(order.chiTiet || []).map((ct: any, index: number) => (
                            <div key={index} className="invoice-item">
                                <div className="invoice-line">
                                    <strong>{ct.tenMonAn} x{ct.soLuong}</strong>
                                    <span>{formatMoney(ct.thanhTien)}</span>
                                </div>
                                {(ct.toppings || []).map((tp: any, tpIndex: number) => (
                                    <p key={tpIndex} className="invoice-topping">
                                        + {tp.tenTopping} x{tp.soLuong}
                                    </p>
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
                        <p className="invoice-receiver">
                            {order.tenNguoiNhan} · {order.soDienThoaiNhan}
                        </p>
                        <p className="invoice-muted">{order.diaChiGiaoHang}</p>
                        {order.ghiChu && <p className="invoice-muted">Ghi chú: {order.ghiChu}</p>}
                    </section>

                    <section className="invoice-block">
                        <p className="invoice-code">Mã đơn {order.maDonHangHienThi}</p>
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
        </main>
    );
}

export default OrderDetail;
