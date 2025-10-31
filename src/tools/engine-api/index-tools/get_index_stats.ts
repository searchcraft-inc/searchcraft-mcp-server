import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerGetIndexStats = (server: McpServer) => {
    /**
     * Tool: get_index_stats
     * GET /index/:index_name/stats - Returns metadata about a specific index
     */
    server.tool(
        "get_index_stats",
        "Get statistics and metadata for a specific index (document count, etc.).",
        {
            index_name: z
                .string()
                .describe("The name of the index to get stats for"),
        },
        async ({ index_name }) => {
            debugLog("[Tool Call] get_index_stats");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/stats`;
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
                                uri: `searchcraft://index-stats/${index_name}/${Date.now()}`,
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
                    `Failed to get index stats: ${errorMessage}`,
                );
            }
        },
    );
};
