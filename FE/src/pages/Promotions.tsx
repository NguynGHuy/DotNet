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
            setLoading(true);
            setError("");

            const data = await getMyPromotions();
            setPromotions(data);
        } catch (err) {
            console.error("Lỗi lấy danh sách khuyến mãi:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể lấy danh sách khuyến mãi."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPromotions();
    }, []);

    const handleToggle = async (id: number) => {
        try {
            setChangingId(id);
            setError("");

            await togglePromotionStatus(id);

            // Lấy lại danh sách mới nhất
            const data = await getMyPromotions();
            setPromotions(data);
        } catch (err) {
            console.error("Lỗi thay đổi trạng thái mã:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể thay đổi trạng thái mã giảm giá."
            );
        } finally {
            setChangingId(null);
        }
    };

    const formatMoney = (value: number) => {
        return `${value.toLocaleString("vi-VN")} đ`;
    };

    const formatDate = (value: string) => {
        return new Date(value).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="quan-page-loading">
                Đang tải danh sách khuyến mãi...
            </div>
        );
    }

    return (
        <div className="quan-dashboard">

            {/* =========================
                TIÊU ĐỀ
            ========================= */}
            <div className="quan-page-title">
                <div>
                    <h1>Khuyến mãi</h1>
                    <p>
                        Quản lý các mã giảm giá của nhà hàng.
                    </p>
                </div>
            </div>


            {/* =========================
                THÔNG BÁO LỖI
            ========================= */}
            {error && (
                <div className="quan-error-message">
                    ✕ {error}
                </div>
            )}


            {/* =========================
                TẠO MÃ GIẢM GIÁ
            ========================= */}
            <div className="quan-section">

                <div className="quan-section-header">
                    <div>
                        <h2>Tạo mã giảm giá</h2>

                        <p>
                            Tạo chương trình khuyến mãi mới
                            cho khách hàng.
                        </p>
                    </div>
                </div>

                <CreatePromotionForm
                    onCreated={loadPromotions}
                />

            </div>


            {/* =========================
                DANH SÁCH KHUYẾN MÃI
            ========================= */}
            <div className="quan-section">

                <div className="quan-section-header">
                    <div>
                        <h2>Danh sách mã giảm giá</h2>

                        <p>
                            Quản lý các mã giảm giá hiện có
                            của nhà hàng.
                        </p>
                    </div>

                    <span className="quan-promotion-count">
                        {promotions.length} mã
                    </span>
                </div>


                {promotions.length === 0 ? (

                    <div className="quan-placeholder">
                        <div className="quan-empty-icon">
                            🎟️
                        </div>

                        <h3>
                            Chưa có mã giảm giá
                        </h3>

                        <p>
                            Hãy tạo mã giảm giá đầu tiên
                            cho nhà hàng.
                        </p>
                    </div>

                ) : (

                    <div className="quan-promotion-list">

                        {promotions.map((item) => (

                            <div
                                className="quan-promotion-item"
                                key={item.maKhuyenMai}
                            >

                                {/* HEADER */}
                                <div className="quan-promotion-header">

                                    <div>
                                        <span className="quan-promotion-code-label">
                                            MÃ GIẢM GIÁ
                                        </span>

                                        <h3>
                                            {item.maCode}
                                        </h3>

                                        <p>
                                            {item.moTa ||
                                                "Không có mô tả"}
                                        </p>
                                    </div>


                                    <span
                                        className={`quan-promotion-status ${
                                            item.trangThai
                                                ? "active"
                                                : "inactive"
                                        }`}
                                    >
                                        ●{" "}
                                        {item.trangThai
                                            ? "Đang bật"
                                            : "Đã tắt"}
                                    </span>

                                </div>


                                {/* THÔNG TIN */}
                                <div className="quan-promotion-details">

                                    <div>
                                        <span>
                                            Mức giảm
                                        </span>

                                        <strong>
                                            {item.loaiGiam ===
                                            "PhanTram"
                                                ? `${item.giaTriGiam}%`
                                                : formatMoney(
                                                      item.giaTriGiam
                                                  )}
                                        </strong>

                                        {item.giamToiDa !== null && (
                                            <small>
                                                Tối đa{" "}
                                                {formatMoney(
                                                    item.giamToiDa
                                                )}
                                            </small>
                                        )}
                                    </div>


                                    <div>
                                        <span>
                                            Đơn tối thiểu
                                        </span>

                                        <strong>
                                            {formatMoney(
                                                item.donHangToiThieu
                                            )}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Đã sử dụng
                                        </span>

                                        <strong>
                                            {item.soLuongDaDung}
                                            /
                                            {item.soLuong}
                                        </strong>
                                    </div>

                                </div>


                                {/* FOOTER */}
                                <div className="quan-promotion-footer">

                                    <div>
                                        <span>
                                            Thời hạn
                                        </span>

                                        <p>
                                            {formatDate(
                                                item.ngayBatDau
                                            )}

                                            {" → "}

                                            {formatDate(
                                                item.ngayKetThuc
                                            )}
                                        </p>
                                    </div>


                                    <button
                                        type="button"
                                        className={
                                            item.trangThai
                                                ? "quan-secondary-button"
                                                : "quan-primary-button"
                                        }
                                        onClick={() =>
                                            handleToggle(
                                                item.maKhuyenMai
                                            )
                                        }
                                        disabled={
                                            changingId ===
                                            item.maKhuyenMai
                                        }
                                    >
                                        {changingId ===
                                        item.maKhuyenMai
                                            ? "Đang xử lý..."
                                            : item.trangThai
                                            ? "Tắt mã"
                                            : "Bật mã"}
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}

export default Promotions;