import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile, access, constants } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
} from "../../helpers.js";
import { analyzeJsonStructure } from "./json-analyzer.js";

export const registerAnalyzeJsonFromFile = (server: McpServer) => {
    /**
     * Tool: analyze_json_from_file
     * Reads JSON from a local file and analyzes its structure for Searchcraft schema generation
     */
    server.tool(
        "analyze_json_from_file",
        "Read JSON data from a local file and analyze its structure to understand field types and patterns for Searchcraft index schema generation",
        {
            source: z.literal("file").describe("Source type - must be 'file'"),
            path: z.string().describe("Local file path to the JSON data"),
            sample_size: z.number().int().positive().optional().default(10).describe("For arrays, number of items to analyze (default: 10)"),
        },
        async ({ source, path, sample_size = 10 }) => {
            debugLog("[Tool Call] analyze_json_from_file");
            try {
                if (source !== "file") {
                    return createErrorResponse("Source type must be 'file' for this tool");
                }

                // Resolve and validate file path
                const filePath = resolve(path);

                // Security check - ensure file path doesn't contain dangerous patterns
                if (filePath.includes("..") || filePath.includes("~")) {
                    return createErrorResponse("File path contains potentially unsafe characters");
                }

                // Check if file exists and is readable
                try {
                    await access(filePath, constants.R_OK);
                } catch {
                    return createErrorResponse(`File not found or not readable: ${path}`);
                }

                // Validate file extension
                const ext = extname(filePath).toLowerCase();
                if (![".json", ".jsonl", ".ndjson"].includes(ext)) {
                    debugLog(`Warning: File extension ${ext} is not typically JSON`);
                }

                debugLog(`Reading JSON from file: ${filePath}`);

                // Read file content
                let fileContent: string;
                try {
                    fileContent = await readFile(filePath, "utf-8");
                } catch (readError) {
                    return createErrorResponse(
                        `Failed to read file: ${readError instanceof Error ? readError.message : "Read error"}`
                    );
                }

                if (fileContent.trim().length === 0) {
                    return createErrorResponse("File is empty");
                }

                // Parse JSON
                let jsonData: any;
                try {
                    // Handle JSONL/NDJSON files (one JSON object per line)
                    if ([".jsonl", ".ndjson"].includes(ext)) {
                        const lines = fileContent.trim().split("\n");
                        jsonData = lines
                            .filter(line => line.trim().length > 0)
                            .map(line => JSON.parse(line));

                        if (jsonData.length === 0) {
                            return createErrorResponse("No valid JSON objects found in JSONL file");
                        }

                        // For JSONL, we'll analyze as an array of objects
                        debugLog(`Parsed ${jsonData.length} JSON objects from JSONL file`);
                    } else {
                        jsonData = JSON.parse(fileContent);
                    }
                } catch (parseError) {
                    return createErrorResponse(
                        `Invalid JSON in file: ${parseError instanceof Error ? parseError.message : "Parse error"}`
                    );
                }

                // Analyze the JSON structure
                const analysis = analyzeJsonStructure(jsonData, sample_size);

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://json-analysis-file/${encodeURIComponent(path)}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify({
                                    source: {
                                        type: "file",
                                        path: path,
                                        resolved_path: filePath,
                                        analyzed_at: new Date().toISOString(),
                                        file_size: fileContent.length,
                                        file_extension: ext,
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
                    `Failed to analyze JSON from file: ${errorMessage}`
                );
            }
        },
    );
};
