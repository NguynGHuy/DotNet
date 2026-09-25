import { apiFetch } from "./api";

export interface CustomerProfile {
    maKhachHang: number;
    maTaiKhoan: number;
    hoTen: string;
    ngaySinh: string | null;
    gioiTinh: string | null;
    diemTichLuy: number;
    email: string | null;
    soDienThoai: string | null;
    anhDaiDien: string | null;
}

export interface UpdateProfileRequest {
    hoTen: string;
    ngaySinh: string | null;
    gioiTinh: string | null;
}

export async function getCustomerProfile() {
    const token = localStorage.getItem("token");

    return apiFetch("/khach-hang/ho-so", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function updateCustomerProfile(
    data: UpdateProfileRequest
) {
    const token = localStorage.getItem("token");

    return apiFetch("/khach-hang/ho-so", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}