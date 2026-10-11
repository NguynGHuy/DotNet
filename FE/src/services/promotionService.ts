import { apiFetch, buildQuery, type PagedResult, type PaginationParams } from "./api";

export interface Promotion {
    maKhuyenMai: number;
    maCode: string;
    moTa: string | null;
    loaiGiam: "PhanTram" | "SoTien";
    giaTriGiam: number;
    giamToiDa: number | null;
    donHangToiThieu: number;
    soLuong: number;
    soLuongDaDung: number;
    ngayBatDau: string;
    ngayKetThuc: string;
    trangThai: boolean;
}

export interface CreatePromotionRequest {
    maCode: string;
    moTa: string | null;
    loaiGiam: "PhanTram" | "SoTien";
    giaTriGiam: number;
    giamToiDa: number | null;
    donHangToiThieu: number;
    soLuong: number;
    ngayBatDau: string;
    ngayKetThuc: string;
}

export interface UpdatePromotionRequest {
    moTa: string | null;
    soLuong: number;
    ngayBatDau: string;
    ngayKetThuc: string;
}

function authHeaders() {
    return {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
}

export interface PromotionQuery extends PaginationParams {
    search?: string;
    state?: "active" | "upcoming" | "ended" | "inactive" | "expired";
}

export interface PromotionListResult extends PagedResult<Promotion> {
    counts: {
        all: number;
        active: number;
        upcoming: number;
        ended: number;
        inactive: number;
        expired: number;
    };
}

export function getMyPromotions(params: PromotionQuery = {}): Promise<PromotionListResult> {
    return apiFetch(`/khuyen-mai/cua-toi${buildQuery(params)}`, {
        headers: authHeaders(),
    });
}

export function createPromotion(data: CreatePromotionRequest) {
    return apiFetch("/khuyen-mai", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function updatePromotion(
    id: number,
    data: UpdatePromotionRequest
) {
    return apiFetch(`/khuyen-mai/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function togglePromotionStatus(id: number) {
    return apiFetch(`/khuyen-mai/${id}/trang-thai`, {
        method: "PUT",
        headers: authHeaders(),
    });
}

export function checkPromotion(
    maCode: string,
    maNhaHang: number,
    tongTienHang: number
): Promise<{
    maKhuyenMai: number;
    soTienGiam: number;
    message: string;
}> {
    return apiFetch("/khuyen-mai/kiem-tra", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ maCode, maNhaHang, tongTienHang }),
    });
}

export function createSystemPromotion(data: CreatePromotionRequest) {
    return apiFetch("/admin/khuyen-mai", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function getSystemPromotions(params: PromotionQuery = {}): Promise<PromotionListResult> {
    return apiFetch(`/admin/khuyen-mai${buildQuery(params)}`, {
        headers: authHeaders(),
    });
}
