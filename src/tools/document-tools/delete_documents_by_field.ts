import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { z } from "zod";

export const registerDeleteDocumentsByField = (server: McpServer) => {
    /**
     * Tool: delete_documents_by_field
     * DELETE /index/:index/documents - Delete documents by field match
     */
    server.tool(
        "delete_documents_by_field",
        "Delete one or several documents from an index by field term match (e.g., {id: 'xyz'} or {title: 'foo'}).",
        {
            index_name: z
                .string()
                .describe("The name of the index to delete documents from"),
            field_match: z
                .record(z.any())
                .describe(
                    "Field match criteria (e.g., {id: '12345'} or {title: 'example'})",
                ),
        },
        async ({ index_name, field_match }) => {
            debugLog("[Tool Call] delete_documents_by_field");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    ingestKey,
                    field_match,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://documents-deleted-by-field/${index_name}/${Date.now()}`,
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
                    `Failed to delete documents by field: ${errorMessage}`,
                );
            }
        },
    );
};
