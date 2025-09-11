import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
} from "../../helpers.js";
import { analyzeJsonStructure } from "./json-analyzer.js";

export const registerAnalyzeJsonFromUrl = (server: McpServer) => {
    /**
     * Tool: analyze_json_from_url
     * Fetches JSON from a URL and analyzes its structure for Searchcraft schema generation
     */
    server.tool(
        "analyze_json_from_url",
        "Fetch JSON data from a URL and analyze its structure to understand field types and patterns for Searchcraft index schema generation",
        {
            source: z.literal("url").describe("Source type - must be 'url'"),
            path: z.string().url().describe("URL to fetch JSON data from"),
            sample_size: z.number().int().positive().optional().default(10).describe("For arrays, number of items to analyze (default: 10)"),
        },
        async ({ source, path, sample_size = 10 }) => {
            debugLog("[Tool Call] analyze_json_from_url");
            try {
                if (source !== "url") {
                    return createErrorResponse("Source type must be 'url' for this tool");
                }

                // Validate URL format
                let url: URL;
                try {
                    url = new URL(path);
                } catch {
                    return createErrorResponse("Invalid URL format provided");
                }

                // Security check - only allow HTTP/HTTPS
                if (!["http:", "https:"].includes(url.protocol)) {
                    return createErrorResponse("Only HTTP and HTTPS URLs are supported");
                }

                debugLog(`Fetching JSON from URL: ${path}`);

                // Fetch JSON data
                const response = await fetch(path, {
                    headers: {
                        "Accept": "application/json",
                        "User-Agent": "Searchcraft-MCP-Server/1.0",
                    },
                    // Add timeout
                    signal: AbortSignal.timeout(30000), // 30 second timeout
                });

                if (!response.ok) {
                    return createErrorResponse(
                        `Failed to fetch URL: ${response.status} ${response.statusText}`
                    );
                }

                const contentType = response.headers.get("content-type");
                if (!contentType?.includes("application/json")) {
                    debugLog(`Warning: Content-Type is ${contentType}, expected application/json`);
                }

                const jsonText = await response.text();
                let jsonData: any;

                try {
                    jsonData = JSON.parse(jsonText);
                } catch (parseError) {
                    return createErrorResponse(
                        `Invalid JSON received from URL: ${parseError instanceof Error ? parseError.message : "Parse error"}`
                    );
                }

                // Analyze the JSON structure
                const analysis = analyzeJsonStructure(jsonData, sample_size);

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://json-analysis-url/${encodeURIComponent(path)}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify({
                                    source: {
                                        type: "url",
                                        url: path,
                                        fetched_at: new Date().toISOString(),
                                        content_type: contentType,
                                        response_size: jsonText.length,
                                    },
                                    analysis,
                                }, null, 2),
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
                    `Failed to analyze JSON from URL: ${errorMessage}`
                );
            }
        },
    );
};
