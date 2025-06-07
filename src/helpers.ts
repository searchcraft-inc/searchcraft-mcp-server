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

export const makeSearchcraftRequest = async (
    endpoint: string,
    method: string,
    authKey: string,
    // biome-ignore lint/suspicious/noExplicitAny: body could be anything
    body?: any,
) => {
    const response = await fetch(endpoint, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: authKey,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `HTTP ${response.status}: ${response.statusText} ${errorText}`,
        );
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : null;
};

// Helper function for common error responses
export const createErrorResponse = (message: string) => ({
    content: [
        {
            type: "text" as const,
            text: `❌ Error: ${message}`,
        },
    ],
    isError: true,
});

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
