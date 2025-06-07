import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";

export const registerGetIndexStopwords = (server: McpServer) => {
    /**
     * Tool: get_index_stopwords
     * GET /index/:index_name/stopwords - Get all stopwords for an index
     */
    server.tool(
        "get_index_stopwords",
        "Get all stopwords for an index, including both default language dictionary and custom stopwords.",
        {
            index_name: z
                .string()
                .describe("The name of the index to get stopwords for"),
        },
        async ({ index_name }) => {
            debugLog("[Tool Call] get_index_stopwords");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/stopwords`;
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
                                uri: `searchcraft://index-stopwords/${index_name}/${Date.now()}`,
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
                    `Failed to get index stopwords: ${errorMessage}`,
                );
            }
        },
    );
};
