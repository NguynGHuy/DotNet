interface RestaurantCardSkeletonProps {
    count?: number;
    className: string;
}

function RestaurantCardSkeleton({
    count = 6,
    className,
}: RestaurantCardSkeletonProps) {
    return (
        <div
            className={`${className} restaurant-skeleton-container`}
            aria-label="Đang tải danh sách nhà hàng"
            aria-busy="true"
        >
            {Array.from({ length: count }, (_, index) => (
                <article
                    key={index}
                    className="restaurant-skeleton-card"
                    aria-hidden="true"
                >
                    <div className="restaurant-skeleton-image" />

                    <div className="restaurant-skeleton-content">
                        <div className="restaurant-skeleton-line title" />

                        <div className="restaurant-skeleton-line description" />

                        <div className="restaurant-skeleton-line description short" />

                        <div className="restaurant-skeleton-meta">
                            <div className="restaurant-skeleton-line meta" />
                            <div className="restaurant-skeleton-line price" />
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default RestaurantCardSkeleton;