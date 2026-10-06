import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    Bell,
    ChevronDown,
    LayoutDashboard,
    LogOut,
    MapPin,
    ReceiptText,
    Store,
    Tag,
    UserRound,
    UsersRound,
    Utensils,
} from "lucide-react";

import { getCurrentUser } from "../services/userService";

interface User {
    email: string;
    role: string;
    maTaiKhoan: number;
    trangThai: boolean;

    khachHang?: {
        hoTen: string;
    };

    nhaHang?: {
        maNhaHang: number;
        tenNhaHang: string;
    };
}

function Header() {
    const navigate = useNavigate();

    const menuRef =
        useRef<HTMLDivElement | null>(null);

    const [user, setUser] =
        useState<User | null>(null);

    const [showMenu, setShowMenu] =
        useState(false);

    /* =====================================================
       LẤY NGƯỜI DÙNG
    ===================================================== */

    useEffect(() => {
        const token =
            localStorage.getItem("token");

        if (token) {
            getCurrentUser()
                .then((data) => {
                    setUser(data);
                })
                .catch(() => {
                    localStorage.removeItem(
                        "token"
                    );

                    setUser(null);
                });
        }

        const handleLoginSuccess = (
            event: Event
        ) => {
            const customEvent =
                event as CustomEvent<User>;

            setUser(customEvent.detail);
        };

        window.addEventListener(
            "login-success",
            handleLoginSuccess
        );

        return () => {
            window.removeEventListener(
                "login-success",
                handleLoginSuccess
            );
        };
    }, []);

    /* =====================================================
       ĐÓNG MENU KHI CLICK RA NGOÀI HOẶC BẤM ESC
    ===================================================== */

    useEffect(() => {
        if (!showMenu) return;

        const handleOutsideClick = (
            event: MouseEvent
        ) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setShowMenu(false);
            }
        };

        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                setShowMenu(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [showMenu]);

    /* =====================================================
       ĐĂNG XUẤT
    ===================================================== */

    const handleLogout = () => {
        localStorage.removeItem("token");

        setUser(null);
        setShowMenu(false);

        navigate("/");
    };

    const userName =
        user?.role === "Quan"
            ? user.nhaHang?.tenNhaHang ||
              user.email ||
              "Nhà hàng"
            : user?.khachHang?.hoTen ||
              user?.email ||
              "Tài khoản";

    const avatarLetter =
        userName.charAt(0).toUpperCase();

    const closeMenu = () => {
        setShowMenu(false);
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* LOGO */}

                <Link
                    to="/"
                    className="logo"
                    aria-label="Về trang chủ"
                >
                    <span className="logo-icon">
                        <Utensils
                            size={20}
                            strokeWidth={2.2}
                        />
                    </span>

                    <span className="logo-text">
                        Đặt Món Ăn
                    </span>
                </Link>

                {/* NAVIGATION */}

                <nav
                    className="main-nav"
                    aria-label="Điều hướng chính"
                >
                    <NavLink
                        to="/"
                        end
                        className={({
                            isActive,
                        }) =>
                            `nav-link ${
                                isActive
                                    ? "active"
                                    : ""
                            }`
                        }
                    >
                        Trang chủ
                    </NavLink>

                    <NavLink
                        to="/nha-hang"
                        className={({
                            isActive,
                        }) =>
                            `nav-link ${
                                isActive
                                    ? "active"
                                    : ""
                            }`
                        }
                    >
                        Nhà hàng
                    </NavLink>
                </nav>

                {/* RIGHT */}

                <div className="header-right">
                    {user ? (
                        <div
                            className="user-menu-wrapper"
                            ref={menuRef}
                        >
                            <button
                                type="button"
                                className={`user-menu-button ${
                                    showMenu
                                        ? "open"
                                        : ""
                                }`}
                                onClick={() =>
                                    setShowMenu(
                                        (current) =>
                                            !current
                                    )
                                }
                                aria-expanded={
                                    showMenu
                                }
                                aria-haspopup="menu"
                            >
                                <span className="user-avatar">
                                    {avatarLetter}
                                </span>

                                <span className="user-name">
                                    {userName}
                                </span>

                                <ChevronDown
                                    size={16}
                                    strokeWidth={2}
                                    className={`user-chevron ${
                                        showMenu
                                            ? "open"
                                            : ""
                                    }`}
                                />
                            </button>

                            {showMenu && (
                                <div
                                    className="user-dropdown"
                                    role="menu"
                                >
                                    <div className="dropdown-user-info">
                                        <div className="dropdown-avatar">
                                            {
                                                avatarLetter
                                            }
                                        </div>

                                        <div>
                                            <strong>
                                                {userName}
                                            </strong>

                                            <span>
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="dropdown-divider" />

                                    {/* KHÁCH HÀNG */}

                                    {user.role ===
                                        "KhachHang" && (
                                        <>
                                            <Link
                                                to="/ho-so"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <UserRound
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Hồ sơ
                                                </span>
                                            </Link>

                                            <Link
                                                to="/dia-chi"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <MapPin
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Địa chỉ
                                                    giao
                                                    hàng
                                                </span>
                                            </Link>

                                            <Link
                                                to="/don-hang"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <ReceiptText
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Đơn hàng
                                                    của tôi
                                                </span>
                                            </Link>

                                            <Link
                                                to="/thong-bao"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <Bell
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Thông báo
                                                </span>
                                            </Link>
                                        </>
                                    )}

                                    {/* QUÁN */}

                                    {user.role ===
                                        "Quan" && (
                                        <>
                                            <Link
                                                to="/quan"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <Store
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Quản lý
                                                    nhà hàng
                                                </span>
                                            </Link>

                                            <Link
                                                to="/quan/khuyen-mai"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <Tag
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Khuyến mãi
                                                    của quán
                                                </span>
                                            </Link>

                                            <Link
                                                to="/quan/thong-bao"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <Bell
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Thông báo
                                                </span>
                                            </Link>
                                        </>
                                    )}

                                    {/* ADMIN */}

                                    {user.role ===
                                        "Admin" && (
                                        <>
                                            <Link
                                                to="/admin/tai-khoan"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <UsersRound
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Quản lý
                                                    tài khoản
                                                </span>
                                            </Link>

                                            <Link
                                                to="/admin"
                                                className="dropdown-item"
                                                onClick={
                                                    closeMenu
                                                }
                                            >
                                                <LayoutDashboard
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                                    Trang quản
                                                    trị
                                                </span>
                                            </Link>
                                        </>
                                    )}

                                    <div className="dropdown-divider" />

                                    <button
                                        type="button"
                                        className="dropdown-item logout-item"
                                        onClick={
                                            handleLogout
                                        }
                                    >
                                        <LogOut
                                            size={18}
                                        />

                                        <span>
                                            Đăng xuất
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-area">
                            <Link
                                to="/dang-nhap"
                                className="login-link"
                            >
                                Đăng nhập
                            </Link>

                            <Link
                                to="/dang-ky"
                                className="register-button"
                            >
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;