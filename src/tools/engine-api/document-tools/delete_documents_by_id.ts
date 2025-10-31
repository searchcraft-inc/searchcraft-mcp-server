import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

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
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents/${document_id}`;
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
