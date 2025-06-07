import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { z } from "zod";

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
                const endpointUrl = process.env.ENDPOINT_URL;
                const ingestKey = process.env.INGEST_KEY;

                if (!endpointUrl) {
                    return createErrorResponse(
                        "ENDPOINT_URL environment variable is required",
                    );
                }
                if (!ingestKey) {
                    return createErrorResponse(
                        "READ_KEY environment variable is required",
                    );
                }

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents/${document_id}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "GET",
                    ingestKey,
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
