import { useEffect, useState } from "react";
import { getRestaurantReviews } from "../services/reviewService";
import type { RestaurantReview } from "../services/reviewService";

interface Props {
    maNhaHang: number;
}

function RestaurantReviews({ maNhaHang }: Props) {
    const [reviews, setReviews] = useState<RestaurantReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getRestaurantReviews(maNhaHang)
            .then(setReviews)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [maNhaHang]);

    return (
        <section className="restaurant-reviews">
            <div className="restaurant-reviews-heading">
                <h2>Đánh giá nhà hàng</h2>
                {!loading && !error && <span>{reviews.length} đánh giá</span>}
            </div>

            {error && <p className="auth-error">{error}</p>}

            {loading ? (
                <p>Đang tải đánh giá...</p>
            ) : reviews.length === 0 ? (
                <div className="restaurant-reviews-empty">
                    Chưa có đánh giá nào cho nhà hàng này.
                </div>
            ) : (
                <div className="restaurant-reviews-list">
                    {reviews.map((review) => (
                        <article
                            className="restaurant-review-card"
                            key={review.maDanhGia}
                        >
                            <div className="restaurant-review-top">
                                <strong>Khách hàng</strong>
                                <time dateTime={review.ngayDanhGia}>
                                    {new Date(
                                        review.ngayDanhGia
                                    ).toLocaleDateString("vi-VN")}
                                </time>
                            </div>

                            <div
                                className="restaurant-review-stars"
                                aria-label={`${review.soSao} trên 5 sao`}
                            >
                                {"★".repeat(review.soSao)}
                                <span>{"☆".repeat(5 - review.soSao)}</span>
                            </div>

                            <p>{review.noiDung || "Khách hàng không để lại nhận xét."}</p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default RestaurantReviews;