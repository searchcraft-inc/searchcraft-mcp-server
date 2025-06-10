import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { KeySchema } from "../schemas.js";

export const registerUpdateKey = (server: McpServer) => {
    /**
     * Tool: update_key
     * POST /auth/key/:key - Update an individual key
     */
    server.tool(
        "update_key",
        "Update an existing authentication key with new configuration.",
        {
            key: z.string().describe("The authentication key to update"),
            key_data: KeySchema.describe("The updated key configuration data"),
        },
        async ({ key, key_data }) => {
            debugLog("[Tool Call] update_key");
            try {
                const endpointUrl = process.env.ENDPOINT_URL;
                const adminKey = process.env.ADMIN_KEY;

                if (!endpointUrl) {
                    return createErrorResponse(
                        "ENDPOINT_URL environment variable is required",
                    );
                }
                if (!adminKey) {
                    return createErrorResponse(
                        "ADMIN_KEY environment variable is required",
                    );
                }

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/auth/key/${key}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    adminKey,
                    key_data,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://key-updated/${key}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(response, null, 2),
                            },
                        },
                    ],
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                return createErrorResponse(
                    `Failed to update key: ${errorMessage}`,
                );
            }
        },
    );
};
