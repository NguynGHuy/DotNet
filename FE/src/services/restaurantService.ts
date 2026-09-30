import { apiFetch } from "./api";

export interface Restaurant {
    maNhaHang: number;
    maTaiKhoan?: number;

    tenNhaHang: string;
    moTa: string | null;
    diaChiQuan: string;
    anhBia: string | null;

    gioMoCua: string | null;
    gioDongCua: string | null;

    trangThaiDuyet?: string;
    trangThaiHoatDong: string;

    danhGiaTrungBinh: number;
    phiShipMacDinh: number;

    email?: string | null;
    soDienThoai?: string | null;
}

export interface UpdateRestaurantRequest {
    tenNhaHang: string;
    moTa: string | null;
    diaChiQuan: string;
    anhBia: string | null;
    gioMoCua: string | null;
    gioDongCua: string | null;
    phiShipMacDinh: number;
}

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`,
    };
}

/* =========================
   PUBLIC
========================= */

export async function getRestaurants(): Promise<Restaurant[]> {
    return apiFetch("/nha-hang", {
        method: "GET",
    });
}

export async function getRestaurantById(
    id: number
): Promise<Restaurant> {
    return apiFetch(`/nha-hang/${id}`, {
        method: "GET",
    });
}

/* =========================
   QUÁN
========================= */

export async function getRestaurantProfile(): Promise<Restaurant> {
    return apiFetch("/nha-hang/ho-so", {
        method: "GET",
        headers: getAuthHeaders(),
    });
}

export async function updateRestaurantProfile(
    data: UpdateRestaurantRequest
) {
    return apiFetch("/nha-hang/ho-so", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updateRestaurantStatus(
    trangThaiHoatDong: "MoCua" | "TamNgung"
) {
    return apiFetch(
        "/nha-hang/trang-thai-hoat-dong",
        {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                trangThaiHoatDong,
            }),
        }
    );
}