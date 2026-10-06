import { useEffect, useState } from "react";
import OrderReviewForm from "./OrderReviewForm";
import { getMyOrderReviews } from "../services/reviewService";
import type { OrderReviews } from "../services/reviewService";

interface Props {
    maDonHang: number;
    maNhaHang: number;
    tenNhaHang: string;
    dishes: { maMonAn: number; tenMonAn: string }[];
}

function OrderReviewPanel({
    maDonHang,
    maNhaHang,
    tenNhaHang,
    dishes,
}: Props) {
    const [data, setData] = useState<OrderReviews | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getMyOrderReviews(maDonHang)
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Không tải được đánh giá đã gửi."
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [maDonHang]);

    if (error) return <p className="auth-error" role="alert">{error}</p>;
    if (!data) return <p>Đang tải đánh giá của bạn...</p>;

    return (
        <div className="order-review-list">
            <OrderReviewForm
                key={`quan-${maDonHang}`}
                loai="quan"
                maDonHang={maDonHang}
                maNhaHang={maNhaHang}
                title={`Quán: ${tenNhaHang}`}
                existingReview={data.danhGiaQuan}
            />

            {dishes.map((dish) => (
                <OrderReviewForm
                    key={`mon-${maDonHang}-${dish.maMonAn}`}
                    loai="mon"
                    maDonHang={maDonHang}
                    maMonAn={dish.maMonAn}
                    title={`Món: ${dish.tenMonAn}`}
                    existingReview={data.danhGiaMon.find(
                        (review) => review.maMonAn === dish.maMonAn
                    )}
                />
            ))}
        </div>
    );
}

export default OrderReviewPanel;
