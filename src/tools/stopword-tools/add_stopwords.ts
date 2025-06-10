import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";

export const registerAddStopwords = (server: McpServer) => {
    /**
     * Tool: add_stopwords
     * POST /index/:index_name/stopwords - Add stopwords to an index
     */
    server.tool(
        "add_stopwords",
        "Add custom stopwords to an index. These are added on top of the default language-specific dictionary.",
        {
            index_name: z
                .string()
                .describe("The name of the index to add stopwords to"),
            stopwords: z
                .array(z.string())
                .describe("Array of stopwords to add to the index"),
        },
        async ({ index_name, stopwords }) => {
            debugLog("[Tool Call] add_stopwords");
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
                    "POST",
                    adminKey,
                    stopwords,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://stopwords-added/${index_name}/${Date.now()}`,
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
                    `Failed to add stopwords: ${errorMessage}`,
                );
            }
        },
    );
};
