import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";
import { FederationSchema } from "../../schemas.js";

export const registerGetFederationStats = (server: McpServer) => {
    /**
     * Tool: get_federation_stats
     * GET /federation/:federation_name/stats - Returns document counts per index for a federation
     */
    server.tool(
        "get_federation_stats",
        "Get document counts per index for a federation as well as the total document count.",
        {
            federation_name: z
                .string()
                .describe("The name of the federation to get stats for"),
        },
        async ({ federation_name }) => {
            debugLog("[Tool Call] get_federation_stats");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/federation/${federation_name}/stats`;
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
                                uri: `searchcraft://federation-stats/${federation_name}/${Date.now()}`,
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
                    `Failed to get federation stats: ${errorMessage}`,
                );
            }
        },
    );
};
