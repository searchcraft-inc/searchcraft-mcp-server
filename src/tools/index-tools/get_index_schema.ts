import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { z } from "zod";

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
                const endpointUrl = process.env.ENDPOINT_URL;
                const adminKey = process.env.ADMIN_KEY;

                if (!endpointUrl) {
                    return createErrorResponse(
                        "ENDPOINT_URL environment variable is required",
                    );
                }
                if (!adminKey) {
                    return createErrorResponse(
                        "READ_KEY environment variable is required",
                    );
                }

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "GET",
                    adminKey,
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
