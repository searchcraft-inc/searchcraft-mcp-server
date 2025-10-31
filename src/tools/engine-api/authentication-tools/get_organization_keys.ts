import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerGetOrganizationKeys = (server: McpServer) => {
    /**
     * Tool: get_organization_keys
     * GET /auth/organization/:organization_id - Returns all keys for an organization
     */
    server.tool(
        "get_organization_keys",
        "Get a list of all authentication keys associated with a specific organization.",
        {
            organization_id: z
                .string()
                .describe("The organization ID to get keys for"),
        },
        async ({ organization_id }) => {
            debugLog("[Tool Call] get_organization_keys");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/auth/organization/${organization_id}`;
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
                                uri: `searchcraft://organization-keys/${organization_id}/${Date.now()}`,
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
                    `Failed to get organization keys: ${errorMessage}`,
                );
            }
        },
    );
};
