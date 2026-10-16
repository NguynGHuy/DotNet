import { apiFetch, buildQuery, type PagedResult, type PaginationParams } from "./api";
import { getIdempotencyKey } from "./idempotency";

export interface DoiSoatSummary {
    maDoiSoat: number;
    maNhaHang: number;
    tenNhaHang: string;
    tuNgay: string;
    denNgay: string;
    tongSoDon: number;
    soTienCanDoiSoat: number;
    trangThai: string;
}

export interface DoiSoatDetail extends DoiSoatSummary {
    tongTienHang: number;
    tongGiamGiaNhaHang: number;
    tongGiamGiaHeThong: number;
    tongPhiNenTang: number;
    tongTienNhaHangNhan: number;
    tongTienNhaHangDaThu: number;
    maGiaoDichDoiSoat?: string | null;
}

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export function getAdminDoiSoat(params: PaginationParams & { maNhaHang?: number } = {}) {
    return apiFetch(`/admin/doi-soat${buildQuery(params)}`, { headers: authHeaders() }) as Promise<PagedResult<DoiSoatSummary>>;
}

export async function createDoiSoat(data: { maNhaHang: number; tuNgay: string; denNgay: string }) {
    const path = "/admin/doi-soat/tao-ky";
    const key = await getIdempotencyKey(`POST ${path}`, data);
    return apiFetch(path, {
        method: "POST", 
        headers: { ...authHeaders(), "Idempotency-Key": key }, 
        body: JSON.stringify(data)
    });
}

export function getAdminDoiSoatDetail(id: number) {
    return apiFetch(`/admin/doi-soat/${id}`, { headers: authHeaders() }) as Promise<DoiSoatDetail>;
}

export async function payDoiSoat(id: number, maGiaoDich: string) {
    const path = `/admin/doi-soat/${id}/thanh-toan`;
    const data = { maGiaoDich: maGiaoDich.trim() };
    const key = await getIdempotencyKey(`PUT ${path}`, data);
    return apiFetch(path, {
        method: "PUT", 
        headers: { ...authHeaders(), "Idempotency-Key": key }, 
        body: JSON.stringify(data)
    });
}

export function getQuanDoiSoat(params: PaginationParams = {}) {
    return apiFetch(`/nha-hang/doi-soat${buildQuery(params)}`, { headers: authHeaders() }) as Promise<PagedResult<DoiSoatSummary>>;
}

export function getQuanDoiSoatDetail(id: number) {
    return apiFetch(`/nha-hang/doi-soat/${id}`, { headers: authHeaders() }) as Promise<DoiSoatDetail>;
}

export async function confirmDoiSoat(id: number) {
    const path = `/nha-hang/doi-soat/${id}/xac-nhan`;
    const key = await getIdempotencyKey(`PUT ${path}`, { id });
    return apiFetch(path, {
        method: "PUT", 
        headers: { ...authHeaders(), "Idempotency-Key": key }
    });
}