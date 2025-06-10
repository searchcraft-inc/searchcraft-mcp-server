import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { MeasureQueryParamsSchema } from "../schemas.js";

/**
 * Register Searchcraft measurement tools
 */
export const registerMeasureSummary = (server: McpServer) => {
    /**
     * Tool: get_measure_summary
     * GET /measure/dashboard/summary - Get measurement summary data
     */
    server.tool(
        "get_measure_summary",
        "Get measurement summary data with optional filtering and aggregation parameters.",
        {
            query_params: MeasureQueryParamsSchema.optional().describe(
                "Query parameters for filtering and pagination",
            ),
        },
        async ({ query_params = {} }) => {
            debugLog("[Tool Call] get_measure_summary");
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

                let endpoint = `${endpointUrl.replace(/\/$/, "")}/measure/dashboard/summary`;

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
                    adminKey,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://measure-summary/${Date.now()}`,
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
                    `Failed to get measure summary: ${errorMessage}`,
                );
            }
        },
    );
};
