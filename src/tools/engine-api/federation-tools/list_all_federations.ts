import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerListAllFederations = (server: McpServer) => {
    /**
     * Tool: list_all_federations
     * GET /federation - Returns a list of all federations
     */
    server.tool(
        "list_all_federations",
        "Get a list of all federations in the Searchcraft instance.",
        {},
        async () => {
            debugLog("[Tool Call] list_all_federations");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/federation`;
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
                                uri: `searchcraft://federations/${Date.now()}`,
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
                    `Failed to list federations: ${errorMessage}`,
                );
            }
        },
    );
};
