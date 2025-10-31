import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";
import { CreateIndexRequestSchema } from "../../schemas.js";

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
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    apiKey,
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
