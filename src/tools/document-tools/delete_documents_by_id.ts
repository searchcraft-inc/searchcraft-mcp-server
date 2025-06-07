import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { z } from "zod";

export const registerDeleteDocumentById = (server: McpServer) => {
    /**
     * Tool: delete_document_by_id
     * DELETE /index/:index/documents/:document_id - Delete single document by internal ID
     */
    server.tool(
        "delete_document_by_id",
        "Delete a single document from an index by its internal Searchcraft ID (_id).",
        {
            index_name: z
                .string()
                .describe("The name of the index containing the document"),
            document_id: z
                .string()
                .describe(
                    "The internal Searchcraft document ID (_id) to delete",
                ),
        },
        async ({ index_name, document_id }) => {
            debugLog("[Tool Call] delete_document_by_id");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents/${document_id}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    ingestKey,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://document-deleted/${index_name}/${document_id}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message:
                                            "Document deleted successfully",
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
                    `Failed to delete document: ${errorMessage}`,
                );
            }
        },
    );
};
