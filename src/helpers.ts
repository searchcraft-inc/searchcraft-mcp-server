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

// Define log level hierarchy (lower numbers = higher priority)
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    LOG: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

function getConfiguredLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    return envLevel && envLevel in LOG_LEVELS ? envLevel : "LOG";
}

function shouldLog(messageLevel: LogLevel, configuredLevel: LogLevel): boolean {
    return LOG_LEVELS[messageLevel] <= LOG_LEVELS[configuredLevel];
}

export function debugLog(
    message: string,
    level: LogLevel = "LOG",
) {
    // Check if debugging is enabled at all
    if (!process.env.DEBUG || process.env.DEBUG.toLowerCase() !== "true") {
        return;
    }

    // Check if this message level should be logged based on configured level
    const configuredLevel = getConfiguredLogLevel();
    if (!shouldLog(level, configuredLevel)) {
        return;
    }

    // Use stderr for all debug output to avoid interfering with MCP JSON-RPC on stdout
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    process.stderr.write(logMessage + '\n');
}
