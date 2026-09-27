import { useEffect, useState } from "react";
import {
    getMyPromotions,
    togglePromotionStatus,
} from "../services/promotionService";
import type { Promotion } from "../services/promotionService";
import CreatePromotionForm from "../components/CreatePromotionForm";

function Promotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [changingId, setChangingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const loadPromotions = async () => {
        try {
            setError("");
            const data = await getMyPromotions();
            setPromotions(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMyPromotions()
            .then(setPromotions)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (id: number) => {
        try {
            setChangingId(id);
            setError("");
            await togglePromotionStatus(id);
            await loadPromotions();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setChangingId(null);
        }
    };

    const formatMoney = (value: number) =>
        `${value.toLocaleString("vi-VN")} đ`;

    return (
        <main className="profile-page">
            <div className="profile-page-header">
                <h1>Mã giảm giá của quán</h1>
                <p>Quản lý các chương trình khuyến mãi của nhà hàng</p>
            </div>

            <CreatePromotionForm onCreated={loadPromotions} />
                
            {error && <p className="auth-error">{error}</p>}

            {loading ? (
                <p>Đang tải mã giảm giá...</p>
            ) : promotions.length === 0 ? (
                <div className="empty-result">
                    <div>🎟️</div>
                    <h3>Chưa có mã giảm giá</h3>
                    <p>Ở bước sau chúng ta sẽ thêm biểu mẫu tạo mã.</p>
                </div>
            ) : (
                        <div className="promotion-list">
                            {promotions.map((item) => (
                                <article className="promotion-card" key={item.maKhuyenMai}>
                                    <div className="promotion-card-header">
                                        <div>
                                            <h2>{item.maCode}</h2>
                                            <p>{item.moTa || "Không có mô tả"}</p>
                                        </div>

                                        <span
                                            className={
                                                item.trangThai
                                                    ? "promotion-status is-active"
                                                    : "promotion-status is-inactive"
                                            }
                                        >
                                            {item.trangThai ? "Đang bật" : "Đã tắt"}
                                        </span>
                                    </div>

                                    <div className="promotion-card-details">
                                        <div>
                                            <small>Mức giảm</small>
                                            <strong>
                                                {item.loaiGiam === "PhanTram"
                                                    ? `${item.giaTriGiam}%`
                                                    : formatMoney(item.giaTriGiam)}
                                            </strong>
                                            {item.giamToiDa !== null && (
                                                <span>
                                                    Tối đa {formatMoney(item.giamToiDa)}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <small>Đơn tối thiểu</small>
                                            <strong>{formatMoney(item.donHangToiThieu)}</strong>
                                        </div>

                                        <div>
                                            <small>Đã sử dụng</small>
                                            <strong>
                                                {item.soLuongDaDung}/{item.soLuong}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="promotion-card-footer">
                                        <p>
                                            <span>Thời hạn</span>
                                            {new Date(item.ngayBatDau).toLocaleString("vi-VN")}
                                            {" → "}
                                            {new Date(item.ngayKetThuc).toLocaleString("vi-VN")}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => handleToggle(item.maKhuyenMai)}
                                            disabled={changingId === item.maKhuyenMai}
                                        >
                                            {changingId === item.maKhuyenMai
                                                ? "Đang xử lý..."
                                                : item.trangThai
                                                    ? "Tắt mã"
                                                    : "Bật mã"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
            )}
        </main>
    );
}

export default Promotions;