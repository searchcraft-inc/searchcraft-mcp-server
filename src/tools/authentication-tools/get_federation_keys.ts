import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";

export const registerGetFederationKeys = (server: McpServer) => {
    /**
     * Tool: get_federation_keys
     * GET /auth/federation/:federation_name - Returns all keys for a federation
     */
    server.tool(
        "get_federation_keys",
        "Get a list of all authentication keys associated with a specific federation.",
        {
            federation_name: z
                .string()
                .describe("The federation name to get keys for"),
        },
        async ({ federation_name }) => {
            debugLog("[Tool Call] get_federation_keys");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/auth/federation/${federation_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "GET",
                    adminKey,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://federation-keys/${federation_name}/${Date.now()}`,
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
                    `Failed to get federation keys: ${errorMessage}`,
                );
            }
        },
    );
};
