import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerDeleteIndex = (server: McpServer) => {
    /**
     * Tool: delete_index
     * DELETE /index/:index_name - Deletes an index
     */
    server.tool(
        "delete_index",
        "Delete an index and all its documents permanently.",
        {
            index_name: z.string().describe("The name of the index to delete"),
        },
        async ({ index_name }) => {
            debugLog("[Tool Call] delete_index");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    apiKey,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://index-deleted/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message: "Index deleted successfully",
                                    },
                                    null,
                                    2,
                                ),
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
                    `Failed to delete index: ${errorMessage}`,
                );
            }
        },
    );
};
