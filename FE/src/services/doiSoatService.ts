import { apiFetch, buildQuery, type PagedResult, type PaginationParams } from "./api";

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

export function createDoiSoat(data: { maNhaHang: number; tuNgay: string; denNgay: string }) {
    return apiFetch("/admin/doi-soat/tao-ky", {
        method: "POST", headers: authHeaders(), body: JSON.stringify(data)
    });
}

export function getAdminDoiSoatDetail(id: number) {
    return apiFetch(`/admin/doi-soat/${id}`, { headers: authHeaders() }) as Promise<DoiSoatDetail>;
}

export function payDoiSoat(id: number, maGiaoDich: string) {
    return apiFetch(`/admin/doi-soat/${id}/thanh-toan`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(maGiaoDich)
    });
}

export function getQuanDoiSoat(params: PaginationParams = {}) {
    return apiFetch(`/nha-hang/doi-soat${buildQuery(params)}`, { headers: authHeaders() }) as Promise<PagedResult<DoiSoatSummary>>;
}

export function getQuanDoiSoatDetail(id: number) {
    return apiFetch(`/nha-hang/doi-soat/${id}`, { headers: authHeaders() }) as Promise<DoiSoatDetail>;
}

export function confirmDoiSoat(id: number) {
    return apiFetch(`/nha-hang/doi-soat/${id}/xac-nhan`, {
        method: "PUT", headers: authHeaders()
    });
}
