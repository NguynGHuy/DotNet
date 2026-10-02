import { useId, useState } from "react";
import type { SyntheticEvent } from "react";
import {
    createFoodReview,
    createRestaurantReview,
} from "../services/reviewService";

type Props = {
    maDonHang: number;
    title: string;
} & (
        | { loai: "mon"; maMonAn: number }
        | { loai: "quan"; maNhaHang: number }
    );

function OrderReviewForm(props: Props) {
    const inputId = useId();
    const [soSao, setSoSao] = useState(5);
    const [noiDung, setNoiDung] = useState("");
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (
        event: SyntheticEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (busy || success) return;

        try {
            setBusy(true);
            setError("");

            const common = {
                maDonHang: props.maDonHang,
                soSao,
                noiDung: noiDung.trim() || null,
            };

            if (props.loai === "mon") {
                await createFoodReview({
                    ...common,
                    maMonAn: props.maMonAn,
                    hinhAnh: null,
                });
            } else {
                await createRestaurantReview({
                    ...common,
                    maNhaHang: props.maNhaHang,
                });
            }

            setSuccess(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không gửi được đánh giá."
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="order-review-form" onSubmit={handleSubmit}>
            <h3>{props.title}</h3>

            {success ? (
                <p className="order-review-success" role="status">
                    ✓ Đã gửi đánh giá thành công.
                </p>
            ) : (
                <>
                    <fieldset disabled={busy}>
                        <legend>Chọn số sao</legend>

                        <div className="order-review-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={star <= soSao ? "selected" : ""}
                                    aria-label={`${star} sao`}
                                    aria-pressed={star === soSao}
                                    onClick={() => setSoSao(star)}
                                >
                                    ★
                                </button>
                            ))}
                            <span>{soSao}/5</span>
                        </div>

                        <label htmlFor={inputId}>Nhận xét</label>
                        <textarea
                            id={inputId}
                            rows={3}
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            value={noiDung}
                            onChange={(event) =>
                                setNoiDung(event.target.value)
                            }
                        />
                    </fieldset>

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit" disabled={busy}>
                        {busy ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                </>
            )}
        </form>
    );
}

export default OrderReviewForm;