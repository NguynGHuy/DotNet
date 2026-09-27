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