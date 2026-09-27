import { useEffect, useState } from "react";
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../services/notificationService";
import type { Notification } from "../services/notificationService";

function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getNotifications()
            .then(setNotifications)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const markAsRead = async (id: number) => {
        try {
            setError("");
            await markNotificationAsRead(id);
            setNotifications((current) =>
                current.map((item) =>
                    item.maThongBao === id
                        ? { ...item, daDoc: true }
                        : item
                )
            );
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const markAllAsRead = async () => {
        try {
            setBusy(true);
            setError("");
            await markAllNotificationsAsRead();
            setNotifications((current) =>
                current.map((item) => ({ ...item, daDoc: true }))
            );
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const unreadCount = notifications.filter((item) => !item.daDoc).length;

    return (
        <main className="profile-page">
            <div className="profile-page-header">
                <h1>Thông báo</h1>
                <p>{unreadCount} thông báo chưa đọc</p>
            </div>

            {error && <p className="auth-error">{error}</p>}

            {loading ? (
                <p>Đang tải thông báo...</p>
            ) : (
                <>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            disabled={busy}
                            style={{ marginBottom: 20 }}
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}

                    {notifications.length === 0 ? (
                        <div className="empty-result">
                            <div>🔔</div>
                            <h3>Chưa có thông báo</h3>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 14 }}>
                            {notifications.map((item) => (
                                <article
                                    key={item.maThongBao}
                                    style={{
                                        background: "#fff",
                                        border: "1px solid #eee",
                                        borderLeft: item.daDoc
                                            ? "1px solid #eee"
                                            : "4px solid #ff5a1f",
                                        borderRadius: 12,
                                        padding: 20,
                                    }}
                                >
                                    <strong>{item.tieuDe}</strong>
                                    <p>{item.noiDung}</p>
                                    <small>
                                        {new Date(item.ngayTao).toLocaleString(
                                            "vi-VN"
                                        )}
                                    </small>

                                    {!item.daDoc && (
                                        <div style={{ marginTop: 14 }}>
                                            <button
                                                onClick={() =>
                                                    markAsRead(
                                                        item.maThongBao
                                                    )
                                                }
                                            >
                                                Đánh dấu đã đọc
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default Notifications;