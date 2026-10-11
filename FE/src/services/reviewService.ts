import { apiFetch, buildQuery, type PagedResult, type PaginationParams } from "./api";

export interface RestaurantReview {
    maDanhGia: number;
    maKhachHang: number;
    maDonHang: number;
    soSao: number;
    noiDung: string | null;
    ngayDanhGia: string;
}

export function getRestaurantReviews(
    maNhaHang: number,
    params: PaginationParams = {}
): Promise<PagedResult<RestaurantReview>> {
    return apiFetch(`/nha-hang/${maNhaHang}/danh-gia${buildQuery(params)}`);
}

export interface CreateFoodReviewRequest {
    maMonAn: number;
    maDonHang: number;
    soSao: number;
    noiDung: string | null;
    hinhAnh: string | null;
}

export interface CreateRestaurantReviewRequest {
    maNhaHang: number;
    maDonHang: number;
    soSao: number;
    noiDung: string | null;
}

function authHeaders() {
    return {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
}

export function createFoodReview(
    data: CreateFoodReviewRequest
): Promise<{ message: string }> {
    return apiFetch("/danh-gia-mon-an", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function createRestaurantReview(
    data: CreateRestaurantReviewRequest
): Promise<{ message: string }> {
    return apiFetch("/danh-gia-nha-hang", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export interface FoodReview {
    maDanhGia: number;
    maMonAn: number;
    soSao: number;
    noiDung: string | null;
    ngayDanhGia: string;
}

export function getFoodReviews(
    maMonAn: number,
    params: PaginationParams = {}
): Promise<PagedResult<FoodReview>> {
    return apiFetch(`/mon-an/${maMonAn}/danh-gia${buildQuery(params)}`);
}

export interface SavedReview {
    soSao: number;
    noiDung: string | null;
}

export interface OrderReviews {
    maDonHang: number;
    danhGiaQuan: (SavedReview & { maNhaHang: number }) | null;
    danhGiaMon: (SavedReview & { maMonAn: number })[];
}

export function getMyOrderReviews(
    maDonHang: number
): Promise<OrderReviews> {
    return apiFetch(`/don-hang/${maDonHang}/danh-gia-cua-toi`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
}
