import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerListAllIndexes = (server: McpServer) => {
    /**
     * Tool: list_all_indexes
     * GET /index - Returns a list of all indexes
     */
    server.tool(
        "list_all_indexes",
        "Get a list of all indexes in the Searchcraft instance.",
        {},
        async () => {
            debugLog("[Tool Call] list_all_indexes");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index`;
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
                                uri: `searchcraft://indexes/${Date.now()}`,
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
                    `Failed to list indexes: ${errorMessage}`,
                );
            }
        },
    );
};
