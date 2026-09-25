import { apiFetch } from "./api";

export interface Address {
    maDiaChi: number;
    tenNguoiNhan: string;
    soDienThoaiNhan: string;
    diaChiCuThe: string;
    ghiChu: string | null;
    macDinh: boolean;
}

export interface AddressRequest {
    tenNguoiNhan: string;
    soDienThoaiNhan: string;
    diaChiCuThe: string;
    ghiChu: string | null;
    macDinh: boolean;
}

export async function getAddresses() {
    const token = localStorage.getItem("token");

    return apiFetch("/dia-chi", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function createAddress(data: AddressRequest) {
    const token = localStorage.getItem("token");

    return apiFetch("/dia-chi", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function updateAddress(
    id: number,
    data: AddressRequest
) {
    const token = localStorage.getItem("token");

    return apiFetch(`/dia-chi/${id}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function deleteAddress(id: number) {
    const token = localStorage.getItem("token");

    return apiFetch(`/dia-chi/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function setDefaultAddress(id: number) {
    const token = localStorage.getItem("token");

    return apiFetch(`/dia-chi/${id}/mac-dinh`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}