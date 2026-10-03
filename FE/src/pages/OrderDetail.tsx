import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById, getOrderStatusHistory } from "../services/orderService";
import OrderReviewPanel from "../components/OrderReviewPanel";
import PaymentQr from "../components/PaymentQr";
import { getRestaurantById } from "../services/restaurantService";
import {
    changePaymentMethod,
    docDonDangThanhToan,
    getPaymentMethods,
    getPaymentsByOrder,
    simulatePayment,
    xoaDonDangThanhToan,
} from "../services/paymentService";
import type {
    OrderDetails,
    OrderStatusHistory,
} from "../services/orderService";

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

interface ReviewDish {
    maMonAn: number;
    tenMonAn: string;
}

interface ThanhToanDon {
    maThanhToan: number;
    maPhuongThuc: number;
    tenPhuongThuc: string;
    trangThaiThanhToan: string;
}

interface PhuongThucThanhToan {
    maPhuongThuc: number;
    tenPhuongThuc: string;
}

const PAYMENT_LABEL: Record<string, string> = {
    ChoThanhToan: "Chờ thanh toán",
    ThanhCong: "Thành công",
    ThatBai: "Thất bại",
};

function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [history, setHistory] = useState<OrderStatusHistory[]>([]);
    const [loadedId, setLoadedId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [showReview, setShowReview] = useState(false);
    const [payments, setPayments] = useState<ThanhToanDon[]>([]);
    const [methods, setMethods] = useState<PhuongThucThanhToan[]>([]);
    const [paymentVersion, setPaymentVersion] = useState(0);
    const [showRetry, setShowRetry] = useState(false);
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
    const [retrying, setRetrying] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [qrBusy, setQrBusy] = useState(false);
    const [qrPaymentId, setQrPaymentId] = useState<number | null>(null);
    const [qrMethodName, setQrMethodName] = useState("");

    useEffect(() => {
        const maDonHang = Number(id);

        if (!id || !Number.isInteger(maDonHang) || maDonHang <= 0) {
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                const [orderData, historyData] = await Promise.all([
                    getOrderById(maDonHang),
                    getOrderStatusHistory(maDonHang),
                ]);

                let paymentData: ThanhToanDon[] = [];
                try {
                    const rawPayments = await getPaymentsByOrder(maDonHang);
                    paymentData = Array.isArray(rawPayments) ? rawPayments : [];
                } catch {
                    paymentData = [];
                }

                let methodData: PhuongThucThanhToan[] = [];
                try {
                    const rawMethods = await getPaymentMethods();
                    methodData = Array.isArray(rawMethods) ? rawMethods : [];
                } catch {
                    methodData = [];
                }

                if (cancelled) return;

                setOrder(orderData);
                setHistory(historyData);
                setPayments(paymentData);
                setMethods(methodData);
                setError("");
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Không tải được đơn hàng."
                );
                setOrder(null);
                setHistory([]);
                setPayments([]);
            } finally {
                if (!cancelled) {
                    setLoadedId(id);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [id, paymentVersion]);

    const latestPayment = [...payments].sort(
        (a, b) => b.maThanhToan - a.maThanhToan
    )[0];

    const handleRetry = async () => {
        if (!order || !latestPayment || selectedMethodId === null) return;

        const method = methods.find((item) => item.maPhuongThuc === selectedMethodId);
        if (!method) return;

        try {
            setRetrying(true);
            const nhaHang = await getRestaurantById(order.maNhaHang);
            if (nhaHang.trangThaiHoatDong !== "MoCua") {
                alert("Nhà hàng hiện đang tạm ngưng nhận đơn.");
                return;
            }

            const created = await changePaymentMethod(
                latestPayment.maThanhToan,
                method.maPhuongThuc
            );
            const newPaymentId = Number(created.maThanhToanMoi);

            if (method.tenPhuongThuc === "COD") {
                if (docDonDangThanhToan()?.maDonHang === order.maDonHang) {
                    xoaDonDangThanhToan();
                }
                setShowRetry(false);
                setPaymentVersion((current) => current + 1);
                return;
            }

            setQrPaymentId(newPaymentId);
            setQrMethodName(method.tenPhuongThuc);
            setShowQr(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không đổi được phương thức thanh toán.");
        } finally {
            setRetrying(false);
        }
    };

    const handleQrSuccess = async () => {
        if (qrPaymentId === null) return;
        try {
            setQrBusy(true);
            await simulatePayment(qrPaymentId, "ThanhCong");
            if (order && docDonDangThanhToan()?.maDonHang === order.maDonHang) {
                xoaDonDangThanhToan();
            }
            setShowQr(false);
            setShowRetry(false);
            setPaymentVersion((current) => current + 1);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không cập nhật được thanh toán.");
        } finally {
            setQrBusy(false);
        }
    };

    const handleQrFail = async () => {
        if (qrPaymentId === null) return;
        try {
            setQrBusy(true);
            await simulatePayment(qrPaymentId, "ThatBai");
            setShowQr(false);
            setShowRetry(false);
            setPaymentVersion((current) => current + 1);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không cập nhật được thanh toán.");
        } finally {
            setQrBusy(false);
        }
    };

    const maDonHang = Number(id);

    if (!id || !Number.isInteger(maDonHang) || maDonHang <= 0) {
        return (
            <main className="profile-page">
                <p className="auth-error">Mã đơn hàng không hợp lệ.</p>
                <Link to="/don-hang">← Về danh sách đơn hàng</Link>
            </main>
        );
    }

    if (loadedId !== id) {
        return (
            <div
                className="loading-spinner"
                style={{ margin: "100px auto" }}
            />
        );
    }

    const currentIndex = FLOW.findIndex((step) => step.code === order?.trangThai);
    const latestNote = history.length > 0 ? history[history.length - 1].ghiChu : "";
    const statusHint =
        order?.trangThai === "DaHuy"
            ? latestNote || "Đơn hàng đã được hủy."
            : latestNote || FLOW[currentIndex]?.hint || "";

    // Một món có thể xuất hiện nhiều dòng do chọn topping khác nhau.
    // Chỉ hiển thị một form đánh giá cho mỗi món.
    const reviewDishes: ReviewDish[] = order?.chiTiet ?? [];

    const uniqueReviewDishes = reviewDishes.filter(
        (dish, index, dishes) =>
            dish.maMonAn > 0 &&
            dishes.findIndex((item) => item.maMonAn === dish.maMonAn) === index
    );

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
                            <>
                                <button
                                    type="button"
                                    className="invoice-review"
                                    onClick={() => setShowReview((previous) => !previous)}
                                    aria-expanded={showReview}
                                    aria-controls="order-review-panel"
                                >
                                    {showReview ? "Ẩn phần đánh giá" : "Đánh giá đơn hàng"}
                                </button>

                                <section
                                    id="order-review-panel"
                                    className="invoice-block"
                                    hidden={!showReview}
                                >
                                    <h2>Đánh giá trải nghiệm</h2>
                                    <p className="invoice-muted">
                                        Bạn có thể đánh giá quán và từng món trong đơn hàng.
                                    </p>

                                    <OrderReviewPanel
                                        key={order.maDonHang}
                                        maDonHang={order.maDonHang}
                                        maNhaHang={order.maNhaHang}
                                        tenNhaHang={order.tenNhaHang}
                                        dishes={uniqueReviewDishes}
                                    />
                                </section>
                            </>
                        )}

                    <section className="invoice-block">
                        <h2>{order.tenNhaHang}</h2>
                        <p className="invoice-muted">
                            {new Date(order.thoiGianDat).toLocaleString("vi-VN")}
                        </p>
                    </section>

                    <section className="invoice-block">
                            {(order.chiTiet || []).map((ct, index) => (
                            <div key={index} className="invoice-item">
                                <div className="invoice-line">
                                    <strong>{ct.tenMonAn} x{ct.soLuong}</strong>
                                    <span>{formatMoney(ct.thanhTien)}</span>
                                </div>
                                    {(ct.toppings || []).map((tp, tpIndex) => (
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

                    {latestPayment && (
                        <section className="invoice-block">
                            <h2>Thanh toán</h2>
                            <p className="invoice-muted">
                                {latestPayment.tenPhuongThuc}: {PAYMENT_LABEL[latestPayment.trangThaiThanhToan] || latestPayment.trangThaiThanhToan}
                            </p>

                            {order.trangThai !== "DaHuy" &&
                                latestPayment.trangThaiThanhToan === "ChoThanhToan" &&
                                latestPayment.tenPhuongThuc !== "COD" && (
                                    <button
                                        type="button"
                                        className="menu-button"
                                        onClick={() => {
                                            setQrPaymentId(latestPayment.maThanhToan);
                                            setQrMethodName(latestPayment.tenPhuongThuc);
                                            setShowQr(true);
                                        }}
                                        style={{ width: "100%" }}
                                    >
                                        Tiếp tục thanh toán
                                    </button>
                                )}

                            {order.trangThai !== "DaHuy" && latestPayment.trangThaiThanhToan === "ThatBai" && (
                                showRetry ? (
                                    <>
                                        <div className="address-options">
                                            {methods.map((item) => (
                                                <label
                                                    key={item.maPhuongThuc}
                                                    className={`address-option ${selectedMethodId === item.maPhuongThuc ? "selected" : ""}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="retry-payment"
                                                        checked={selectedMethodId === item.maPhuongThuc}
                                                        onChange={() => setSelectedMethodId(item.maPhuongThuc)}
                                                    />
                                                    <strong>{item.tenPhuongThuc}</strong>
                                                </label>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="menu-button"
                                            onClick={handleRetry}
                                            disabled={retrying || selectedMethodId === null}
                                            style={{ width: "100%", marginTop: 12 }}
                                        >
                                            {retrying ? "Đang xử lý..." : "Xác nhận thanh toán"}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="menu-button"
                                        onClick={() => {
                                            setSelectedMethodId(latestPayment.maPhuongThuc);
                                            setShowRetry(true);
                                        }}
                                        style={{ width: "100%" }}
                                    >
                                        Thanh toán lại
                                    </button>
                                )
                            )}
                        </section>
                    )}

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
            {showQr && order && (
                <div className="qr-overlay" role="dialog" aria-modal="true" aria-labelledby="retry-qr-title">
                    <div className="qr-dialog">
                        <h2 id="retry-qr-title">Thanh toán {qrMethodName}</h2>
                        <p>Quét mã mô phỏng, rồi chọn kết quả.</p>
                        <PaymentQr />
                        <p>{formatMoney(order.thanhTien)}</p>
                        <div className="qr-actions">
                            <button
                                type="button"
                                className="menu-button"
                                onClick={handleQrSuccess}
                                disabled={qrBusy}
                            >
                                {qrBusy ? "Đang xử lý..." : "Tôi đã thanh toán"}
                            </button>
                            <button
                                type="button"
                                className="menu-button checkout-secondary"
                                onClick={handleQrFail}
                                disabled={qrBusy}
                            >
                                Thanh toán thất bại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default OrderDetail;
