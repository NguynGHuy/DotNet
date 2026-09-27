import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAddresses } from "../services/addressService";
import type { Address } from "../services/addressService";
import { checkPreCheckout, placeOrder } from "../services/orderService";

function Checkout() {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [checkoutData, setCheckoutData] = useState<any>(null);
    const [ghiChu, setGhiChu] = useState("");
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
                const moneyData = await checkPreCheckout(null);
                setCheckoutData(moneyData);
            } catch (error: any) {
                alert(error.message || "Giỏ hàng trống hoặc có lỗi xảy ra");
                navigate("/gio-hang");
            } finally {
                setLoading(false);
            }
        };
        initCheckout();
    }, [navigate]);

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert("Vui lòng chọn địa chỉ giao hàng!");
            return;
        }
        try {
            setPlacingOrder(true);
            const res = await placeOrder({
                maDiaChi: selectedAddressId,
                maKhuyenMai: null, // Chưa tích hợp nhập mã ở đây để đơn giản hoá
                ghiChu: ghiChu
            });
            alert("Đặt hàng thành công! Mã đơn: " + res.maDonHangHienThi);
            navigate("/don-hang"); // Chuyển tới lịch sử đơn hàng
        } catch (error: any) {
            alert("Lỗi đặt hàng: " + error.message);
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

                <button className="menu-button" onClick={handlePlaceOrder} disabled={placingOrder || addresses.length === 0} style={{width: '100%', marginTop: 20}}>
                    {placingOrder ? "Đang xử lý..." : "XÁC NHẬN ĐẶT HÀNG"}
                </button>
            </div>
        </main>
    );
}

export default Checkout;