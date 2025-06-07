import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";

export const registerDeleteSynonyms = (server: McpServer) => {
    /**
     * Tool: delete_synonyms
     * DELETE /index/:index_name/synonyms - Delete specific synonyms from an index
     */
    server.tool(
        "delete_synonyms",
        "Delete specific synonyms from an index by their keys.",
        {
            index_name: z
                .string()
                .describe("The name of the index to delete synonyms from"),
            synonyms: z
                .array(z.string())
                .describe("Array of synonym keys to delete from the index"),
        },
        async ({ index_name, synonyms }) => {
            debugLog("[Tool Call] delete_synonyms");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/synonyms`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    adminKey,
                    synonyms,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://synonyms-deleted/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message:
                                            "Synonyms deleted successfully",
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
                    `Failed to delete synonyms: ${errorMessage}`,
                );
            }
        },
    );
};
