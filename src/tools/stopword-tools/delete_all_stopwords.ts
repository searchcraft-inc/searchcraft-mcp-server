import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";

export const registerDeleteAllStopwords = (server: McpServer) => {
    /**
     * Tool: delete_all_stopwords
     * DELETE /index/:index_name/stopwords/all - Delete all custom stopwords from an index
     */
    server.tool(
        "delete_all_stopwords",
        "Delete all custom stopwords from an index. This only affects custom stopwords, not the default language dictionary.",
        {
            index_name: z
                .string()
                .describe(
                    "The name of the index to delete all custom stopwords from",
                ),
        },
        async ({ index_name }) => {
            debugLog("[Tool Call] delete_all_stopwords");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/stopwords/all`;
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
                                uri: `searchcraft://all-stopwords-deleted/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message:
                                            "All custom stopwords deleted successfully",
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
                    `Failed to delete all stopwords: ${errorMessage}`,
                );
            }
        },
    );
};
