import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { CreateIndexRequestSchema } from "../schemas.js";

export const registerCreateIndex = (server: McpServer) => {
    /**
     * Tool: create_index
     * POST /index - Creates a new index with comprehensive schema validation
     */
    server.tool(
        "create_index",
        "Create a new index with the specified schema. This will empty the index if it already exists.",
        {
            index_schema: CreateIndexRequestSchema.describe(
                "The complete index schema definition",
            ),
        },
        async ({ index_schema }) => {
            debugLog("[Tool Call] create_index");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    adminKey,
                    index_schema,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://index-created/${index_schema.index.name}/${Date.now()}`,
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
                    `Failed to create index: ${errorMessage}`,
                );
            }
        },
    );
};
