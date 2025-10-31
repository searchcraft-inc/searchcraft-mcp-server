import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerGetOrganizationFederations = (server: McpServer) => {
    /**
     * Tool: get_organization_federations
     * GET /federation/organization/:organization_id - Returns all federations for an organization
     */
    server.tool(
        "get_organization_federations",
        "Get a list of all federations for a specific organization.",
        {
            organization_id: z
                .string()
                .describe("The organization ID to get federations for"),
        },
        async ({ organization_id }) => {
            debugLog("[Tool Call] get_organization_federations");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/federation/organization/${organization_id}`;
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
                                uri: `searchcraft://organization-federations/${organization_id}/${Date.now()}`,
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
                    `Failed to get organization federations: ${errorMessage}`,
                );
            }
        },
    );
};
