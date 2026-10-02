import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, updateCartItemQty, removeCartItem, clearCart } from "../services/cartService";

function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadCart = async () => {
        try {
            setLoading(true);
            const data = await getCart();
            setCart(data);
        } catch (error) {
            console.error("Lỗi tải giỏ hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    const handleUpdateQty = async (id: number, currentQty: number, change: number) => {
        const newQty = currentQty + change;
        if (newQty < 1) return;
        await updateCartItemQty(id, newQty);
        loadCart();
    };

    const handleRemove = async (id: number) => {
        if (!window.confirm("Bỏ món này khỏi giỏ hàng?")) return;
        await removeCartItem(id);
        loadCart();
    };

    const handleClear = async () => {
        if (!window.confirm("Xoá toàn bộ giỏ hàng?")) return;
        await clearCart();
        loadCart();
    };

    if (loading) return <main className="cart-page"><div className="loading-spinner"></div></main>;

    if (!cart || !cart.chiTiet || cart.chiTiet.length === 0) {
        return (
            <main className="cart-page empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <h2>Giỏ hàng trống</h2>
                <p>Hãy thêm món ăn hấp dẫn vào giỏ hàng nhé!</p>
                <Link to="/" className="menu-button">Đi chọn món</Link>
                <button className="checkout-btn" onClick={() => navigate('/thanh-toan')} style={{ marginTop: 16 }}>
                    Đặt món
                </button>
            </main>
        );
    }

    return (
        <main className="cart-page">
            <div className="cart-container">
                <div className="cart-header">
                    <h2>Giỏ hàng của bạn</h2>
                    <button className="clear-cart-btn" onClick={handleClear}>Xoá tất cả</button>
                </div>

                <div className="cart-items">
                    {cart.chiTiet.map((item: any) => (
                        <div key={item.maChiTietGioHang} className="cart-item">
                            <div className="item-info">
                                <h3>{item.tenMonAn}</h3>
                                {item.toppings.map((tp: any) => (
                                    <span key={tp.maTopping} className="item-topping">
                                        + {tp.tenTopping} ({tp.giaThem.toLocaleString('vi-VN')}đ)
                                    </span>
                                ))}
                                {item.ghiChu && <p className="item-note">Ghi chú: {item.ghiChu}</p>}
                                <div className="item-price">{item.thanhTien.toLocaleString('vi-VN')} đ</div>
                            </div>
                            
                            <div className="item-actions">
                                <div className="qty-control">
                                    <button onClick={() => handleUpdateQty(item.maChiTietGioHang, item.soLuong, -1)}>-</button>
                                    <span>{item.soLuong}</span>
                                    <button onClick={() => handleUpdateQty(item.maChiTietGioHang, item.soLuong, 1)}>+</button>
                                </div>
                                <button className="remove-btn" onClick={() => handleRemove(item.maChiTietGioHang)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <div className="summary-row total">
                        <span>Tạm tính:</span>
                        <span>{cart.tongTienTamTinh.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {/* KHOI PHUC KHI GIO HANG DAY DU
                    <button className="checkout-btn" onClick={() => navigate('/thanh-toan')}>Tiến hành Đặt hàng →</button>
                    */}
                    <button className="checkout-btn" onClick={() => navigate('/thanh-toan')}>Đặt món</button>
                </div>
            </div>
        </main>
    );
}

export default Cart;