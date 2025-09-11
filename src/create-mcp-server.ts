import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import * as RegisterTools from "./tools/index.js";

declare const __PACKAGE_VERSION__: string;

export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: "searchcraft-mcp-server",
        version: __PACKAGE_VERSION__,
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
