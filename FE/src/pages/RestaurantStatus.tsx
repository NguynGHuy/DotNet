import { useCallback, useEffect, useState } from "react";
import {
  AlarmClock, Check, CheckCircle2, CirclePause, Clock3,
  Power, RefreshCw, ShieldCheck, Store, Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getRestaurantProfile,
  updateRestaurantStatus
} from "../services/restaurantService";
import type {
  Restaurant,
  RestaurantOperatingMode
} from "../services/restaurantService";

interface ModeOption {
  value: RestaurantOperatingMode;
  title: string;
  description: string;
  icon: LucideIcon;
  className: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: "TuDong",
    title: "Tự động theo giờ",
    description: "Hệ thống tự mở và đóng quán theo giờ hoạt động.",
    icon: AlarmClock,
    className: "automatic",
  },
  {
    value: "MoThuCong",
    title: "Mở thủ công",
    description: "Tiếp tục nhận đơn kể cả khi đang ngoài giờ hoạt động.",
    icon: Zap,
    className: "manual-open",
  },
  {
    value: "TamNgung",
    title: "Tạm ngưng",
    description: "Ngừng nhận đơn cho đến khi bạn chọn chế độ khác.",
    icon: CirclePause,
    className: "paused",
  },
];

const MODE_LABEL: Record<string, string> = {
  TuDong: "Tự động theo giờ",
  MoThuCong: "Mở thủ công",
  TamNgung: "Tạm ngưng",
};
const APPROVAL_LABEL: Record<string, string> = {
  ChoDuyet: "Chờ xét duyệt",
  DaDuyet: "Đã được duyệt",
  TuChoi: "Đã bị từ chối",
};

const formatTime = (value?: string | null) =>
  value ? value.slice(0, 5) : "--:--";

function QuanRestaurantStatus() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRestaurant = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      setRestaurant(await getRestaurantProfile());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lấy thông tin nhà hàng."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRestaurant(true);

    const timer = window.setInterval(() => {
      void loadRestaurant(false);
    }, 30000);

    const handleFocus = () => {
      void loadRestaurant(false);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadRestaurant]);

  const handleChangeMode = async (mode: RestaurantOperatingMode) => {
    if (updating || mode === restaurant?.cheDoHoatDong) return;

    try {
      setUpdating(true);
      setMessage("");
      setError("");

      await updateRestaurantStatus(mode);
      setRestaurant(await getRestaurantProfile());

      const messages: Record<RestaurantOperatingMode, string> = {
        TuDong: "Đã chuyển sang tự động theo giờ hoạt động.",
        MoThuCong: "Nhà hàng đã được mở thủ công.",
        TamNgung: "Nhà hàng đã tạm ngưng nhận đơn.",
      };

      setMessage(messages[mode]);
      window.setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật chế độ hoạt động."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="merchant-status-page">
        <div className="merchant-status-loading">
          <div className="loading-spinner" />
          <p>Đang tải trạng thái nhà hàng...</p>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="merchant-status-page">
        <div className="merchant-status-error">
          <Power size={26} />
          <h2>Không tìm thấy nhà hàng</h2>
          <p>{error || "Không thể lấy thông tin nhà hàng."}</p>
          <button type="button" onClick={() => void loadRestaurant(true)}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      </main>
    );
  }

  const isOpen = Boolean(restaurant.dangMoCua);
  const currentMode = restaurant.cheDoHoatDong;
  const approvalCode = restaurant.trangThaiDuyet || "";
  const approvalText = APPROVAL_LABEL[approvalCode] || approvalCode || "Chưa xác định";
  const isApproved = approvalCode === "DaDuyet";

  return (
    <main className="merchant-status-page">
      <header className="merchant-status-header">
        <div className="merchant-status-heading">
          <span><Power size={21} /></span>
          <div>
            <small>VẬN HÀNH NHÀ HÀNG</small>
            <h1>Trạng thái quán</h1>
            <p>Quản lý cách nhà hàng hiển thị và tiếp nhận đơn từ khách.</p>
          </div>
        </div>

        <button
          type="button"
          className="merchant-status-refresh"
          disabled={updating}
          onClick={() => void loadRestaurant(false)}
        >
          <RefreshCw size={14} className={updating ? "is-spinning" : ""} />
          Làm mới
        </button>
      </header>

      {message && (
        <div className="merchant-status-notice success" role="status">
          <CheckCircle2 size={17} /><span>{message}</span>
        </div>
      )}

      {error && (
        <div className="merchant-status-notice error" role="alert">
          <CirclePause size={17} /><span>{error}</span>
        </div>
      )}

      <section className={`merchant-current-status ${isOpen ? "is-open" : "is-closed"}`}>
        <span className="merchant-current-status-icon">
          {isOpen ? <Check size={24} /> : <Power size={24} />}
        </span>

        <div className="merchant-current-status-content">
          <small>TRẠNG THÁI THỰC TẾ</small>
          <h2>{isOpen ? "Nhà hàng đang nhận đơn" : "Nhà hàng đang đóng cửa"}</h2>
          <p>
            {restaurant.trangThaiHienThi ||
              (isOpen
                ? "Khách hàng có thể xem quán và đặt món."
                : "Khách hàng hiện không thể đặt món tại quán.")}
          </p>
        </div>

        <div className="merchant-current-mode">
          <small>Chế độ điều khiển</small>
          <strong>{MODE_LABEL[currentMode] || currentMode}</strong>
        </div>
      </section>

      <div className="merchant-status-layout">
        <section className="merchant-status-card merchant-mode-section">
          <header>
            <div>
              <h2>Chế độ hoạt động</h2>
              <p>Chọn cách hệ thống điều khiển trạng thái đóng hoặc mở quán.</p>
            </div>
          </header>

          <div className="merchant-mode-list">
            {MODE_OPTIONS.map(option => {
              const Icon = option.icon;
              const selected = currentMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`merchant-mode-option mode-${option.className}${selected ? " selected" : ""}`}
                  disabled={updating || selected}
                  onClick={() => void handleChangeMode(option.value)}
                >
                  <span className="merchant-mode-icon"><Icon size={20} /></span>

                  <div>
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </div>

                  {selected ? (
                    <span className="merchant-mode-selected">
                      <Check size={12} /> Đang dùng
                    </span>
                  ) : (
                    <span className="merchant-mode-radio" />
                  )}
                </button>
              );
            })}
          </div>

          {updating && (
            <div className="merchant-mode-updating">
              <RefreshCw size={14} className="is-spinning" />
              Đang cập nhật trạng thái...
            </div>
          )}
        </section>

        <aside className="merchant-status-side">
          <section className="merchant-status-card merchant-hours-card">
            <span className="merchant-side-icon"><Clock3 size={20} /></span>
            <div>
              <small>GIỜ HOẠT ĐỘNG</small>
              <h2>
                {formatTime(restaurant.gioMoCua)}
                <span>–</span>
                {formatTime(restaurant.gioDongCua)}
              </h2>
              <p>Khung giờ này được sử dụng khi quán ở chế độ tự động.</p>
            </div>
          </section>

          <section className="merchant-status-card merchant-approval-card">
            <span className={`merchant-side-icon ${isApproved ? "approved" : ""}`}>
              <ShieldCheck size={20} />
            </span>
            <div>
              <small>TRẠNG THÁI XÉT DUYỆT</small>
              <h2>{approvalText}</h2>
              <p>Nhà hàng phải được quản trị viên duyệt mới có thể nhận đơn.</p>
            </div>
          </section>

          <section className="merchant-status-card merchant-status-guide">
            <div className="merchant-guide-title">
              <Store size={17} />
              <h2>Phân biệt hai trạng thái</h2>
            </div>

            <div>
              <strong>Trạng thái thực tế</strong>
              <p>Cho biết ngay lúc này khách có đặt món được hay không.</p>
            </div>

            <div>
              <strong>Chế độ hoạt động</strong>
              <p>Quy định trạng thái được điều khiển tự động hay thủ công.</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default QuanRestaurantStatus;