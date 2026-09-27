import { useState } from "react";
import type { SyntheticEvent } from "react";
import {
    createPromotion,
    createSystemPromotion,
} from "../services/promotionService";

interface Props {
    onCreated?: () => Promise<void>;
    admin?: boolean;
}
function CreatePromotionForm({ onCreated, admin = false }: Props) {
    const [maCode, setMaCode] = useState("");
    const [moTa, setMoTa] = useState("");
    const [loaiGiam, setLoaiGiam] = useState<"PhanTram" | "SoTien">("PhanTram");
    const [giaTriGiam, setGiaTriGiam] = useState(10);
    const [giamToiDa, setGiamToiDa] = useState("");
    const [donHangToiThieu, setDonHangToiThieu] = useState(0);
    const [soLuong, setSoLuong] = useState(100);
    const [ngayBatDau, setNgayBatDau] = useState("");
    const [ngayKetThuc, setNgayKetThuc] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (new Date(ngayKetThuc) <= new Date(ngayBatDau)) {
            setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
            return;
        }

        if (loaiGiam === "PhanTram" && giaTriGiam > 100) {
            setError("Mức giảm phần trăm không được vượt quá 100%.");
            return;
        }

        try {
            setBusy(true);

            const payload = {
                maCode: maCode.trim().toUpperCase(),
                moTa: moTa.trim() || null,
                loaiGiam,
                giaTriGiam,
                giamToiDa:
    loaiGiam === "PhanTram" && giamToiDa !== ""
        ? Number(giamToiDa)
        : null,
                donHangToiThieu,
                soLuong,
                ngayBatDau,
                ngayKetThuc,
            };

            if (admin) {
                await createSystemPromotion(payload);
            } else {
                await createPromotion(payload);
            }

            setSuccess("Đã tạo mã giảm giá.");
            setMaCode("");
            setMoTa("");

            if (onCreated) {
                await onCreated();
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="promotion-create-form" onSubmit={handleSubmit}>
            <h2 style={{ margin: 0 }}>Tạo mã giảm giá</h2>

            {error && <p className="auth-error">{error}</p>}
            {success && <p role="status">{success}</p>}

            <label>
                Mã giảm giá
                <input
                    required
                    maxLength={30}
                    value={maCode}
                    onChange={(e) => setMaCode(e.target.value)}
                />
            </label>

            <label>
                Mô tả
                <input
                    value={moTa}
                    onChange={(e) => setMoTa(e.target.value)}
                />
            </label>

            <label>
                Loại giảm
                <select
                    value={loaiGiam}
                    onChange={(e) => {
                        setLoaiGiam(e.target.value as "PhanTram" | "SoTien");
                        setGiamToiDa("");
                    }}
                >
                    <option value="PhanTram">Phần trăm</option>
                    <option value="SoTien">Số tiền</option>
                </select>
            </label>

            <label>
                Giá trị giảm
                <input
                    required
                    type="number"
                    min={1}
                    max={loaiGiam === "PhanTram" ? 100 : undefined}
                    value={giaTriGiam}
                    onChange={(e) => setGiaTriGiam(Number(e.target.value))}
                />
            </label>

            {loaiGiam === "PhanTram" && (
                <label>
                    Giảm tối đa (để trống nếu không giới hạn)
                    <input
                        type="number"
                        min={0}
                        value={giamToiDa}
                        onChange={(e) => setGiamToiDa(e.target.value)}
                    />
                </label>
            )}

            <label>
                Đơn hàng tối thiểu
                <input
                    required
                    type="number"
                    min={0}
                    value={donHangToiThieu}
                    onChange={(e) =>
                        setDonHangToiThieu(Number(e.target.value))
                    }
                />
            </label>

            <label>
                Số lượng mã
                <input
                    required
                    type="number"
                    min={1}
                    value={soLuong}
                    onChange={(e) => setSoLuong(Number(e.target.value))}
                />
            </label>

            <label>
                Bắt đầu
                <input
                    required
                    type="datetime-local"
                    value={ngayBatDau}
                    onChange={(e) => setNgayBatDau(e.target.value)}
                />
            </label>

            <label>
                Kết thúc
                <input
                    required
                    type="datetime-local"
                    value={ngayKetThuc}
                    onChange={(e) => setNgayKetThuc(e.target.value)}
                />
            </label>

            <button type="submit" disabled={busy}>
                {busy ? "Đang tạo..." : "Tạo mã"}
            </button>
        </form>
    );
}

export default CreatePromotionForm;