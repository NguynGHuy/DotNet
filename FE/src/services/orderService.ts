import { apiFetch } from "./api";

export interface DatHangRequest {
    maDiaChi: number;
    maKhuyenMai?: number | null;
    ghiChu?: string;
}

export async function checkPreCheckout(maKhuyenMai: number | null = null) {
    const token = localStorage.getItem("token");
    return apiFetch("/don-hang/kiem-tra-truoc-checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ maKhuyenMai }),
    });
}

export async function placeOrder(data: DatHangRequest) {
    const token = localStorage.getItem("token");
    return apiFetch("/don-hang/dat-hang", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function getMyOrders() {
    const token = localStorage.getItem("token");
    return apiFetch("/don-hang/cua-toi", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function cancelOrder(id: number, lyDoHuy: string) {
    const token = localStorage.getItem("token");
    return apiFetch(`/don-hang/${id}/huy`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lyDoHuy }),
    });
}
export async function getOrderById(id: number) {
    const token = localStorage.getItem("token");
    return apiFetch(`/don-hang/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getOrderStatusHistory(id: number) {
    const token = localStorage.getItem("token");
    return apiFetch(`/don-hang/${id}/lich-su-trang-thai`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getRestaurantOrders(maTrangThai?: number) {
    const token = localStorage.getItem("token");
    const query = maTrangThai ? `?maTrangThai=${maTrangThai}` : "";
    return apiFetch(`/nha-hang/don-hang${query}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getOrderStatuses() {
    const token = localStorage.getItem("token");
    return apiFetch("/trang-thai-don-hang", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function updateOrderStatus(id: number, maTrangThai: number, ghiChu?: string) {
    const token = localStorage.getItem("token");
    return apiFetch(`/don-hang/${id}/trang-thai`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ maTrangThai, ghiChu }),
    });
}