import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAddresses } from "../services/addressService";
import type { Address } from "../services/addressService";
import { checkPreCheckout, placeOrder } from "../services/orderService";
import { getCart } from "../services/cartService";
import { checkPromotion } from "../services/promotionService";

interface CheckoutData {
    tongTienHang: number;
    phiShip: number;
    soTienGiam: number;
    thanhTien: number;
}
function Checkout() {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [ghiChu, setGhiChu] = useState("");

    const [maCode, setMaCode] = useState("");
    const [promotionId, setPromotionId] = useState<number | null>(null);
    const [restaurantId, setRestaurantId] = useState<number | null>(null);
    const [promoMessage, setPromoMessage] = useState("");
    const [promoBusy, setPromoBusy] = useState(false);

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);

    useEffect(() => {
        const initCheckout = async () => {
            try {
                // 1. Lấy địa chỉ
                const addrData = await getAddresses();
                setAddresses(addrData);
                const defaultAddr = addrData.find((a: Address) => a.macDinh) || addrData[0];
                if (defaultAddr) setSelectedAddressId(defaultAddr.maDiaChi);

                // 2. Tính tiền (Gọi API của Người 3)
                const [moneyData, cart] = await Promise.all([
                    checkPreCheckout(null),
                    getCart(),
                ]);
                setCheckoutData(moneyData);
                setRestaurantId(cart.maNhaHang);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
                alert(message);
                navigate("/gio-hang");
            } finally {
                setLoading(false);
            }
        };
        initCheckout();
    }, [navigate]);

    const handleApplyPromotion = async () => {
        if (!maCode.trim() || restaurantId === null || !checkoutData) return;

        try {
            setPromoBusy(true);
            setPromoMessage("");

            const result = await checkPromotion(
                maCode.trim(),
                restaurantId,
                checkoutData.tongTienHang
            );

            const updatedCheckout = await checkPreCheckout(result.maKhuyenMai);
            setCheckoutData(updatedCheckout);
            setPromotionId(result.maKhuyenMai);
            setPromoMessage("Áp dụng mã thành công.");
        } catch (err) {
            setPromoMessage((err as Error).message);
        } finally {
            setPromoBusy(false);
        }
    };

    const handleRemovePromotion = async () => {
        try {
            setPromoBusy(true);
            const updatedCheckout = await checkPreCheckout(null);
            setCheckoutData(updatedCheckout);
            setPromotionId(null);
            setMaCode("");
            setPromoMessage("");
        } catch (err) {
            setPromoMessage((err as Error).message);
        } finally {
            setPromoBusy(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert("Vui lòng chọn địa chỉ giao hàng!");
            return;
        }
        try {
            setPlacingOrder(true);
            const res = await placeOrder({
                maDiaChi: selectedAddressId,
                maKhuyenMai: promotionId,
                ghiChu: ghiChu
            });
            alert("Đặt hàng thành công! Mã đơn: " + res.maDonHangHienThi);
            navigate("/don-hang"); // Chuyển tới lịch sử đơn hàng
        } catch (error) {
            const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
            alert("Lỗi đặt hàng: " + message);
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) return <div className="loading-spinner" style={{ margin: "100px auto" }}></div>;

    return (
        <main className="checkout-page">
            <div className="checkout-container">
                <h2>Xác nhận Đơn hàng</h2>

                <div className="checkout-section">
                    <h3>📍 Giao đến</h3>
                    {addresses.length === 0 ? (
                        <p>Bạn chưa có địa chỉ. <Link to="/dia-chi" style={{color: '#ff5a1f'}}>Thêm địa chỉ ngay</Link></p>
                    ) : (
                        <div className="address-options">
                            {addresses.map(a => (
                                <label key={a.maDiaChi} className={`address-option ${selectedAddressId === a.maDiaChi ? 'selected' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="address" 
                                        checked={selectedAddressId === a.maDiaChi} 
                                        onChange={() => setSelectedAddressId(a.maDiaChi)}
                                    />
                                    <div>
                                        <strong>{a.tenNguoiNhan} - {a.soDienThoaiNhan}</strong>
                                        <p>{a.diaChiCuThe}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="checkout-section">
                    <h3>📝 Ghi chú cho quán</h3>
                    <textarea 
                        placeholder="Ví dụ: Ít cay, tới nơi gọi điện..." 
                        value={ghiChu} 
                        onChange={e => setGhiChu(e.target.value)}
                        rows={2}
                        className="checkout-note"
                    ></textarea>
                </div>

                <div className="checkout-section">
                    <h3>🎟️ Mã giảm giá</h3>

                    <div className="checkout-promotion">
                        <input
                            aria-label="Mã giảm giá"
                            placeholder="Nhập mã giảm giá"
                            value={maCode}
                            disabled={promotionId !== null || promoBusy}
                            onChange={(e) => setMaCode(e.target.value)}
                        />

                        {promotionId === null ? (
                            <button
                                type="button"
                                onClick={handleApplyPromotion}
                                disabled={promoBusy || !maCode.trim()}
                            >
                                {promoBusy ? "Đang kiểm tra..." : "Áp dụng"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleRemovePromotion}
                                disabled={promoBusy}
                            >
                                Bỏ mã
                            </button>
                        )}
                    </div>

                    {promoMessage && <p className="checkout-promotion-message">{promoMessage}</p>}
                </div>

                <div className="checkout-section summary-box">
                    <h3>💰 Tổng cộng</h3>
                    {checkoutData && (
                        <>
                            <div className="summary-row"><span>Tổng tiền món:</span><span>{checkoutData.tongTienHang.toLocaleString()} đ</span></div>
                            <div className="summary-row"><span>Phí giao hàng:</span><span>{checkoutData.phiShip.toLocaleString()} đ</span></div>
                            <div className="summary-row"><span>Khuyến mãi:</span><span>- {checkoutData.soTienGiam.toLocaleString()} đ</span></div>
                            <hr />
                            <div className="summary-row total"><span>Thanh toán:</span><span>{checkoutData.thanhTien.toLocaleString()} đ</span></div>
                        </>
                    )}
                </div>

                <button className="menu-button" onClick={handlePlaceOrder} disabled={placingOrder || promoBusy || addresses.length === 0} style={{width: '100%', marginTop: 20}}>
                    {placingOrder ? "Đang xử lý..." : "XÁC NHẬN ĐẶT HÀNG"}
                </button>
            </div>
        </main>
    );
}

export default Checkout;