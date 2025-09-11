import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile, access, constants } from "node:fs/promises";
import { resolve, extname } from "node:path";
import {
    createErrorResponse,
    debugLog,
    makeSearchcraftRequest,
} from "../../helpers.js";
import { CreateIndexFromJsonSchema } from "../schemas.js";
import { analyzeJsonStructure } from "./json-analyzer.js";

export const registerCreateIndexFromJson = (server: McpServer) => {
    /**
     * Tool: create_index_from_json
     * Complete workflow: fetch/read JSON, analyze structure, generate schema, create index, and add documents
     */
    server.tool(
        "create_index_from_json",
        "Complete workflow to create a Searchcraft index from JSON data. Fetches JSON from URL or file, analyzes structure, generates schema, creates the index, and adds all the JSON data as documents to the index in one step.",
        {
            request: CreateIndexFromJsonSchema.describe(
                "Complete request to create index from JSON source"
            ),
        },
        async ({ request }) => {
            debugLog("[Tool Call] create_index_from_json");
            try {
                const {
                    source,
                    path,
                    index_name,
                    sample_size = 10,
                    search_fields,
                    weight_multipliers,
                    language,
                    auto_commit_delay,
                    exclude_stop_words,
                    time_decay_field,
                    override_if_exists = false,
                } = request;

                // Validate environment
                const endpointUrl = process.env.ENDPOINT_URL;
                const adminKey = process.env.ADMIN_KEY;

                if (!endpointUrl) {
                    return createErrorResponse("ENDPOINT_URL environment variable is required");
                }
                if (!adminKey) {
                    return createErrorResponse("ADMIN_KEY environment variable is required");
                }

                // Step 1: Fetch/Read JSON data
                debugLog(`Step 1: Fetching JSON from ${source}: ${path}`);
                let jsonData: any;
                let sourceInfo: any = {};

                if (source === "url") {
                    // Validate URL
                    let url: URL;
                    try {
                        url = new URL(path);
                    } catch {
                        return createErrorResponse("Invalid URL format provided");
                    }

                    if (!["http:", "https:"].includes(url.protocol)) {
                        return createErrorResponse("Only HTTP and HTTPS URLs are supported");
                    }

                    // Fetch from URL
                    const response = await fetch(path, {
                        headers: {
                            "Accept": "application/json",
                            "User-Agent": "Searchcraft-MCP-Server/1.0",
                        },
                        signal: AbortSignal.timeout(30000),
                    });

                    if (!response.ok) {
                        return createErrorResponse(
                            `Failed to fetch URL: ${response.status} ${response.statusText}`
                        );
                    }

                    const jsonText = await response.text();
                    jsonData = JSON.parse(jsonText);
                    sourceInfo = {
                        type: "url",
                        url: path,
                        content_type: response.headers.get("content-type"),
                        response_size: jsonText.length,
                    };

                } else if (source === "file") {
                    // Validate and read file
                    const filePath = resolve(path);

                    if (filePath.includes("..") || filePath.includes("~")) {
                        return createErrorResponse("File path contains potentially unsafe characters");
                    }

                    try {
                        await access(filePath, constants.R_OK);
                    } catch {
                        return createErrorResponse(`File not found or not readable: ${path}`);
                    }

                    const fileContent = await readFile(filePath, "utf-8");
                    const ext = extname(filePath).toLowerCase();

                    // Handle JSONL/NDJSON files
                    if ([".jsonl", ".ndjson"].includes(ext)) {
                        const lines = fileContent.trim().split("\n");
                        jsonData = lines
                            .filter(line => line.trim().length > 0)
                            .map(line => JSON.parse(line));
                    } else {
                        jsonData = JSON.parse(fileContent);
                    }

                    sourceInfo = {
                        type: "file",
                        path: path,
                        resolved_path: filePath,
                        file_size: fileContent.length,
                        file_extension: ext,
                    };
                }

                // Step 2: Analyze JSON structure
                debugLog("Step 2: Analyzing JSON structure");
                const analysis = analyzeJsonStructure(jsonData, sample_size);

                // Step 3: Generate Searchcraft schema
                debugLog("Step 3: Generating Searchcraft schema");
                const fields: Record<string, any> = {};

                for (const [fieldName, fieldAnalysis] of Object.entries(analysis.fields)) {
                    if (fieldName.includes(".")) continue; // Skip nested fields

                    const fieldConfig: any = {
                        type: fieldAnalysis.searchcraft_type,
                        stored: fieldAnalysis.suggested_config.stored,
                    };

                    if (fieldAnalysis.is_required) fieldConfig.required = true;
                    if (!fieldAnalysis.suggested_config.indexed) fieldConfig.indexed = false;
                    if (fieldAnalysis.suggested_config.fast) fieldConfig.fast = true;
                    if (fieldAnalysis.suggested_config.multi) fieldConfig.multi = true;

                    fields[fieldName] = fieldConfig;
                }

                // Determine search fields and weights
                const finalSearchFields = search_fields || analysis.suggested_search_fields.filter(
                    fieldName => fields[fieldName]?.type === "text"
                );

                const finalWeightMultipliers = weight_multipliers ||
                    Object.fromEntries(
                        Object.entries(analysis.suggested_weight_multipliers)
                            .filter(([fieldName]) => finalSearchFields.includes(fieldName))
                    );

                // Build schema
                const schema: any = {
                    name: index_name,
                    search_fields: finalSearchFields,
                    fields,
                };

                if (Object.keys(finalWeightMultipliers).length > 0) {
                    schema.weight_multipliers = finalWeightMultipliers;
                }
                if (language) schema.language = language;
                if (auto_commit_delay !== undefined) schema.auto_commit_delay = auto_commit_delay;
                if (exclude_stop_words !== undefined) schema.exclude_stop_words = exclude_stop_words;
                if (time_decay_field) schema.time_decay_field = time_decay_field;

                // Step 4: Create index
                debugLog("Step 4: Creating Searchcraft index");
                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index`;
                const createRequest = {
                    override_if_exists,
                    index: schema,
                };

                const createResponse = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    adminKey,
                    createRequest
                );

                // Step 5: Add documents to the index
                debugLog("Step 5: Adding documents to the index");
                let documentsToAdd: any[];

                // Ensure jsonData is an array of documents
                if (Array.isArray(jsonData)) {
                    documentsToAdd = jsonData;
                } else {
                    // If it's a single object, wrap it in an array
                    documentsToAdd = [jsonData];
                }

                const documentsEndpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents`;
                const addDocumentsResponse = await makeSearchcraftRequest(
                    documentsEndpoint,
                    "POST",
                    adminKey,
                    documentsToAdd
                );

                // Step 6: Commit the documents
                debugLog("Step 6: Committing documents to the index");
                const commitEndpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/commit`;
                const commitResponse = await makeSearchcraftRequest(
                    commitEndpoint,
                    "POST",
                    adminKey,
                    {}
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://index-created-from-json/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify({
                                    success: true,
                                    created_at: new Date().toISOString(),
                                    source: sourceInfo,
                                    analysis_summary: {
                                        total_objects_analyzed: analysis.total_objects_analyzed,
                                        total_fields_found: Object.keys(analysis.fields).length,
                                        fields_included: Object.keys(fields).length,
                                        search_fields: finalSearchFields,
                                        weight_multipliers: finalWeightMultipliers,
                                    },
                                    created_index: {
                                        name: index_name,
                                        schema,
                                    },
                                    documents_added: {
                                        count: documentsToAdd.length,
                                        sample: documentsToAdd.slice(0, 3), // Show first 3 documents as sample
                                    },
                                    searchcraft_responses: {
                                        create_index: createResponse,
                                        add_documents: addDocumentsResponse,
                                        commit: commitResponse,
                                    },
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
                    `Failed to create index from JSON: ${errorMessage}`
                );
            }
        },
    );
};
