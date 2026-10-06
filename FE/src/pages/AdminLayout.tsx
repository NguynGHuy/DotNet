import { useEffect, useState } from "react";
import {
    Bell,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Menu,
    ShieldCheck,
    Store,
    TicketPercent,
    UsersRound,
    UtensilsCrossed,
    X,
} from "lucide-react";
import {
    Link,
    NavLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { getCurrentUser } from "../services/userService";

interface AdminUser {
    email: string;
    role: string;
}

const NAV_ITEMS = [
    {
        to: "/admin",
        label: "Tổng quan",
        description: "Thống kê hệ thống",
        icon: LayoutDashboard,
        end: true,
    },
    {
        to: "/admin/tai-khoan",
        label: "Tài khoản",
        description: "Người dùng và phân quyền",
        icon: UsersRound,
    },
    {
        to: "/admin/nha-hang",
        label: "Duyệt nhà hàng",
        description: "Hồ sơ và hợp đồng",
        icon: Store,
    },
    {
        to: "/admin/khuyen-mai",
        label: "Khuyến mãi hệ thống",
        description: "Ưu đãi toàn nền tảng",
        icon: TicketPercent,
    },
    {
        to: "/admin/thong-bao",
        label: "Thông báo",
        description: "Thông tin quản trị",
        icon: Bell,
    },
];

function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [access, setAccess] = useState<
        "loading" | "allowed" | "denied"
    >("loading");

    useEffect(() => {
        let cancelled = false;

        getCurrentUser()
            .then((user: AdminUser) => {
                if (cancelled) return;

                if (user.role === "Admin") {
                    setEmail(user.email);
                    setAccess("allowed");
                } else {
                    setAccess("denied");
                }
            })
            .catch(() => {
                if (!cancelled) setAccess("denied");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const logout = () => {
        localStorage.removeItem("token");
        setEmail("");
        navigate("/dang-nhap");
    };

    if (access === "loading") {
        return (
            <div className="admin-pro-access">
                <span className="admin-pro-access-icon">
                    <ShieldCheck size={25} />
                </span>
                <h2>Đang kiểm tra quyền truy cập</h2>
                <p>Vui lòng chờ trong giây lát...</p>
            </div>
        );
    }

    if (access === "denied") {
        return (
            <div className="admin-pro-access denied">
                <span className="admin-pro-access-icon">
                    <ShieldCheck size={25} />
                </span>
                <h2>Bạn không có quyền truy cập</h2>
                <p>
                    Khu vực này chỉ dành cho quản trị viên hệ thống.
                </p>
                <Link to="/">Về trang chủ</Link>
            </div>
        );
    }

    const currentPage =
        [...NAV_ITEMS]
            .reverse()
            .find((item) =>
                item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to)
            ) ?? NAV_ITEMS[0];

    const avatarText = email.charAt(0).toUpperCase() || "A";

    return (
        <div className="admin-pro-layout">
            {mobileOpen && (
                <button
                    type="button"
                    className="admin-pro-overlay"
                    aria-label="Đóng menu"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`admin-pro-sidebar ${
                    mobileOpen ? "is-open" : ""
                }`}
            >
                <div className="admin-pro-sidebar-header">
                    <Link to="/admin" className="admin-pro-brand">
                        <span className="admin-pro-brand-icon">
                            <UtensilsCrossed size={20} />
                        </span>

                        <div>
                            <strong>Foodie</strong>
                            <span>Quản trị hệ thống</span>
                        </div>
                    </Link>

                    <button
                        type="button"
                        className="admin-pro-sidebar-close"
                        aria-label="Đóng menu"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-pro-role">
                    <span>
                        <ShieldCheck size={18} />
                    </span>

                    <div>
                        <strong>System Admin</strong>
                        <small>Toàn quyền quản trị</small>
                    </div>
                </div>

                <nav
                    className="admin-pro-nav"
                    aria-label="Điều hướng quản trị"
                >
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    isActive ? "active" : ""
                                }
                            >
                                <span className="admin-pro-nav-icon">
                                    <Icon size={17} />
                                </span>

                                <span className="admin-pro-nav-text">
                                    <strong>{item.label}</strong>
                                    <small>{item.description}</small>
                                </span>

                                <ChevronRight
                                    className="admin-pro-nav-arrow"
                                    size={15}
                                />
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="admin-pro-sidebar-bottom">
                    <div className="admin-pro-sidebar-user">
                        <span>{avatarText}</span>

                        <div>
                            <strong>Quản trị viên</strong>
                            <small title={email}>{email}</small>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="admin-pro-logout"
                        onClick={logout}
                    >
                        <LogOut size={16} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <div className="admin-pro-workspace">
                <header className="admin-pro-topbar">
                    <div className="admin-pro-topbar-title">
                        <button
                            type="button"
                            className="admin-pro-menu-button"
                            aria-label="Mở menu"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={20} />
                        </button>

                        <div>
                            <span>KHU VỰC QUẢN TRỊ</span>
                            <h2>{currentPage.label}</h2>
                        </div>
                    </div>

                    <div className="admin-pro-topbar-user">
                        <span>{avatarText}</span>

                        <div>
                            <strong>Quản trị viên</strong>
                            <small>{email}</small>
                        </div>
                    </div>
                </header>

                <main className="admin-pro-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;