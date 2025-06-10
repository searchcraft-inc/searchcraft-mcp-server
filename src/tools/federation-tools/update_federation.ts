import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";
import { FederationSchema } from "../schemas.js";

export const registerUpdateFederation = (server: McpServer) => {
    /**
     * Tool: update_federation
     * PUT /federation/:federation_name - Replace the current federation entity
     */
    server.tool(
        "update_federation",
        "Replace the current federation entity with an updated one.",
        {
            federation_name: z
                .string()
                .describe("The name of the federation to update"),
            federation_data: FederationSchema.describe(
                "The updated federation configuration data",
            ),
        },
        async ({ federation_name, federation_data }) => {
            debugLog("[Tool Call] update_federation");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/federation/${federation_name}`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "PUT",
                    adminKey,
                    federation_data,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://federation-updated/${federation_name}/${Date.now()}`,
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
                    `Failed to update federation: ${errorMessage}`,
                );
            }
        },
    );
};
