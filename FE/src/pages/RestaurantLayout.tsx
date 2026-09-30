import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/userService";

interface User {
    email: string;
    role: string;
    maTaiKhoan: number;
    trangThai: boolean;
    nhaHang?: {
        maNhaHang: number;
        tenNhaHang: string;
    };
}

function QuanLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/dang-nhap");
            return;
        }

        getCurrentUser()
            .then((data) => {
                if (data.role !== "Quan") {
                    navigate("/");
                    return;
                }

                setUser(data);
            })
            .catch(() => {
                localStorage.removeItem("token");
                navigate("/dang-nhap");
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/dang-nhap");
    };

    if (!user) {
        return (
            <div className="quan-loading">
                Đang tải...
            </div>
        );
    }

    const restaurantName =
        user.nhaHang?.tenNhaHang || "Quản lý nhà hàng";

    return (
        <div className="quan-layout">

            {/* SIDEBAR */}
            <aside className="quan-sidebar">

                <div className="quan-logo">
                    <span>🍜</span>
                    <div>
                        <strong>Đặt Món Ăn</strong>
                        <small>Quản lý nhà hàng</small>
                    </div>
                </div>

                <div className="quan-restaurant">
                    <div className="quan-restaurant-icon">
                        🏪
                    </div>

                    <div>
                        <strong>{restaurantName}</strong>
                        <span>Chủ nhà hàng</span>
                    </div>
                </div>

                <nav className="quan-nav">

                    <NavLink
                        to="/quan"
                        end
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span>🏠</span>
                        Tổng quan
                    </NavLink>

                    <NavLink
                        to="/quan/thong-tin"
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span>🏪</span>
                        Thông tin quán
                    </NavLink>

                    <NavLink
                        to="/quan/trang-thai"
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span>🟢</span>
                        Trạng thái quán
                    </NavLink>

                    <NavLink
                        to="/quan/danh-muc"
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span>📂</span>
                        Danh mục
                    </NavLink>

                    <NavLink
                        to="/quan/menu"
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span>🍜</span>
                        Menu món ăn
                    </NavLink>

                    <NavLink
                        to="/quan/topping"
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span> O </span>
                        Topping
                    </NavLink>

                    <NavLink
                        to="/quan/khuyen-mai"
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span>🎟️</span>
                        Khuyến mãi
                    </NavLink>

                    <NavLink
                        to="/quan/thong-bao"
                        className={({ isActive }) =>
                            `quan-nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span>🔔</span>
                        Thông báo
                    </NavLink>

                </nav>

                <div className="quan-sidebar-bottom">

                    <button
                        className="quan-logout"
                        onClick={handleLogout}
                    >
                        <span>🚪</span>
                        Đăng xuất
                    </button>

                </div>

            </aside>

            {/* MAIN */}
            <main className="quan-main">

                <header className="quan-topbar">

                    <div>
                        <h2>{restaurantName}</h2>
                        <p>Khu vực quản lý nhà hàng</p>
                    </div>

                    <div className="quan-user">

                        <div className="quan-user-avatar">
                            {restaurantName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>{restaurantName}</strong>
                            <span>{user.email}</span>
                        </div>

                    </div>

                </header>

                <section className="quan-content">
                    <Outlet />
                </section>

            </main>

        </div>
    );
}

export default QuanLayout;