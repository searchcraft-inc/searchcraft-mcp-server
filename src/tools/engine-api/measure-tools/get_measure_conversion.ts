import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";
import { MeasureQueryParamsSchema } from "../../schemas.js";

/**
 * Register Searchcraft measurement tools
 */
export const registerMeasureConversion = (server: McpServer) => {
    /**
     * Tool: get_measure_conversion
     * GET /measure/dashboard/conversion - Get measurement conversion data
     */
    server.tool(
        "get_measure_conversion",
        "Get measurement conversion data with optional filtering and aggregation parameters.",
        {
            query_params: MeasureQueryParamsSchema.optional().describe(
                "Query parameters for filtering and pagination",
            ),
        },
        async ({ query_params = {} }) => {
            debugLog("[Tool Call] get_measure_conversion");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                let endpoint = `${endpointUrl.replace(/\/$/, "")}/measure/dashboard/conversion`;

                if (query_params && Object.keys(query_params).length > 0) {
                    const searchParams = new URLSearchParams();
                    for (const [key, value] of Object.entries(query_params)) {
                        if (value !== undefined && value !== null) {
                            searchParams.append(key, String(value));
                        }
                    }
                    endpoint += `?${searchParams.toString()}`;
                }

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
                                uri: `searchcraft://measure-conversion/${Date.now()}`,
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
                    `Failed to get measure conversion: ${errorMessage}`,
                );
            }
        },
    );
};
