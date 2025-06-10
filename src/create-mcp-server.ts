import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import * as RegisterTools from "./tools/index.js";

export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: "searchcraft-mcp-server",
        version: "0.0.1",
        capabilities: {
            resources: {},
            tools: {},
        },
    });

    for (const functionName of Object.keys(RegisterTools)) {
        // @ts-ignore
        RegisterTools[functionName](server);
    }

    return server;
}
