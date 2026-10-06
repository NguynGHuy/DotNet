import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell, ChevronRight, ClipboardList, CupSoda, Folders, LayoutDashboard,
  LogOut, Menu, Power, ShieldCheck, Store, TicketPercent, UtensilsCrossed, X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser } from "../services/userService";

interface User {
  email: string;
  role: string;
  maTaiKhoan: number;
  trangThai: boolean;
  nhaHang?: { maNhaHang: number; tenNhaHang: string };
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Vận hành",
    items: [
      { to: "/quan", label: "Tổng quan", icon: LayoutDashboard, end: true },
      { to: "/quan/don-hang", label: "Đơn hàng", icon: ClipboardList },
      { to: "/quan/trang-thai", label: "Trạng thái quán", icon: Power },
      { to: "/quan/thong-tin", label: "Thông tin quán", icon: Store },
    ],
  },
  {
    label: "Sản phẩm",
    items: [
      { to: "/quan/danh-muc", label: "Danh mục", icon: Folders },
      { to: "/quan/menu", label: "Thực đơn", icon: UtensilsCrossed },
      { to: "/quan/topping", label: "Topping", icon: CupSoda },
      { to: "/quan/khuyen-mai", label: "Khuyến mãi", icon: TicketPercent },
    ],
  },
  {
    label: "Khác",
    items: [{ to: "/quan/thong-bao", label: "Thông báo", icon: Bell }],
  },
];

function QuanLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/dang-nhap");
      return;
    }

    getCurrentUser()
      .then(data => {
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
      <div className="quan-layout-loading">
        <div className="loading-spinner" />
        <p>Đang mở khu vực quản lý...</p>
      </div>
    );
  }

  const restaurantName = user.nhaHang?.tenNhaHang || "Quản lý nhà hàng";
  const avatarLetter = restaurantName.charAt(0).toUpperCase();

  return (
    <div className="quan-layout">
      <button
        type="button"
        className={`quan-sidebar-overlay ${sidebarOpen ? "is-visible" : ""}`}
        aria-label="Đóng menu"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`quan-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="quan-sidebar-brand">
          <span className="quan-brand-icon"><UtensilsCrossed size={21} /></span>
          <div><strong>Foodie</strong><small>Restaurant Center</small></div>
          <button type="button" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="quan-restaurant-card">
          <span className="quan-restaurant-avatar">{avatarLetter}</span>
          <div><strong>{restaurantName}</strong><span><ShieldCheck size={11} /> Chủ nhà hàng</span></div>
        </div>

        <nav className="quan-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="quan-nav-group">
              <p>{group.label}</p>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `quan-nav-item${isActive ? " active" : ""}`}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    <ChevronRight className="quan-nav-arrow" size={14} />
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="quan-sidebar-bottom">
          <div className="quan-sidebar-account">
            <span>{avatarLetter}</span>
            <div><strong>{restaurantName}</strong><small>{user.email}</small></div>
          </div>
          <button type="button" className="quan-logout" onClick={handleLogout}>
            <LogOut size={16} /><span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="quan-main">
        <header className="quan-topbar">
          <div className="quan-topbar-left">
            <button type="button" className="quan-mobile-menu" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div><span>Khu vực quản lý</span><h2>{restaurantName}</h2></div>
          </div>

          <div className="quan-topbar-user">
            <span className="quan-topbar-avatar">{avatarLetter}</span>
            <div><strong>{restaurantName}</strong><small>{user.email}</small></div>
          </div>
        </header>

        <section className="quan-content"><Outlet /></section>
      </div>
    </div>
  );
}

export default QuanLayout;