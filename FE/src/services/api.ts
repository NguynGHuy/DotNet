const API_URL = "http://localhost:5038/api";

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const text = await response.text();

    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = null;
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.message || `Request thất bại (${response.status})`
        );
    }

    return data;
}