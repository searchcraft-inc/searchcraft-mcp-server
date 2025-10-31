import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerDeleteFederation = (server: McpServer) => {
    /**
     * Tool: delete_federation
     * DELETE /federation/:federation_name - Deletes a federation
     */
    server.tool(
        "delete_federation",
        "Delete a federation permanently.",
        {
            federation_name: z
                .string()
                .describe("The name of the federation to delete"),
        },
        async ({ federation_name }) => {
            debugLog("[Tool Call] delete_federation");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/federation/${federation_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "DELETE",
                    apiKey,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://federation-deleted/${federation_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    response || {
                                        message:
                                            "Federation deleted successfully",
                                    },
                                    null,
                                    2,
                                ),
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
                    `Failed to delete federation: ${errorMessage}`,
                );
            }
        },
    );
};
