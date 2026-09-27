import { apiFetch } from "./api";

export async function getRestaurants() {
    return apiFetch("/nha-hang", {
        method: "GET",
    });
}

export async function getRestaurantProfile() {
    const token = localStorage.getItem("token");

    return apiFetch("/nha-hang/ho-so", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function updateRestaurantProfile(data: any) {
    const token = localStorage.getItem("token");

    return apiFetch("/nha-hang/ho-so", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}

export async function updateRestaurantStatus(
    trangThaiHoatDong: string
) {
    const token = localStorage.getItem("token");

    return apiFetch("/nha-hang/trang-thai-hoat-dong", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            trangThaiHoatDong,
        }),
    });
}