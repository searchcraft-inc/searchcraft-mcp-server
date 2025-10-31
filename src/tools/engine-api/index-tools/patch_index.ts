import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";
import { PatchIndexSchema } from "../../schemas.js";

export const registerPatchIndex = (server: McpServer) => {
    /**
     * Tool: patch_index
     * PATCH /index/:index_name - Partial configuration updates
     */
    server.tool(
        "patch_index",
        "Make partial configuration changes to an index schema (search_fields, weight_multipliers, etc.).",
        {
            index_name: z.string().describe("The name of the index to patch"),
            updates: PatchIndexSchema.describe(
                "The partial updates to apply to the index",
            ),
        },
        async ({ index_name, updates }) => {
            debugLog("[Tool Call] patch_index");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "PATCH",
                    apiKey,
                    updates,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://index-patched/${index_name}/${Date.now()}`,
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
                    `Failed to patch index: ${errorMessage}`,
                );
            }
        },
    );
};
