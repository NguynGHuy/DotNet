import { apiFetch } from "./api";

export async function getRestaurants() {
    return apiFetch("/nha-hang", {
        method: "GET",
    });
}