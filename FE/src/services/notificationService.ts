import { apiFetch, buildQuery, type PagedResult, type PaginationParams } from "./api";

export interface Notification {
    maThongBao: number;
    maTaiKhoan: number;
    tieuDe: string;
    noiDung: string;
    loai: string | null;
    duongDan: string | null;
    daDoc: boolean;
    ngayTao: string;
}

function authHeaders() {
    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`,
    };
}

export interface NotificationResult extends PagedResult<Notification> {
    counts: { all: number; unread: number; read: number };
}

export function getNotifications(
    params: PaginationParams & { filter?: "unread" | "read" } = {}
): Promise<NotificationResult> {
    return apiFetch(`/thong-bao${buildQuery(params)}`, {
        headers: authHeaders(),
    });
}

export function markNotificationAsRead(id: number) {
    return apiFetch(`/thong-bao/${id}/da-doc`, {
        method: "PUT",
        headers: authHeaders(),
    });
}

export function markAllNotificationsAsRead() {
    return apiFetch("/thong-bao/danh-dau-tat-ca", {
        method: "PUT",
        headers: authHeaders(),
    });
}
