import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerDeleteAllDocuments = (server: McpServer) => {
    /**
     * Tool: delete_all_documents
     * DELETE /index/:index/documents/all - Delete all documents from index
     */
    server.tool(
        "delete_all_documents",
        "Delete all documents from an index. The index will continue to exist after all documents are deleted.",
        {
            index_name: z
                .string()
                .describe("The name of the index to delete all documents from"),
        },
        async ({ index_name }) => {
            debugLog("[Tool Call] delete_all_documents");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents/all`;
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
                                uri: `searchcraft://all-documents-deleted/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message:
                                            "All documents deleted successfully",
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
                    `Failed to delete all documents: ${errorMessage}`,
                );
            }
        },
    );
};
