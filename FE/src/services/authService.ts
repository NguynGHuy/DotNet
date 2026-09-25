import { apiFetch } from "./api";

export interface LoginRequest {
    email: string;
    matKhau: string;
}

export interface RegisterRequest {
    email: string;
    matKhau: string;
    soDienThoai: string;
    hoTen: string;
    ngaySinh: string;
    gioiTinh: string;
}

export async function login(data: LoginRequest) {
    return apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function register(data: RegisterRequest) {
    return apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}