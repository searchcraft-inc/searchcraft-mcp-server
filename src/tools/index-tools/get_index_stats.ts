import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { z } from "zod";

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
                const endpointUrl = process.env.ENDPOINT_URL;
                const adminKey = process.env.ADMIN_KEY;

                if (!endpointUrl) {
                    return createErrorResponse(
                        "ENDPOINT_URL environment variable is required",
                    );
                }
                if (!adminKey) {
                    return createErrorResponse(
                        "READ_KEY environment variable is required",
                    );
                }

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/stats`;
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
