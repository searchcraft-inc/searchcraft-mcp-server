import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

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
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/auth/federation/${federation_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "GET",
                    apiKey,
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
