import { apiFetch, API_URL } from "./api";

export interface LegalProfileRequest {
    nguoiDaiDien: string | null;
    chucVuNguoiDaiDien: string | null;
    soGiayToNguoiDaiDien: string | null;
    tenPhapLy: string | null;
    maSoThue: string | null;
    diaChiPhapLy: string | null;
    soGiayPhepKinhDoanh: string | null;
}

export interface LegalProfile extends LegalProfileRequest {
    fileGiayPhepKinhDoanh: string | null;
    fileGiayToNguoiDaiDien: string | null;
    ngayCapNhat: string;
}

export interface LegalProfileResponse {
    maNhaHang: number;
    trangThaiDuyet: string;
    duocChinhSua: boolean;
    hoSo: LegalProfile | null;
}

function authHeaders() {
    return {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
}

export function getLegalProfile(): Promise<LegalProfileResponse> {
    return apiFetch("/nha-hang/ho-so-phap-ly", {
        headers: authHeaders(),
        cache: "no-store",
    });
}

export function saveLegalProfile(
    data: LegalProfileRequest
): Promise<{ message: string }> {
    return apiFetch("/nha-hang/ho-so-phap-ly", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export type LegalDocumentType = "giay-phep" | "giay-to";

export function uploadLegalDocument(
    loai: LegalDocumentType,
    file: File
): Promise<{ message: string; loai: LegalDocumentType; tep: string }> {
    const body = new FormData();
    body.append("file", file);

    return apiFetch(`/nha-hang/ho-so-phap-ly/tep/${loai}`, {
        method: "POST",
        headers: authHeaders(),
        body,
    });
}

export async function downloadLegalDocument(
    loai: LegalDocumentType
): Promise<void> {
    const response = await fetch(
        `${API_URL}/nha-hang/ho-so-phap-ly/tep/${loai}`,
        {
            headers: authHeaders(),
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const text = await response.text();
        let message = `Không tải được tệp (${response.status}).`;

        try {
            const body: unknown = JSON.parse(text);

            if (
                body !== null &&
                typeof body === "object" &&
                "message" in body &&
                typeof body.message === "string"
            ) {
                message = body.message;
            }
        } catch {
            // Giữ thông báo mặc định nếu response không phải JSON.
        }

        throw new Error(message);
    }

    const blob = await response.blob();

    const extension =
        blob.type === "application/pdf"
            ? "pdf"
            : blob.type === "image/png"
                ? "png"
                : "jpg";

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${loai}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}