import { apiFetch } from "./api";

export interface LoginRequest {
    email: string;
    matKhau: string;
}

export interface ChangePasswordRequest {
    matKhauCu: string;
    matKhauMoi: string;
}

export interface ForgotPasswordResponse {
    message: string;
    maYeuCau: string;
    hetHanSauPhut: number;
    maXacNhanThuNghiem?: string | null;
}

export interface ResetPasswordRequest {
    maYeuCau: string;
    maXacNhan: string;
    matKhauMoi: string;
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

export async function changePassword(data: ChangePasswordRequest) {
    const token = localStorage.getItem("token");

    return apiFetch("/auth/doi-mat-khau", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function requestPasswordReset(email: string) {
    return apiFetch("/auth/quen-mat-khau", {
        method: "POST",
        body: JSON.stringify({ email }),
    }) as Promise<ForgotPasswordResponse>;
}

export async function resetPassword(data: ResetPasswordRequest) {
    return apiFetch("/auth/dat-lai-mat-khau", {
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
