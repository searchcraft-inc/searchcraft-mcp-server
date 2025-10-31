import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerGetFederationDetails = (server: McpServer) => {
    /**
     * Tool: get_federation_details
     * GET /federation/:federation_name - Returns the entity for a specific federation
     */
    server.tool(
        "get_federation_details",
        "Get detailed information for a specific federation.",
        {
            federation_name: z
                .string()
                .describe("The name of the federation to get details for"),
        },
        async ({ federation_name }) => {
            debugLog("[Tool Call] get_federation_details");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/federation/${federation_name}`;
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
                                uri: `searchcraft://federation-details/${federation_name}/${Date.now()}`,
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
                    `Failed to get federation details: ${errorMessage}`,
                );
            }
        },
    );
};
