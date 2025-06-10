import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    debugLog,
    makeSearchcraftRequest,
    createErrorResponse,
} from "../../helpers.js";
import { FederationSchema } from "../schemas.js";

export const registerCreateFederation = (server: McpServer) => {
    /**
     * Tool: create_federation
     * POST /federation - Creates or updates a federation
     */
    server.tool(
        "create_federation",
        "Create or update a federation with the specified configuration.",
        {
            federation_data: FederationSchema.describe(
                "The federation configuration data",
            ),
        },
        async ({ federation_data }) => {
            debugLog("[Tool Call] create_federation");
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

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/federation`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    adminKey,
                    federation_data,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://federation-created/${federation_data.name}/${Date.now()}`,
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
                    `Failed to create federation: ${errorMessage}`,
                );
            }
        },
    );
};
