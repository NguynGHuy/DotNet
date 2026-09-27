import { apiFetch } from "./api";

export interface ThemMonRequest {
    maMonAn: number;
    soLuong: number;
    ghiChu?: string;
    danhSachMaTopping?: number[];
}

export async function getCart() {
    const token = localStorage.getItem("token");
    return apiFetch("/gio-hang", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function addToCart(data: ThemMonRequest) {
    const token = localStorage.getItem("token");
    return apiFetch("/gio-hang/them-mon", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function updateCartItemQty(id: number, soLuong: number) {
    const token = localStorage.getItem("token");
    return apiFetch(`/gio-hang/chi-tiet/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ soLuong }),
    });
}

export async function removeCartItem(id: number) {
    const token = localStorage.getItem("token");
    return apiFetch(`/gio-hang/chi-tiet/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function clearCart() {
    const token = localStorage.getItem("token");
    return apiFetch("/gio-hang", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
}