import { useEffect, useState } from "react";
import { getRestaurantReviews } from "../services/reviewService";
import type { RestaurantReview } from "../services/reviewService";
import Pagination from "./Pagination";

interface Props {
    maNhaHang: number;
}

function RestaurantReviews({ maNhaHang }: Props) {
    const [reviews, setReviews] = useState<RestaurantReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        setLoading(true);
        getRestaurantReviews(maNhaHang, { pageNumber, pageSize: 5 })
            .then((data) => {
                setReviews(data.items);
                setTotalItems(data.totalItems);
                setTotalPages(data.totalPages);
                if (data.pageNumber !== pageNumber) setPageNumber(data.pageNumber);
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [maNhaHang, pageNumber]);

    return (
        <section className="restaurant-reviews">
            <div className="restaurant-reviews-heading">
                <h2>Đánh giá nhà hàng</h2>
                {!loading && !error && <span>{totalItems} đánh giá</span>}
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
                    {totalPages > 1 && (
                        <Pagination
                            pageNumber={pageNumber}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={setPageNumber}
                        />
                    )}
                </div>
            )}
        </section>
    );
}

export default RestaurantReviews;
