import type { SearchcraftQuery, SearchcraftResponse } from "./types.js";

export async function performSearchcraftRequest(
    endpoint: string,
    payload: SearchcraftQuery,
    readKey: string,
): Promise<SearchcraftResponse> {
    debugLog(`"[search-request]: ${JSON.stringify(payload)}`);
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: readKey,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `Searchcraft API error: ${response.status} - ${response.statusText}: ${text}`,
        );
    }

    return await response.json();
}

export function debugLog(
    message: string,
    level: "LOG" | "INFO" | "WARN" | "ERROR" = "LOG",
) {
    if (!process.env.DEBUG || process.env.DEBUG.toLowerCase() !== "true") {
        return;
    }

    switch (level) {
        case "LOG":
            console.log(message);
            break;
        case "INFO":
            console.info(message);
            break;
        case "WARN":
            console.warn(message);
            break;
        case "ERROR":
            console.error(message);
            break;
    }
}
