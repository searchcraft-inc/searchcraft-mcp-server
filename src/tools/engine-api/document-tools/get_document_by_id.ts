import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerGetDocumentById = (server: McpServer) => {
    /**
     * Tool: get_document_by_id
     * GET /index/:index/documents/:document_id - Get single document by internal Searchcraft ID
     */
    server.tool(
        "get_document_by_id",
        "Get a single document from an index by its internal Searchcraft ID (_id).",
        {
            index_name: z
                .string()
                .describe("The name of the index containing the document"),
            document_id: z
                .string()
                .describe("The internal Searchcraft document ID (_id)"),
        },
        async ({ index_name, document_id }) => {
            debugLog("[Tool Call] get_document_by_id");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents/${document_id}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "GET",
                    apiKey,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://document/${index_name}/${document_id}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(response, null, 2),
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
                    `Failed to get document: ${errorMessage}`,
                );
            }
        },
    );
};
