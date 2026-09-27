import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/userService";

function AdminLayout() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [access, setAccess] = useState<"loading" | "allowed" | "denied">(
        "loading"
    );

    useEffect(() => {
        getCurrentUser()
            .then((user: { email: string; role: string }) => {
                if (user.role === "Admin") {
                    setEmail(user.email);
                    setAccess("allowed");
                } else {
                    setAccess("denied");
                }
            })
            .catch(() => setAccess("denied"));
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/dang-nhap");
    };

    if (access === "loading") {
        return <p className="admin-access-message">Đang kiểm tra tài khoản...</p>;
    }

    if (access === "denied") {
        return (
            <div className="admin-access-message">
                <h2>Bạn không có quyền truy cập khu quản trị</h2>
                <Link to="/">Về trang chủ</Link>
            </div>
        );
    }

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <Link to="/admin" className="admin-brand">
                    🍜 <span>Đặt Món Ăn</span>
                    <small>QUẢN TRỊ</small>
                </Link>

                <nav className="admin-nav" aria-label="Điều hướng quản trị">
                    <NavLink to="/admin" end>
                        <span>▦</span> Tổng quan
                    </NavLink>
                    <NavLink to="/admin/tai-khoan">
                        <span>👥</span> Tài khoản
                    </NavLink>
                    <NavLink to="/admin/nha-hang">
                        <span>🏪</span> Duyệt nhà hàng
                    </NavLink>
                    <NavLink to="/admin/khuyen-mai">
                        <span>🎟️</span> Khuyến mãi hệ thống
                    </NavLink>
                    <NavLink to="/admin/thong-bao">
                        <span>🔔</span> Thông báo
                    </NavLink>




                </nav>

                <div className="admin-sidebar-bottom">
                    <span>Đang đăng nhập</span>
                    <strong title={email}>{email}</strong>
                    <button type="button" onClick={logout}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <div className="admin-workspace">
                <header className="admin-topbar">
                    <div>
                        <strong>Khu quản trị</strong>
                        <span>Quản lý hệ thống đặt món ăn</span>
                    </div>
                    <Link to="/" className="admin-view-site">
                        Xem trang khách hàng ↗
                    </Link>
                </header>

                <div className="admin-main">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;