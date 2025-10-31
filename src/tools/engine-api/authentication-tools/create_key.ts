import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";
import { KeySchema } from "../../schemas.js";

export const registerCreateKey = (server: McpServer) => {
    /**
     * Tool: create_key
     * POST /auth/key - Create a new authentication key
     */
    server.tool(
        "create_key",
        "Create a new authentication key with specified permissions and access controls.",
        {
            key_data: KeySchema.describe("The key configuration data"),
        },
        async ({ key_data }) => {
            debugLog("[Tool Call] create_key");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/auth/key`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    apiKey,
                    key_data,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://key-created/${key_data.name}/${Date.now()}`,
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
                    `Failed to create key: ${errorMessage}`,
                );
            }
        },
    );
};
