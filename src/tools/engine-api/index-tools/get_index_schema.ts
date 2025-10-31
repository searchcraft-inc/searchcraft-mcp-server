import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerGetIndexSchema = (server: McpServer) => {
    /**
     * Tool: get_index_schema
     * GET /index/:index_name - Returns the schema for a specific index
     */
    server.tool(
        "get_index_schema",
        "Get the schema definition for a specific index.",
        {
            index_name: z
                .string()
                .describe("The name of the index to get the schema for"),
        },
        async ({ index_name }) => {
            debugLog("[Tool Call] get_index_schema");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}`;
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
                                uri: `searchcraft://index-schema/${index_name}/${Date.now()}`,
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
                    `Failed to get index schema: ${errorMessage}`,
                );
            }
        },
    );
};
