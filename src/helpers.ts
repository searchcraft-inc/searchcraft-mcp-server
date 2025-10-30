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

        // Enhanced error logging for document validation issues
        if (endpoint.includes('/documents') && errorText.includes('validation')) {
            debugLog('Searchcraft document validation error:');
            debugLog(`  Status: ${response.status} ${response.statusText}`);
            debugLog(`  Response: ${errorText}`);
            debugLog(`  Request endpoint: ${endpoint}`);
            debugLog(`  Request method: ${method}`);
        }

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

    process.stderr.write(`${logMessage} \n`);
}

/**
 * Prepares documents for Searchcraft by ensuring f64 fields have proper float representation
 * This addresses the issue where integer values like 1 cause validation errors
 * when sent to Searchcraft for fields marked as f64 in the schema.
 */
export const prepareDocumentsForSearchcraft = (
    documents: Record<string, unknown>[],
    schema: Record<string, { type?: string; [key: string]: unknown }>
): Record<string, unknown>[] => {
    // Find f64 fields in the schema
    const f64Fields = Object.entries(schema)
        .filter(([_, config]) => config?.type === "f64")
        .map(([fieldName, _]) => fieldName);

    if (f64Fields.length === 0) {
        return documents; // No f64 fields, return as-is
    }

    return documents.map(doc => {
        const prepared = { ...doc };

        // biome-ignore lint/complexity/noForEach: its fine.
        f64Fields.forEach(fieldName => {
            const value = prepared[fieldName];
            if (typeof value === "number" && Number.isInteger(value)) {
                // Convert integer to a value that will serialize with decimal point
                // We use a custom object with toJSON method to force .0 in serialization
                prepared[fieldName] = {
                    valueOf: () => value,
                    toJSON: () => `${value}.0`,
                    toString: () => `${value}.0`
                };
            } else if (Array.isArray(value)) {
                // Handle arrays of numbers
                prepared[fieldName] = value.map(v => {
                    if (typeof v === "number" && Number.isInteger(v)) {
                        return {
                            valueOf: () => v,
                            toJSON: () => `${v}.0`,
                            toString: () => `${v}.0`
                        };
                    }
                    return v;
                });
            }
        });

        return prepared;
    });
};
