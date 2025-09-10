import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./create-mcp-server.js";

async function main() {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);

    process.on('SIGINT', async () => {
        await server.close();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await server.close();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
});
