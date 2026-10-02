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

export interface DatHangTamRequest {
    maDiaChi: number;
    maPhuongThuc: number;
    maKhuyenMai?: number | null;
    ghiChu?: string | null;
}

export interface DatHangTamResult {
    message: string;
    maDonHang: number;
    maDonHangHienThi: string;
    maThanhToan: number;
    tenMonAn: string;
    thanhTien: number;
    tenPhuongThuc: string;
}

export async function placeTemporaryOrder(
    data: DatHangTamRequest
): Promise<DatHangTamResult> {
    const token = localStorage.getItem("token");
    return apiFetch("/don-hang/dat-hang-tam", {
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
export async function getOrderById(
    id: number
): Promise<OrderDetails> {
    const token = localStorage.getItem("token");
    return apiFetch(`/don-hang/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getOrderStatusHistory(
    id: number
): Promise<OrderStatusHistory[]> {
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

export interface OrderTopping {
    tenTopping: string;
    giaThem: number;
    soLuong: number;
}

export interface OrderItem {
    maMonAn: number;
    tenMonAn: string;
    soLuong: number;
    donGia: number;
    thanhTien: number;
    toppings: OrderTopping[];
}

export interface OrderDetails {
    maDonHang: number;
    maDonHangHienThi: string;
    maNhaHang: number;
    tenNhaHang: string;
    trangThai: string;
    thoiGianDat: string;
    tenNguoiNhan: string;
    soDienThoaiNhan: string;
    diaChiGiaoHang: string;
    ghiChu: string | null;
    tongTienHang: number;
    phiShip: number;
    soTienGiam: number;
    thanhTien: number;
    chiTiet: OrderItem[];
}

export interface OrderStatusHistory {
    maLichSu: number;
    tenTrangThai: string;
    thoiGianTao: string;
    ghiChu: string | null;
}