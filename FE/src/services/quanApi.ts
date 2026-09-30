const API_URL = "http://localhost:5038/api";


export async function quanApiFetch(
    endpoint: string,
    options: RequestInit = {}
) {

    const token =
        localStorage.getItem("token");


    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,

            headers: {

                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${token}`,

                ...options.headers,

            },

        }
    );


    const text =
        await response.text();


    let data = null;


    if (text) {

        try {

            data = JSON.parse(text);

        }
        catch {

            data = text;

        }

    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            `Request thất bại (${response.status})`
        );

    }


    return data;

}