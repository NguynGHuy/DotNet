import { apiFetch } from "./api";

export interface ContractContent {
    maNhaHang: number;
    phienBanDieuKhoan: string;
    tyLePhiNenTang: number;
    ngayBatDau: string;
    ngayKetThuc: string;
    chinhSachDoiSoat: string;
    noiDungHopDong: string;
}

export interface ContractPreview extends ContractContent {
    maXacNhanNoiDung: string;
}

export interface SignedContract extends ContractContent {
    maHopDong: number;
    soHopDong: string;
    trangThai: string;
    thoiGianKy: string | null;
    thoiGianGuiDuyet: string | null;
    thoiGianDuyet: string | null;
    lyDoTuChoi: string | null;
}

function authHeaders() {
    return {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
}

export function getContractPreview(): Promise<ContractPreview> {
    return apiFetch("/nha-hang/hop-dong/xem-truoc", {
        headers: authHeaders(),
        cache: "no-store",
    });
}

export function getMyContract(): Promise<{
    hopDong: SignedContract | null;
}> {
    return apiFetch("/nha-hang/hop-dong/cua-toi", {
        headers: authHeaders(),
        cache: "no-store",
    });
}

export interface SignContractRequest {
    dongYDieuKhoan: boolean;
    xacNhanKy: boolean;
    maXacNhanNoiDung: string;
}

export function signContract(
    data: SignContractRequest
): Promise<{
    message: string;
    maHopDong: number;
    soHopDong: string;
    trangThai: string;
    thoiGianKy: string;
}> {
    return apiFetch("/nha-hang/hop-dong/ky", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}
export function submitContractForReview(): Promise<{
    message: string;
}> {
    return apiFetch("/nha-hang/hop-dong/gui-xet-duyet", {
        method: "POST",
        headers: authHeaders(),
    });
}