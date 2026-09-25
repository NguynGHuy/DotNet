import { apiFetch } from "./api";

export async function getCurrentUser() {
    const token = localStorage.getItem("token");

    return apiFetch("/auth/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}