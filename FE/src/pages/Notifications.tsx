import { useEffect, useMemo, useState } from "react";
import {
    Bell,
    BellRing,
    Check,
    CheckCheck,
    Clock3,
    Inbox,
} from "lucide-react";
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    type Notification,
} from "../services/notificationService";

type NotificationFilter = "all" | "unread" | "read";

function formatNotificationDate(value: string) {
    const date = new Date(value);
    const today = new Date();

    const sameDay =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    if (sameDay) {
        return `Hôm nay, ${date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    }

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<NotificationFilter>("all");
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingId, setMarkingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getNotifications()
            .then((data) => {
                if (!cancelled) {
                    setNotifications(Array.isArray(data) ? data : []);
                    setError("");
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Không thể tải thông báo."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const markAsRead = async (id: number) => {
        try {
            setMarkingId(id);
            setError("");

            await markNotificationAsRead(id);

            setNotifications((current) =>
                current.map((item) =>
                    item.maThongBao === id
                        ? { ...item, daDoc: true }
                        : item
                )
            );

            window.dispatchEvent(
                new Event("notifications-updated")
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật thông báo."
            );
        } finally {
            setMarkingId(null);
        }
    };

    const markAllAsRead = async () => {
        try {
            setMarkingAll(true);
            setError("");

            await markAllNotificationsAsRead();

            setNotifications((current) =>
                current.map((item) => ({
                    ...item,
                    daDoc: true,
                }))
            );

            window.dispatchEvent(
                new Event("notifications-updated")
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật thông báo."
            );
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter(
        (item) => !item.daDoc
    ).length;

    const filteredNotifications = useMemo(() => {
        return [...notifications]
            .filter((item) => {
                if (filter === "unread") return !item.daDoc;
                if (filter === "read") return item.daDoc;
                return true;
            })
            .sort(
                (a, b) =>
                    new Date(b.ngayTao).getTime() -
                    new Date(a.ngayTao).getTime()
            );
    }, [notifications, filter]);

    const countFilter = (value: NotificationFilter) => {
        if (value === "unread") return unreadCount;
        if (value === "read") {
            return notifications.length - unreadCount;
        }

        return notifications.length;
    };

    return (
        <div className="merchant-notifications-page">
            <header className="merchant-notifications-header">
                <div>
                    <span className="merchant-notifications-eyebrow">
                        TRUNG TÂM THÔNG BÁO
                    </span>
                    <h1>Thông báo</h1>
                    <p>
                        {unreadCount > 0
                            ? `Bạn có ${unreadCount} thông báo chưa đọc.`
                            : "Bạn đã đọc tất cả thông báo."}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="merchant-notifications-read-all"
                        onClick={() => void markAllAsRead()}
                        disabled={markingAll || markingId !== null}
                    >
                        <CheckCheck size={16} />
                        {markingAll
                            ? "Đang cập nhật..."
                            : "Đọc tất cả"}
                    </button>
                )}
            </header>

            {error && (
                <div className="merchant-notifications-error">
                    {error}
                </div>
            )}

            <nav className="merchant-notifications-tabs">
                {(
                    [
                        ["all", "Tất cả"],
                        ["unread", "Chưa đọc"],
                        ["read", "Đã đọc"],
                    ] as [NotificationFilter, string][]
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        className={filter === value ? "active" : ""}
                        onClick={() => setFilter(value)}
                    >
                        {label}
                        <span>{countFilter(value)}</span>
                    </button>
                ))}
            </nav>

            {loading ? (
                <div className="merchant-notifications-loading">
                    Đang tải thông báo...
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="merchant-notifications-empty">
                    <span>
                        <Inbox size={28} />
                    </span>
                    <h3>
                        {notifications.length === 0
                            ? "Chưa có thông báo"
                            : filter === "unread"
                              ? "Không còn thông báo chưa đọc"
                              : "Không có thông báo đã đọc"}
                    </h3>
                    <p>
                        {notifications.length === 0
                            ? "Các cập nhật mới về đơn hàng và nhà hàng sẽ xuất hiện tại đây."
                            : "Hãy chọn một bộ lọc khác để xem thông báo."}
                    </p>
                </div>
            ) : (
                <section className="merchant-notifications-panel">
                    <div className="merchant-notifications-panel-title">
                        <div>
                            <Bell size={18} />
                            <h2>
                                {filter === "all"
                                    ? "Tất cả thông báo"
                                    : filter === "unread"
                                      ? "Thông báo chưa đọc"
                                      : "Thông báo đã đọc"}
                            </h2>
                        </div>

                        <span>
                            {filteredNotifications.length} thông báo
                        </span>
                    </div>

                    <div className="merchant-notifications-list">
                        {filteredNotifications.map((item) => (
                            <article
                                key={item.maThongBao}
                                className={`merchant-notification-row ${
                                    item.daDoc ? "read" : "unread"
                                }`}
                            >
                                <div className="merchant-notification-icon">
                                    {item.daDoc ? (
                                        <Bell size={18} />
                                    ) : (
                                        <BellRing size={18} />
                                    )}
                                </div>

                                <div className="merchant-notification-content">
                                    <div>
                                        <h3>{item.tieuDe}</h3>

                                        {!item.daDoc && (
                                            <span>Chưa đọc</span>
                                        )}
                                    </div>

                                    <p>{item.noiDung}</p>

                                    <time>
                                        <Clock3 size={13} />
                                        {formatNotificationDate(
                                            item.ngayTao
                                        )}
                                    </time>
                                </div>

                                <div className="merchant-notification-action">
                                    {item.daDoc ? (
                                        <span title="Đã đọc">
                                            <Check size={16} />
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void markAsRead(
                                                    item.maThongBao
                                                )
                                            }
                                            disabled={
                                                markingId !== null ||
                                                markingAll
                                            }
                                        >
                                            <Check size={14} />
                                            {markingId ===
                                            item.maThongBao
                                                ? "Đang cập nhật..."
                                                : "Đánh dấu đã đọc"}
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default Notifications;