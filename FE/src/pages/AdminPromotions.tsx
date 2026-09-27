import { useEffect, useState } from "react";
import CreatePromotionForm from "../components/CreatePromotionForm";
import {
    getSystemPromotions,
    togglePromotionStatus,
} from "../services/promotionService";
import type { Promotion } from "../services/promotionService";

function AdminPromotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getSystemPromotions()
            .then(setPromotions)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const reload = async () => {
        const data = await getSystemPromotions();
        setPromotions(data);
    };

    const handleToggle = async (id: number) => {
        try {
            setBusyId(id);
            setError("");
            await togglePromotionStatus(id);
            await reload();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusyId(null);
        }
    };

    const formatMoney = (value: number) =>
        `${value.toLocaleString("vi-VN")} đ`;

    return (
        <main className="admin-promotions-page">
            <div className="profile-page-header">
                <h1>Khuyến mãi toàn hệ thống</h1>
                <p>Tạo và quản lý mã áp dụng cho các nhà hàng đủ điều kiện.</p>
            </div>

            <CreatePromotionForm admin onCreated={reload} />

            <section>
                <h2>Danh sách mã toàn hệ thống</h2>
                {error && <p className="auth-error">{error}</p>}

                {loading ? (
                    <p>Đang tải danh sách mã...</p>
                ) : promotions.length === 0 ? (
                    <div className="admin-pending-empty">
                        <h2>Chưa có mã toàn hệ thống</h2>
                        <p>Tạo mã bằng biểu mẫu phía trên.</p>
                    </div>
                ) : (
                    <div className="promotion-list">
                        {promotions.map((item) => (
                            <article
                                className="promotion-card"
                                key={item.maKhuyenMai}
                            >
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
                                        {item.trangThai
                                            ? "Đang bật"
                                            : "Đã tắt"}
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
                                                Tối đa{" "}
                                                {formatMoney(item.giamToiDa)}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <small>Đơn tối thiểu</small>
                                        <strong>
                                            {formatMoney(
                                                item.donHangToiThieu
                                            )}
                                        </strong>
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
                                        {new Date(
                                            item.ngayBatDau
                                        ).toLocaleString("vi-VN")}
                                        {" → "}
                                        {new Date(
                                            item.ngayKetThuc
                                        ).toLocaleString("vi-VN")}
                                    </p>

                                    <button
                                        type="button"
                                        disabled={busyId === item.maKhuyenMai}
                                        onClick={() =>
                                            handleToggle(item.maKhuyenMai)
                                        }
                                    >
                                        {busyId === item.maKhuyenMai
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
            </section>
        </main>
    );
}

export default AdminPromotions;