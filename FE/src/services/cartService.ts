import { apiFetch } from "./api";

export interface ThemMonRequest {
    maMonAn: number;
    soLuong: number;
    ghiChu?: string;
    danhSachMaTopping?: number[];
}

export interface CapNhatTuyChonRequest {
    ghiChu?: string;
    danhSachMaTopping?: number[];
}

export interface CartTopping {
    maTopping: number;
    tenTopping: string;
    giaThem: number;
    soLuong: number;
}

export interface CartItem {
    maChiTietGioHang: number;
    maMonAn: number;
    tenMonAn: string;
    hinhAnh?: string | null;
    donGia: number;
    soLuong: number;
    ghiChu?: string | null;
    toppings: CartTopping[];
    thanhTien: number;
}

export interface RestaurantCart {
    maGioHang: number | null;
    maNhaHang: number;
    tenNhaHang: string;
    anhBia?: string | null;
    ngayCapNhat?: string | null;
    soLuongMon: number;
    tongTienTamTinh: number;
    chiTiet: CartItem[];
}

function authHeaders() {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
}

export async function getRestaurantCart(maNhaHang: number): Promise<RestaurantCart> {
    return apiFetch(`/gio-hang/nha-hang/${maNhaHang}`, {
        method: "GET",
        headers: authHeaders(),
    });
}

export async function getLatestCart(): Promise<RestaurantCart | null> {
    return apiFetch("/gio-hang/gan-nhat", {
        method: "GET",
        headers: authHeaders(),
    });
}

export async function getCart(maGioHang: number): Promise<RestaurantCart> {
    return apiFetch(`/gio-hang/${maGioHang}`, {
        method: "GET",
        headers: authHeaders(),
    });
}

export async function addToCart(data: ThemMonRequest) {
    return apiFetch("/gio-hang/them-mon", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateCartItemQty(id: number, soLuong: number) {
    return apiFetch(`/gio-hang/chi-tiet/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ soLuong }),
    });
}

export async function updateCartItemOptions(
    id: number,
    data: CapNhatTuyChonRequest
) {
    return apiFetch(`/gio-hang/chi-tiet/${id}/tuy-chon`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export async function removeCartItem(id: number) {
    return apiFetch(`/gio-hang/chi-tiet/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
}

export async function clearCart(maGioHang: number) {
    return apiFetch(`/gio-hang/${maGioHang}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
}
