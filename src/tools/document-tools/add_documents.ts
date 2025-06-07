import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";

export const registerAddDocuments = (server: McpServer) => {
    /**
     * Tool: add_documents
     * POST /index/:index/documents - Add one or multiple documents to an index
     */
    server.tool(
        "add_documents",
        "Add one or multiple documents to an index. Documents should be provided as an array of JSON objects. Each document should have the schema specified by the corresponding index's schema.",
        {
            index_name: z
                .string()
                .describe("The name of the index to add documents to"),
            documents: z
                .array(z.record(z.any()))
                .describe("Array of document objects to add to the index"),
        },
        async ({ index_name, documents }) => {
            debugLog("[Tool Call] add_documents");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    adminKey,
                    documents,
                );

                const commitEndpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/commit`;
                const commitResponse = await makeSearchcraftRequest(
                    commitEndpoint,
                    "POST",
                    adminKey,
                    documents,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://documents-added/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(commitResponse, null, 2),
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
                    `Failed to add documents: ${errorMessage}`,
                );
            }
        },
    );
};
