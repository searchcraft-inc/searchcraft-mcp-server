import { constants, access, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
    prepareDocumentsForSearchcraft,
} from "../../helpers.js";
import { CreateIndexFromJsonSchema } from "../schemas.js";
import {
    type FieldAnalysis,
    type JsonStructureAnalysis,
    analyzeJsonStructure,
    extractContentArray,
    flattenDocumentForSearchcraft,
} from "./json-analyzer.js";

// Type definitions for Searchcraft API
interface SearchcraftFieldConfig {
    type: "text" | "datetime" | "bool" | "f64" | "u64" | "i64" | "facet";
    required?: boolean;
    stored?: boolean;
    indexed?: boolean;
    fast?: boolean;
    multi?: boolean;
    [key: string]: unknown;
}

interface SearchcraftIndexSchema {
    name: string;
    search_fields: string[];
    fields: Record<string, SearchcraftFieldConfig>;
    weight_multipliers?: Record<string, number>;
    language?: string;
    auto_commit_delay?: number;
    exclude_stop_words?: boolean;
    time_decay_field?: string;
}

interface SearchcraftApiResponse {
    [key: string]: unknown;
}

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
                "Complete request to create index from JSON source",
            ),
        },
        async ({ request }) => {
            debugLog("[Tool Call] create_index_from_json");
            try {
                const {
                    source,
                    path,
                    index_name,
                    sample_size = 50,
                    search_fields: _search_fields, // Prefixed with _ to indicate intentionally unused
                    weight_multipliers,
                    language,
                    auto_commit_delay,
                    exclude_stop_words,
                    time_decay_field,
                    override_if_exists = false,
                } = request;

                // Validate environment
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                // Step 1: Fetch/Read JSON data
                debugLog(`Step 1: Fetching JSON from ${source}: ${path}`);
                let jsonData: unknown;
                let sourceInfo: unknown = {};

                try {
                    if (source === "url") {
                        // Validate URL
                        let url: URL;
                        try {
                            url = new URL(path);
                        } catch {
                            return createErrorResponse(
                                "Invalid URL format provided",
                            );
                        }

                        if (!["http:", "https:"].includes(url.protocol)) {
                            return createErrorResponse(
                                "Only HTTP and HTTPS URLs are supported",
                            );
                        }

                        // Fetch from URL
                        const response = await fetch(path, {
                            headers: {
                                Accept: "application/json",
                                "User-Agent": "Searchcraft-MCP-Server/1.0",
                            },
                            signal: AbortSignal.timeout(30000),
                        });

                        if (!response.ok) {
                            return createErrorResponse(
                                `Failed to fetch URL: ${response.status} ${response.statusText}`,
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
                            return createErrorResponse(
                                "File path contains potentially unsafe characters",
                            );
                        }

                        try {
                            await access(filePath, constants.R_OK);
                        } catch {
                            return createErrorResponse(
                                `File not found or not readable: ${path}`,
                            );
                        }

                        const fileContent = await readFile(filePath, "utf-8");
                        const ext = extname(filePath).toLowerCase();

                        // Handle JSONL/NDJSON files
                        if ([".jsonl", ".ndjson"].includes(ext)) {
                            const lines = fileContent.trim().split("\n");
                            jsonData = lines
                                .filter((line) => line.trim().length > 0)
                                .map((line) => JSON.parse(line));
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
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred";
                    throw new Error(
                        `Failed to fetch/read JSON data: ${errorMessage}`,
                    );
                }

                // Step 2: Analyze JSON structure (using flattened documents)
                debugLog("Step 2: Analyzing JSON structure");
                let analysis: JsonStructureAnalysis;
                try {
                    // First extract the raw documents
                    const rawDocuments = extractContentArray(jsonData);

                    // Flatten a sample of documents for analysis
                    const sampleDocuments = rawDocuments.slice(0, sample_size);
                    const flattenedSample = sampleDocuments.map((doc) =>
                        flattenDocumentForSearchcraft(doc),
                    );

                    // Create a synthetic JSON structure with the flattened documents
                    const flattenedJsonData = { documents: flattenedSample };

                    analysis = analyzeJsonStructure(
                        flattenedJsonData,
                        sample_size,
                    );
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred";
                    throw new Error(
                        `Failed to analyze JSON structure: ${errorMessage}`,
                    );
                }

                // Step 3: Generate Searchcraft schema
                debugLog("Step 3: Generating Searchcraft schema");
                let schema: SearchcraftIndexSchema;
                const fields: Record<string, SearchcraftFieldConfig> = {};
                let finalSearchFields: string[] = [];
                let finalWeightMultipliers: Record<string, number> = {};

                try {
                    for (const [fieldName, fieldAnalysis] of Object.entries(
                        analysis.fields,
                    )) {
                        // Include all fields, including flattened ones with dots
                        // This ensures schema matches the flattened document structure

                        const fieldInfo = fieldAnalysis as FieldAnalysis;
                        const fieldConfig: SearchcraftFieldConfig = {
                            type: fieldInfo.searchcraft_type,
                            stored: fieldInfo.suggested_config.stored,
                        };

                        if (fieldInfo.is_required) fieldConfig.required = true;
                        if (!fieldInfo.suggested_config.indexed)
                            fieldConfig.indexed = false;
                        if (fieldInfo.suggested_config.fast)
                            fieldConfig.fast = true;
                        if (fieldInfo.suggested_config.multi)
                            fieldConfig.multi = true;

                        fields[fieldName] = fieldConfig;
                    }

                    // Determine weight multipliers first
                    finalWeightMultipliers =
                        weight_multipliers ||
                        Object.fromEntries(
                            Object.entries(
                                analysis.suggested_weight_multipliers,
                            ).filter(
                                ([fieldName]) =>
                                    fields[fieldName]?.type === "text",
                            ),
                        );

                    // Search fields are always derived from weight_multipliers (search_fields parameter is ignored)
                    finalSearchFields = Object.keys(finalWeightMultipliers);

                    // Build schema
                    schema = {
                        name: index_name,
                        search_fields: finalSearchFields,
                        fields,
                    };

                    if (Object.keys(finalWeightMultipliers).length > 0) {
                        schema.weight_multipliers = finalWeightMultipliers;
                    }
                    if (language) schema.language = language;
                    if (auto_commit_delay !== undefined)
                        schema.auto_commit_delay = auto_commit_delay;
                    if (exclude_stop_words !== undefined)
                        schema.exclude_stop_words = exclude_stop_words;
                    if (time_decay_field)
                        schema.time_decay_field = time_decay_field;

                    // Debug: Log the schema being created
                    //debugLog(`Generated schema: ${JSON.stringify(schema, null, 2)}`);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred";
                    throw new Error(
                        `Failed to generate Searchcraft schema: ${errorMessage}`,
                    );
                }

                // Step 4: Create index
                debugLog("Step 4: Creating Searchcraft index");
                let createResponse: SearchcraftApiResponse;
                try {
                    const endpoint = `${endpointUrl.replace(/\/$/, "")}/index`;
                    const createRequest = {
                        override_if_exists,
                        index: schema,
                    };

                    createResponse = await makeSearchcraftRequest(
                        endpoint,
                        "POST",
                        apiKey,
                        createRequest,
                    );

                    //debugLog(`Index created successfully. Response: ${JSON.stringify(createResponse, null, 2)}`);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred";
                    throw new Error(
                        `Failed to create Searchcraft index: ${errorMessage}`,
                    );
                }

                // Step 5: Add documents to the index
                debugLog("Step 5: Adding documents to the index");
                let documentsToAdd: Record<string, unknown>[] = [];
                let addDocumentsResponse: SearchcraftApiResponse;

                try {
                    // Extract the best array using the same logic as analyzeJsonStructure
                    const rawDocuments = extractContentArray(jsonData);

                    // Flatten documents to remove nested objects that Searchcraft can't handle
                    const flattenedDocuments = rawDocuments.map((doc) =>
                        flattenDocumentForSearchcraft(doc),
                    );

                    // Prepare documents for Searchcraft
                    documentsToAdd = prepareDocumentsForSearchcraft(
                        flattenedDocuments,
                        fields,
                    );

                    const documentsEndpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/documents`;

                    addDocumentsResponse = await makeSearchcraftRequest(
                        documentsEndpoint,
                        "POST",
                        apiKey,
                        documentsToAdd,
                    );

                    //debugLog(`Documents added successfully. Response: ${JSON.stringify(addDocumentsResponse, null, 2)}`);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred";
                    throw new Error(
                        `Step 5 - Failed to add documents to index: ${errorMessage}`,
                    );
                }

                // Step 6: Commit the documents
                debugLog("Step 6: Committing documents to the index");
                let commitResponse: SearchcraftApiResponse;
                try {
                    const commitEndpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/commit`;
                    commitResponse = await makeSearchcraftRequest(
                        commitEndpoint,
                        "POST",
                        apiKey,
                        {},
                    );
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred";
                    throw new Error(
                        `Failed to commit documents to index: ${errorMessage}`,
                    );
                }

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://index-created-from-json/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        created_at: new Date().toISOString(),
                                        source: sourceInfo,
                                        analysis_summary: {
                                            total_objects_analyzed:
                                                analysis.total_objects_analyzed,
                                            total_fields_found: Object.keys(
                                                analysis.fields,
                                            ).length,
                                            fields_included:
                                                Object.keys(fields).length,
                                            search_fields: finalSearchFields,
                                            weight_multipliers:
                                                finalWeightMultipliers,
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
                                    },
                                    null,
                                    2,
                                ),
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
                    `Failed to create index from JSON: ${errorMessage}`,
                );
            }
        },
    );
};
