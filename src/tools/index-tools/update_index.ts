import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { CreateIndexRequestSchema } from "../schemas.js";
import { z } from "zod";

export const registerUpdateIndex = (server: McpServer) => {
    /**
     * Tool: update_index
     * PUT /index/:index_name - Replace entire index contents
     */
    server.tool(
        "update_index",
        "Replace the entire contents of an existing index with a new schema definition.",
        {
            index_name: z.string().describe("The name of the index to update"),
            index_schema: CreateIndexRequestSchema.describe(
                "The complete index schema definition",
            ),
        },
        async ({ index_name, index_schema }) => {
            debugLog("[Tool Call] update_index");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "PUT",
                    adminKey,
                    index_schema,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://index-updated/${index_name}/${Date.now()}`,
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
                    `Failed to update index: ${errorMessage}`,
                );
            }
        },
    );
};
