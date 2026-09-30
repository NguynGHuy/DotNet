import { apiFetch } from "./api";

// =====================================================
// TYPES
// =====================================================

export interface MonAn {
    maMonAn: number;
    maNhaHang: number;
    maDanhMuc: number;

    tenDanhMuc: string;

    tenMonAn: string;

    moTa: string | null;

    gia: number;

    hinhAnh: string | null;

    trangThai: boolean;

    danhGiaTrungBinh: number;
}

export interface ToppingMonAn {
    maTopping: number;
    tenTopping: string;
    giaThem: number;
    trangThai: boolean;
}

export interface NhomToppingMonAn {
    maNhomTopping: number;

    tenNhom: string;

    batBuocChon: boolean;

    chonToiDa: number | null;

    toppings: ToppingMonAn[];
}

export interface MonAnChiTiet extends MonAn {
    nhomToppings: NhomToppingMonAn[];
}

export interface TaoMonAnRequest {
    maDanhMuc: number;

    tenMonAn: string;

    moTa?: string | null;

    gia: number;

    hinhAnh?: string | null;
}

export interface CapNhatMonAnRequest {
    maDanhMuc: number;

    tenMonAn: string;

    moTa?: string | null;

    gia: number;

    hinhAnh?: string | null;
}

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`,
    };
}

// =====================================================
// GET DANH SÁCH MÓN
// Public
// =====================================================

export async function getMonAns(
    maNhaHang: number
): Promise<MonAn[]> {
    return apiFetch(
        `/mon-an?maNhaHang=${maNhaHang}`
    );
}

// =====================================================
// GET CHI TIẾT MÓN
// Public
//
// Có:
// - thông tin món
// - nhóm topping
// - topping đang bật
// =====================================================

export async function getMonAn(
    id: number
): Promise<MonAnChiTiet> {
    return apiFetch(`/mon-an/${id}`);
}

// =====================================================
// TẠO MÓN
// Role: Quan
// =====================================================

export async function createMonAn(
    data: TaoMonAnRequest
) {
    return apiFetch("/mon-an", {
        method: "POST",

        headers: getAuthHeaders(),

        body: JSON.stringify(data),
    });
}

// =====================================================
// CẬP NHẬT MÓN
// Role: Quan
// =====================================================

export async function updateMonAn(
    id: number,
    data: CapNhatMonAnRequest
) {
    return apiFetch(`/mon-an/${id}`, {
        method: "PUT",

        headers: getAuthHeaders(),

        body: JSON.stringify(data),
    });
}

// =====================================================
// BẬT / TẮT MÓN
// Role: Quan
// =====================================================

export async function updateTrangThaiMonAn(
    id: number,
    trangThai: boolean
) {
    return apiFetch(
        `/mon-an/${id}/trang-thai`,
        {
            method: "PUT",

            headers: getAuthHeaders(),

            body: JSON.stringify({
                trangThai,
            }),
        }
    );
}

// =====================================================
// XÓA MÓN
// Role: Quan
// =====================================================

export async function deleteMonAn(
    id: number
) {
    return apiFetch(`/mon-an/${id}`, {
        method: "DELETE",

        headers: getAuthHeaders(),
    });
}

// =====================================================
// GÁN NHÓM TOPPING VÀO MÓN
// Role: Quan
//
// Backend hiện nhận:
// body: 1
//
// chứ không phải:
// { maNhomTopping: 1 }
// =====================================================

export async function ganTopping(
    maMonAn: number,
    maNhomTopping: number
) {
    return apiFetch(
        `/mon-an/${maMonAn}/gan-topping`,
        {
            method: "POST",

            headers: getAuthHeaders(),

            body: JSON.stringify(
                maNhomTopping
            ),
        }
    );
}

// =====================================================
// GỠ NHÓM TOPPING KHỎI MÓN
// Role: Quan
// =====================================================

export async function goTopping(
    maMonAn: number,
    maNhomTopping: number
) {
    return apiFetch(
        `/mon-an/${maMonAn}/go-topping/${maNhomTopping}`,
        {
            method: "DELETE",

            headers: getAuthHeaders(),
        }
    );
}