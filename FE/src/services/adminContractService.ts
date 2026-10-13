import { apiFetch, API_URL } from "./api";

export type ContractFileType = "giay-phep" | "giay-to" | "hop-dong";

export interface AdminContractDetails {
    nhaHang: {
        maNhaHang: number;
        tenNhaHang: string;
        diaChiQuan: string;
        trangThaiDuyet: string;
        email: string;
        soDienThoai: string | null;
    };
    hopDong: {
        maHopDong: number;
        soHopDong: string;
        trangThai: string;
        nguoiDaiDien: string;
        chucVuNguoiDaiDien: string | null;
        soGiayToNguoiDaiDien: string | null;
        tenPhapLy: string | null;
        maSoThue: string | null;
        diaChiPhapLy: string | null;
        soGiayPhepKinhDoanh: string | null;
        phienBanDieuKhoan: string;
        tyLePhiNenTang: number;
        ngayBatDau: string;
        ngayKetThuc: string;
        thoiGianKy: string | null;
        thoiGianGuiDuyet: string | null;
        noiDungHopDong: string | null;
        lyDoTuChoi: string | null;
        coGiayPhep: boolean;
        coGiayToDaiDien: boolean;
        coTepHopDong: boolean;
    } | null;
}

function authHeaders() {
    return {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
}

export function getAdminContract(
    maNhaHang: number
): Promise<AdminContractDetails> {
    return apiFetch(`/admin/nha-hang/${maNhaHang}/hop-dong`, {
        headers: authHeaders(),
        cache: "no-store",
    });
}

export async function downloadAdminContractFile(
    maHopDong: number,
    loai: ContractFileType
): Promise<void> {
    const response = await fetch(
        `${API_URL}/admin/hop-dong/${maHopDong}/tep/${loai}`,
        { headers: authHeaders(), cache: "no-store" }
    );

    if (!response.ok) {
        let message = `Không tải được tệp (${response.status}).`;

        try {
            const body: unknown = await response.json();
            if (
                body !== null &&
                typeof body === "object" &&
                "message" in body &&
                typeof body.message === "string"
            ) {
                message = body.message;
            }
        } catch {
            // Giữ thông báo mặc định.
        }

        throw new Error(message);
    }

    const blob = await response.blob();
    const extension = blob.type.startsWith("text/plain")
        ? "txt"
        : blob.type === "application/pdf"
            ? "pdf"
            : blob.type === "image/png" ? "png" : "jpg";

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${loai}-${maHopDong}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}