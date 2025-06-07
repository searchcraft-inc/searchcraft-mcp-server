import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";

export const registerDeleteStopwords = (server: McpServer) => {
    /**
     * Tool: delete_stopwords
     * DELETE /index/:index_name/stopwords - Delete specific stopwords from an index
     */
    server.tool(
        "delete_stopwords",
        "Delete specific custom stopwords from an index. This only affects custom stopwords, not the default language dictionary.",
        {
            index_name: z
                .string()
                .describe("The name of the index to delete stopwords from"),
            stopwords: z
                .array(z.string())
                .describe("Array of stopwords to delete from the index"),
        },
        async ({ index_name, stopwords }) => {
            debugLog("[Tool Call] delete_stopwords");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/stopwords`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    adminKey,
                    stopwords,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://stopwords-deleted/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message:
                                            "Stopwords deleted successfully",
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
                    `Failed to delete stopwords: ${errorMessage}`,
                );
            }
        },
    );
};
