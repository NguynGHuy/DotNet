import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../services/userService";

interface User {
    email: string;
    role: string;
    maTaiKhoan: number;
    trangThai: boolean;
    khachHang?: {
        hoTen: string;
    };
}

function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            getCurrentUser()
                .then((data) => {
                    setUser(data);
                })
                .catch(() => {
                    localStorage.removeItem("token");
                    setUser(null);
                });
        }

        const handleLoginSuccess = (event: Event) => {
            const customEvent = event as CustomEvent<User>;

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

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setShowMenu(false);
    };

    const userName =
        user?.khachHang?.hoTen || user?.email || "Tài khoản";

    return (
        <header className= "header" >
        <div className="header-container" >

        {/* Logo */ }
            < Link to = "/" className = "logo" >
                <span className="logo-icon" >🍜</span>
                    < span > Đặt Món Ăn </span>
                        </Link>

    {/* Navigation */ }
    <nav className="main-nav" >
        <Link to="/" className = "nav-link" >
            Trang chủ
                </Link>

                < Link to = "/" className = "nav-link" >
                    Nhà hàng
                        </Link>
                        </nav>

    {/* Right side */ }
    <div className="header-right" >

    {/* Cart */ }
        < button className = "cart-button" >
            🛒
    </button>

    {
        user ? (
            <div className= "user-menu-wrapper" >

            <button
                className="user-menu-button"
        onClick = {() => setShowMenu(!showMenu)
    }
              >
        <span className="user-avatar" >
        { userName.charAt(0).toUpperCase() }
            </span>

            < span className = "user-name" >
            { userName }
                </span>

                < span className = "user-arrow" >
                { showMenu? "▲": "▼" }
                    </span>
                    </button>

    {
        showMenu && (
            <div className="user-dropdown" >

                <div className="dropdown-user-info" >
                    <div className="dropdown-avatar" >
                    { userName.charAt(0).toUpperCase() }
                        </div>

                        < div >
                        <strong>{ userName } </strong>
                        < span > { user.email } </span>
                        </div>
                        </div>

                        < div className = "dropdown-divider" />

                            <Link
                    to="/ho-so"
        className = "dropdown-item"
        onClick = {() => setShowMenu(false)
    }
                  >
        <span>👤</span>
                    Hồ sơ
        </Link>

        < Link
    to = "/dia-chi"
    className = "dropdown-item"
    onClick = {() => setShowMenu(false)
}
                  >
    <span>📍</span>
                    Địa chỉ giao hàng
    </Link>

    < div className = "dropdown-divider" />

        <button
                    className="dropdown-item logout-item"
onClick = { handleLogout }
    >
    <span>🚪</span>
                    Đăng xuất
    </button>

    </div>
              )}

</div>
          ) : (
    <div className= "auth-area" >
    <Link
                to="/dang-nhap"
className = "login-link"
    >
    Đăng nhập
        </Link>

        < Link
to = "/dang-ky"
className = "register-button"
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