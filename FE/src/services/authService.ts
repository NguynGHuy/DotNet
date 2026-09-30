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
export interface RegisterRestaurantRequest {
    email: string;
    matKhau: string;
    soDienThoai: string;

    tenNhaHang: string;
    moTa?: string | null;
    diaChiQuan: string;
    anhBia?: string | null;

    gioMoCua?: string | null;
    gioDongCua?: string | null;

    phiShipMacDinh: number;
}

export async function registerRestaurant(
    data: RegisterRestaurantRequest
) {
    return apiFetch("/auth/register-nha-hang", {
        method: "POST",
        body: JSON.stringify(data),
    });
}