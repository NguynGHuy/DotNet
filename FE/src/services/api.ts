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
            data = text;
        }
    }

    if (!response.ok) {
        let message = `Request thất bại (${response.status})`;

        if (typeof data === "string" && data.trim()) {
            message = data;
        } else if (data && typeof data === "object") {
            if ("message" in data && typeof data.message === "string") {
                message = data.message;
            } else if ("title" in data && typeof data.title === "string") {
                message = data.title;
            }
        }

        throw new Error(message);
    }

    return data;
}