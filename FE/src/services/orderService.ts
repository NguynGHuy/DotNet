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