import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { debugLog } from "../helpers.js";

export const registerGetSearchcraftStatus = (server: McpServer) => {
    server.tool(
        "get-searchcraft-status",
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
