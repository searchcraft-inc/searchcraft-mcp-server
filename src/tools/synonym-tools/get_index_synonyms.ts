import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";

export const registerGetIndexSynonyms = (server: McpServer) => {
    /**
     * Tool: get_index_synonyms
     * GET /index/:index_name/synonyms - Get all synonyms for an index
     */
    server.tool(
        "get_index_synonyms",
        "Get all synonyms defined for an index.",
        {
            index_name: z
                .string()
                .describe("The name of the index to get synonyms for"),
        },
        async ({ index_name }) => {
            debugLog("[Tool Call] get_index_synonyms");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/synonyms`;
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
                                uri: `searchcraft://index-synonyms/${index_name}/${Date.now()}`,
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
                    `Failed to get index synonyms: ${errorMessage}`,
                );
            }
        },
    );
};
