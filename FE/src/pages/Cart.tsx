import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, updateCartItem, removeCartItem, clearCart } from "../services/cartService";
import { getMonAn, type MonAnChiTiet, type NhomToppingMonAn } from "../services/menuService";

function formatMoney(value: number) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Trạng thái cho Modal Sửa món
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [foodLoading, setFoodLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState<MonAnChiTiet | null>(null);
    const [editingCartItemId, setEditingCartItemId] = useState<number | null>(null);
    
    // Giá trị trong Modal
    const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");
    const [foodActionError, setFoodActionError] = useState("");
    const [savingItem, setSavingItem] = useState(false);

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

    // -------------------------------------------------------------
    // LOGIC CHỈNH SỬA SỐ LƯỢNG NHANH TRÊN GIỎ HÀNG
    // -------------------------------------------------------------
    const handleUpdateQtyOnly = async (id: number, currentQty: number, change: number) => {
        const newQty = currentQty + change;
        if (newQty < 1) return;
        try {
            // Lấy item cũ để giữ nguyên ghi chú và topping
            const oldItem = cart.chiTiet.find((x: any) => x.maChiTietGioHang === id);
            await updateCartItem(id, { 
                soLuong: newQty,
                ghiChu: oldItem.ghiChu,
                danhSachMaTopping: oldItem.toppings.map((t: any) => t.maTopping)
            });
            loadCart();
        } catch (error: any) {
            alert(error.message || "Lỗi cập nhật số lượng.");
        }
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

    // -------------------------------------------------------------
    // LOGIC MỞ MODAL SỬA TOÀN BỘ MÓN (TOPPING, GHI CHÚ, SỐ LƯỢNG)
    // -------------------------------------------------------------
    const openEditModal = async (item: any) => {
        setEditModalOpen(true);
        setEditingCartItemId(item.maChiTietGioHang);
        setFoodActionError("");
        setSelectedFood(null);

        try {
            setFoodLoading(true);
            // Fetch chi tiết món để lấy danh sách Topping khả dụng
            const detail = await getMonAn(item.maMonAn);
            setSelectedFood(detail);
            
            // Gán giá trị cũ vào Modal
            setQuantity(item.soLuong);
            setNote(item.ghiChu || "");
            setSelectedToppingIds(item.toppings.map((t: any) => t.maTopping));
            
        } catch (err) {
            setFoodActionError(err instanceof Error ? err.message : "Không thể tải thông tin món ăn.");
        } finally {
            setFoodLoading(false);
        }
    };

    const closeEditModal = useCallback(() => {
        if (savingItem) return;
        setEditModalOpen(false);
        setSelectedFood(null);
        setEditingCartItemId(null);
    }, [savingItem]);

    const handleToggleTopping = (group: NhomToppingMonAn, toppingId: number) => {
        setFoodActionError("");

        if (selectedToppingIds.includes(toppingId)) {
            setSelectedToppingIds((current) => current.filter((id) => id !== toppingId));
            return;
        }

        const idsInGroup = new Set(group.toppings.map((t) => t.maTopping));
        const selectedInGroup = selectedToppingIds.filter((id) => idsInGroup.has(id));

        if (group.chonToiDa === 1) {
            setSelectedToppingIds((current) => [...current.filter((id) => !idsInGroup.has(id)), toppingId]);
            return;
        }

        if (group.chonToiDa !== null && selectedInGroup.length >= group.chonToiDa) {
            setFoodActionError(`Nhóm “${group.tenNhom}” chỉ được chọn tối đa ${group.chonToiDa} lựa chọn.`);
            return;
        }

        setSelectedToppingIds((current) => [...current, toppingId]);
    };

    const handleSaveCartItem = async () => {
        if (!selectedFood || !editingCartItemId) return;

        const missingRequiredGroup = selectedFood.nhomToppings.find(
            (group) => group.batBuocChon && !group.toppings.some((t) => selectedToppingIds.includes(t.maTopping))
        );

        if (missingRequiredGroup) {
            setFoodActionError(`Vui lòng chọn ít nhất một lựa chọn trong nhóm “${missingRequiredGroup.tenNhom}”.`);
            return;
        }

        try {
            setSavingItem(true);
            setFoodActionError("");

            await updateCartItem(editingCartItemId, {
                soLuong: quantity,
                ghiChu: note.trim() || undefined,
                danhSachMaTopping: selectedToppingIds,
            });

            closeEditModal();
            loadCart();
        } catch (err) {
            setFoodActionError(err instanceof Error ? err.message : "Không thể cập nhật món.");
        } finally {
            setSavingItem(false);
        }
    };

    // Khóa scroll body khi mở modal
    useEffect(() => {
        if (editModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeEditModal();
        };
        window.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [editModalOpen, closeEditModal]);

    /* TÍNH TOÁN GIÁ TIỀN TRONG MODAL */
    const selectedToppingsPrice = selectedFood?.nhomToppings
        .flatMap((group) => group.toppings)
        .filter((topping) => selectedToppingIds.includes(topping.maTopping))
        .reduce((total, topping) => total + topping.giaThem, 0) ?? 0;
    const selectedFoodTotal = selectedFood ? (selectedFood.gia + selectedToppingsPrice) * quantity : 0;


    /* RENDER GIỎ HÀNG CHÍNH */
    if (loading) return <main className="cart-page"><div className="loading-spinner"></div></main>;

    if (!cart || !cart.chiTiet || cart.chiTiet.length === 0) {
        return (
            <main className="cart-page empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <h2>Giỏ hàng trống</h2>
                <p>Hãy thêm món ăn hấp dẫn vào giỏ hàng nhé!</p>
                <Link to="/" className="menu-button">Đi chọn món</Link>
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
                                        + {tp.tenTopping} ({tp.giaThem > 0 ? `${tp.giaThem.toLocaleString('vi-VN')}đ` : 'Miễn phí'})
                                    </span>
                                ))}
                                {item.ghiChu && <p className="item-note">Ghi chú: {item.ghiChu}</p>}
                                <div className="item-price">{item.thanhTien.toLocaleString('vi-VN')} đ</div>
                            </div>
                            
                            <div className="item-actions">
                                <div className="qty-control">
                                    <button onClick={() => handleUpdateQtyOnly(item.maChiTietGioHang, item.soLuong, -1)}>-</button>
                                    <span>{item.soLuong}</span>
                                    <button onClick={() => handleUpdateQtyOnly(item.maChiTietGioHang, item.soLuong, 1)}>+</button>
                                </div>
                                <button className="edit-btn" onClick={() => openEditModal(item)} style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Sửa</button>
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
                    <button className="checkout-btn" onClick={() => navigate('/thanh-toan')}>Đặt món</button>
                </div>
            </div>

            {/* =========================================================
                MODAL SỬA MÓN (Tương tự Modal bên Detail)
            ========================================================= */}
            {editModalOpen && (
                <div
                    className="food-order-overlay"
                    role="presentation"
                    onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
                >
                    <section className="food-order-dialog" role="dialog" aria-modal="true" aria-labelledby="food-edit-title">
                        <button type="button" className="food-order-close" aria-label="Đóng" disabled={savingItem} onClick={closeEditModal}>×</button>

                        {foodLoading ? (
                            <div className="food-order-state"><div className="loading-spinner" /><p>Đang tải thông tin món...</p></div>
                        ) : !selectedFood ? (
                            <div className="food-order-state error">
                                <strong>Lỗi tải món</strong>
                                <p>{foodActionError || "Món ăn không tồn tại hoặc đã ngừng bán."}</p>
                            </div>
                        ) : (
                            <>
                                <div className="food-order-hero">
                                    <div className="food-order-image">
                                        {selectedFood.hinhAnh ? <img src={selectedFood.hinhAnh} alt={selectedFood.tenMonAn} /> : <div>🍜</div>}
                                    </div>
                                    <div className="food-order-summary">
                                        <span>{selectedFood.tenDanhMuc}</span>
                                        <h2 id="food-edit-title">{selectedFood.tenMonAn}</h2>
                                        <p>{selectedFood.moTa || "Chỉnh sửa tùy chọn của bạn."}</p>
                                        <strong>{formatMoney(selectedFood.gia)}</strong>
                                    </div>
                                </div>

                                <div className="food-order-body">
                                    {selectedFood.nhomToppings.map((group) => (
                                        <fieldset className="food-topping-group" key={group.maNhomTopping}>
                                            <legend>
                                                <span>
                                                    {group.tenNhom}
                                                    {group.batBuocChon && <b> Bắt buộc</b>}
                                                </span>
                                                <small>{group.chonToiDa === null ? "Chọn tùy thích" : `Chọn tối đa ${group.chonToiDa}`}</small>
                                            </legend>
                                            <div className="food-topping-list">
                                                {group.toppings.map((topping) => (
                                                    <label className="food-topping-option" key={topping.maTopping}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedToppingIds.includes(topping.maTopping)}
                                                            onChange={() => handleToggleTopping(group, topping.maTopping)}
                                                        />
                                                        <span>{topping.tenTopping}</span>
                                                        <strong>{topping.giaThem > 0 ? `+${formatMoney(topping.giaThem)}` : "Miễn phí"}</strong>
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>
                                    ))}

                                    <div className="food-order-note">
                                        <label htmlFor="food-note">Ghi chú cho quán</label>
                                        <textarea
                                            id="food-note"
                                            maxLength={200}
                                            rows={3}
                                            value={note}
                                            placeholder="Ví dụ: ít cay, không hành..."
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                        <small>{note.length}/200</small>
                                    </div>

                                    <div className="food-order-quantity-row">
                                        <span>Số lượng</span>
                                        <div className="food-order-quantity">
                                            <button type="button" disabled={quantity <= 1} onClick={() => setQuantity((v) => Math.max(1, v - 1))}>−</button>
                                            <strong>{quantity}</strong>
                                            <button type="button" disabled={quantity >= 100} onClick={() => setQuantity((v) => Math.min(100, v + 1))}>+</button>
                                        </div>
                                    </div>

                                    {foodActionError && <p className="food-order-message error">{foodActionError}</p>}
                                </div>

                                <div className="food-order-footer">
                                    <button
                                        type="button"
                                        className="food-order-submit"
                                        disabled={savingItem}
                                        onClick={handleSaveCartItem}
                                    >
                                        <span>{savingItem ? "Đang lưu..." : "Cập nhật giỏ hàng"}</span>
                                        {!savingItem && <strong>{formatMoney(selectedFoodTotal)}</strong>}
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}

export default Cart;