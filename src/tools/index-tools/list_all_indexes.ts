import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";

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
                const endpointUrl = process.env.ENDPOINT_URL;
                const readKey = process.env.READ_KEY;

                if (!endpointUrl) {
                    return createErrorResponse(
                        "ENDPOINT_URL environment variable is required",
                    );
                }
                if (!readKey) {
                    return createErrorResponse(
                        "READ_KEY environment variable is required",
                    );
                }

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "GET",
                    readKey,
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
