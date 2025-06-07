import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { debugLog } from "../helpers.js";

/**
 * Tool: get_searchcraft_status
 *
 * This tool performs a basic health check api request to the searchcraft service.
 *
 * @param server
 */
export const registerGetSearchcraftStatus = (server: McpServer) => {
    server.tool(
        "get_searchcraft_status",
        "Get the current status of the Searchcraft search service.",
        {},
        async () => {
            debugLog("[Tool Call] get-searchcraft-status");
            const response = await fetch(
                `${process.env.ENDPOINT_URL}/healthcheck`,
            );
            const responseJsonAsText = await response.text();
            return {
                content: [
                    {
                        type: "text",
                        text: responseJsonAsText,
                    },
                ],
            };
        },
    );
};
