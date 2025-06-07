import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { z } from "zod";

export const registerDeleteDocumentsByQuery = (server: McpServer) => {
    /**
     * Tool: delete_documents_by_query
     * DELETE /index/:index/documents/query - Delete documents by query match
     */
    server.tool(
        "delete_documents_by_query",
        "Delete one or several documents from an index by query match.",
        {
            index_name: z
                .string()
                .describe("The name of the index to delete documents from"),
            query: z
                .record(z.any())
                .describe("Query criteria to match documents for deletion"),
        },
        async ({ index_name, query }) => {
            debugLog("[Tool Call] delete_documents_by_query");
            try {
                const endpointUrl = process.env.ENDPOINT_URL;
                const ingestKey = process.env.INGEST_KEY;

                if (!endpointUrl) {
                    return createErrorResponse(
                        "ENDPOINT_URL environment variable is required",
                    );
                }
                if (!ingestKey) {
                    return createErrorResponse(
                        "INGEST_KEY environment variable is required",
                    );
                }

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents/query`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    ingestKey,
                    query,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://documents-deleted-by-query/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message:
                                            "Documents deleted successfully",
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
                    `Failed to delete documents by query: ${errorMessage}`,
                );
            }
        },
    );
};
