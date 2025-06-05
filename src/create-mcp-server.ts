import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
    registerGetSearchcraftStatus,
    registerGetPrelimSearchData,
    registerGetSearchResults,
} from "./tools/index.js";

export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: "searchcraft-mcp-server",
        version: "0.0.1",
        capabilities: {
            resources: {},
            tools: {},
        },
    });

    server.tool(
        "get-mcp-node-version",
        "Get the current version of node that is running",
        {},
        async () => {
            const nodeVersion = process.version;
            return {
                content: [
                    {
                        type: "text",
                        text: nodeVersion,
                    },
                ],
            };
        },
    );

    registerGetSearchcraftStatus(server);
    registerGetPrelimSearchData(server);
    registerGetSearchResults(server);

    return server;
}
