import { useEffect, useState } from "react";
import { getFoodReviews } from "../services/reviewService";
import type { FoodReview } from "../services/reviewService";

interface Props {
    maMonAn: number;
}

function FoodReviewList({ maMonAn }: Props) {
    const [reviews, setReviews] = useState<FoodReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getFoodReviews(maMonAn)
            .then((data) => {
                if (!cancelled) setReviews(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Không tải được đánh giá."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [maMonAn]);

    if (loading) return <p>Đang tải đánh giá...</p>;
    if (error) return <p className="auth-error">{error}</p>;

    if (reviews.length === 0) {
        return <p className="food-reviews-empty">Món này chưa có đánh giá.</p>;
    }

    return (
        <div className="food-reviews-list">
            <span className="food-reviews-count">
                {reviews.length} đánh giá
            </span>

            {reviews.map((review) => {
                const stars = Math.max(
                    0,
                    Math.min(5, Math.round(review.soSao))
                );

                return (
                    <article
                        key={review.maDanhGia}
                        className="food-review-item"
                    >
                        <div className="food-review-heading">
                            <strong>Khách hàng</strong>
                            <time dateTime={review.ngayDanhGia}>
                                {new Date(
                                    review.ngayDanhGia
                                ).toLocaleDateString("vi-VN")}
                            </time>
                        </div>

                        <div
                            className="food-review-stars"
                            aria-label={`${stars} trên 5 sao`}
                        >
                            {"★".repeat(stars)}
                            <span>{"☆".repeat(5 - stars)}</span>
                        </div>

                        <p>
                            {review.noiDung ||
                                "Khách hàng không để lại nhận xét."}
                        </p>
                    </article>
                );
            })}
        </div>
    );
}

function FoodReviews({ maMonAn }: Props) {
    const [open, setOpen] = useState(false);
    const panelId = `food-reviews-${maMonAn}`;

    return (
        <div
            className="food-reviews"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className="food-reviews-toggle"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((previous) => !previous)}
            >
                {open ? "Ẩn đánh giá ↑" : "Xem đánh giá →"}
            </button>

            <div id={panelId} hidden={!open}>
                {open && (
                    <FoodReviewList
                        key={maMonAn}
                        maMonAn={maMonAn}
                    />
                )}
            </div>
        </div>
    );
}

export default FoodReviews;
