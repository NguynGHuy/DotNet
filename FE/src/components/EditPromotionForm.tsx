import { useState } from "react";
import type { SyntheticEvent } from "react";
import { updatePromotion } from "../services/promotionService";
import type {
    Promotion,
    UpdatePromotionRequest,
} from "../services/promotionService";

interface Props {
    promotion: Promotion;
    onSaved: (promotion: Promotion) => void;
    onCancel: () => void;
}

function EditPromotionForm({ promotion, onSaved, onCancel }: Props) {
    const [moTa, setMoTa] = useState(promotion.moTa ?? "");
    const [soLuong, setSoLuong] = useState(promotion.soLuong);
    const [ngayBatDau, setNgayBatDau] = useState(
        promotion.ngayBatDau.slice(0, 16)
    );
    const [ngayKetThuc, setNgayKetThuc] = useState(
        promotion.ngayKetThuc.slice(0, 16)
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;

        setError("");

        if (!Number.isInteger(soLuong) ||
            soLuong < Math.max(1, promotion.soLuongDaDung)) {
            setError("Số lượng phải là số nguyên dương và không nhỏ hơn số lượt đã dùng.");
            return;
        }

        const start = new Date(ngayBatDau).getTime();
        const end = new Date(ngayKetThuc).getTime();

        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
            setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
            return;
        }

        const payload: UpdatePromotionRequest = {
            moTa: moTa.trim() || null,
            soLuong,
            ngayBatDau,
            ngayKetThuc,
        };

        try {
            setBusy(true);
            await updatePromotion(promotion.maKhuyenMai, payload);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không cập nhật được mã giảm giá."
            );
            return;
        } finally {
            setBusy(false);
        }

        onSaved({ ...promotion, ...payload });
    };

    return (
        <form className="promotion-edit-form" onSubmit={handleSubmit}>
            <h3>Sửa mã {promotion.maCode}</h3>

            <fieldset disabled={busy}>
                <label>
                    Mô tả
                    <textarea
                        rows={2}
                        value={moTa}
                        onChange={(event) => setMoTa(event.target.value)}
                    />
                </label>

                <label>
                    Tổng số lượng — đã dùng {promotion.soLuongDaDung}
                    <input
                        required
                        type="number"
                        min={Math.max(1, promotion.soLuongDaDung)}
                        step={1}
                        value={soLuong}
                        onChange={(event) =>
                            setSoLuong(Number(event.target.value))
                        }
                    />
                </label>

                <label>
                    Bắt đầu
                    <input
                        required
                        type="datetime-local"
                        value={ngayBatDau}
                        onChange={(event) => setNgayBatDau(event.target.value)}
                    />
                </label>

                <label>
                    Kết thúc
                    <input
                        required
                        type="datetime-local"
                        value={ngayKetThuc}
                        onChange={(event) => setNgayKetThuc(event.target.value)}
                    />
                </label>
            </fieldset>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="promotion-edit-actions">
                <button type="submit" disabled={busy}>
                    {busy ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button type="button" disabled={busy} onClick={onCancel}>
                    Hủy
                </button>
            </div>
        </form>
    );
}

export default EditPromotionForm;