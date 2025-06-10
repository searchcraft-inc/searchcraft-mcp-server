import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { z } from "zod";

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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    adminKey,
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
