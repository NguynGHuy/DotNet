import { apiFetch } from "./api";

export interface RestaurantReview {
    maDanhGia: number;
    maKhachHang: number;
    maDonHang: number;
    soSao: number;
    noiDung: string | null;
    ngayDanhGia: string;
}

export function getRestaurantReviews(
    maNhaHang: number
): Promise<RestaurantReview[]> {
    return apiFetch(`/nha-hang/${maNhaHang}/danh-gia`);
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
    maMonAn: number
): Promise<FoodReview[]> {
    return apiFetch(`/mon-an/${maMonAn}/danh-gia`);
}