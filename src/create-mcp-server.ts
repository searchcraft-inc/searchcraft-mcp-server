import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
    registerGetSearchcraftStatus,
    registerGetSearchIndexSchema,
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

    registerGetSearchcraftStatus(server);
    registerGetSearchIndexSchema(server);
    registerGetSearchResults(server);

    return server;
}
