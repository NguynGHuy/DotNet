import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getAdminAccounts,
    getAdminOverview,
    getPendingRestaurants,
    getTopRestaurants,
} from "../services/adminService";

import type {
    AdminOverview,
    TopRestaurant,
} from "../services/adminService";

interface DashboardData {
    overview: AdminOverview;
    accountCount: number;
    pendingCount: number;
    topRestaurants: TopRestaurant[];
}

function AdminHome() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([
            getAdminOverview(),
            getAdminAccounts(),
            getPendingRestaurants(),
            getTopRestaurants(),
        ])
            .then(([overview, accounts, pending, topRestaurants]) => {
                setData({
                    overview,
                    accountCount: accounts.length,
                    pendingCount: pending.length,
                    topRestaurants,
                });
            })
            .catch((err: Error) => setError(err.message));
    }, []);

    return (
        <main className="admin-home">
            <div className="admin-home-heading">
                <span>ADMIN DASHBOARD</span>
                <h1>Tổng quan quản trị</h1>
                <p>Theo dõi hoạt động và xử lý công việc của hệ thống.</p>
            </div>

            {error && <p className="auth-error">{error}</p>}

            {!data && !error && <p>Đang tải số liệu...</p>}

            {data && (
                <>
                    <div className="admin-stats">
                        <div className="admin-stat-card">
                            <span>👥 Tài khoản</span>
                            <strong>{data.accountCount}</strong>
                        </div>

                        <div className="admin-stat-card">
                            <span>🏪 Nhà hàng đã duyệt</span>
                            <strong>{data.overview.tongNhaHang}</strong>
                        </div>

                        <div className="admin-stat-card">
                            <span>🧾 Tổng đơn hàng</span>
                            <strong>{data.overview.tongDonHang}</strong>
                        </div>

                        <div className="admin-stat-card">
                            <span>💰 Doanh thu đơn hoàn thành</span>
                            <strong>
                                {data.overview.tongDoanhThu.toLocaleString("vi-VN")} đ
                            </strong>
                        </div>
                    </div>

                    <div className="admin-home-grid">
                        <Link
                            to="/admin/tai-khoan"
                            className="admin-home-card"
                        >
                            <span className="admin-home-icon">👥</span>
                            <h2>Tài khoản</h2>
                            <p>Khóa hoặc mở khóa tài khoản người dùng.</p>
                            <strong>Quản lý tài khoản →</strong>
                        </Link>

                        <Link
                            to="/admin/nha-hang"
                            className="admin-home-card"
                        >
                            <span className="admin-home-icon">🏪</span>
                            <h2>Nhà hàng chờ duyệt</h2>
                            <p>
                                Hiện có {data.pendingCount} nhà hàng đang
                                chờ xử lý.
                            </p>
                            <strong>Xem yêu cầu →</strong>
                        </Link>
                    </div>

                    <section className="admin-top-restaurants">
                        <h2>Nhà hàng được đánh giá cao</h2>

                        {data.topRestaurants.length === 0 ? (
                            <p>Chưa có nhà hàng đã duyệt.</p>
                        ) : (
                            <div className="admin-top-list">
                                {data.topRestaurants.map((restaurant, index) => (
                                    <div
                                        className="admin-top-item"
                                        key={restaurant.maNhaHang}
                                    >
                                        <span className="admin-top-rank">
                                            #{index + 1}
                                        </span>
                                        <div>
                                            <strong>{restaurant.tenNhaHang}</strong>
                                            <small>
                                                {restaurant.diaChiQuan || "Chưa có địa chỉ"}
                                            </small>
                                        </div>
                                        <b>
                                            ⭐{" "}
                                            {restaurant.danhGiaTrungBinh != null &&
                                                restaurant.danhGiaTrungBinh > 0
                                                ? restaurant.danhGiaTrungBinh.toFixed(1)
                                                : "Chưa có"}
                                        </b>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                </>
            )}
        </main>
    );
}

export default AdminHome;