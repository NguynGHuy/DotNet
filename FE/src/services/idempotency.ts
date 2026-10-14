export async function getIdempotencyKey(
    operation: string,
    payload: unknown
): Promise<string> {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Vui lòng đăng nhập.");
    }

    const source = JSON.stringify({
        token,
        operation,
        payload,
    });

    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(source)
    );

    const fingerprint = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

    const storageKey = `idempotency:${fingerprint}`;
    const existing = sessionStorage.getItem(storageKey);

    if (existing) return existing;

    const key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, key);

    return key;
}