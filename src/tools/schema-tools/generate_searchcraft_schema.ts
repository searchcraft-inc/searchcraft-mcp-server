import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    createErrorResponse,
    debugLog,
} from "../../helpers.js";
import { GenerateSchemaRequestSchema, IndexFieldSchema } from "../schemas.js";
import type { JsonStructureAnalysis } from "./json-analyzer.js";

export const registerGenerateSearchcraftSchema = (server: McpServer) => {
    /**
     * Tool: generate_searchcraft_schema
     * Converts analyzed JSON structure into a complete Searchcraft index schema
     */
    server.tool(
        "generate_searchcraft_schema",
        "Generate a complete Searchcraft index schema from analyzed JSON structure, with customizable options for search fields, weights, and other index settings",
        {
            request: GenerateSchemaRequestSchema.describe(
                "Schema generation request with JSON analysis and customization options"
            ),
        },
        async ({ request }) => {
            debugLog("[Tool Call] generate_searchcraft_schema");
            try {
                const {
                    json_structure,
                    index_name,
                    search_fields,
                    weight_multipliers,
                    language,
                    auto_commit_delay,
                    exclude_stop_words,
                    time_decay_field,
                } = request;

                // Validate index name
                if (!isValidIndexName(index_name)) {
                    return createErrorResponse(
                        "Index name must be URL-friendly (no spaces or special characters except hyphens and underscores)"
                    );
                }

                // Generate field definitions
                const fields: Record<string, any> = {};

                for (const [fieldName, analysis] of Object.entries(json_structure.fields)) {
                    // Skip nested object fields for now (they would need flattening)
                    if (fieldName.includes(".")) {
                        debugLog(`Skipping nested field: ${fieldName}`);
                        continue;
                    }

                    const fieldConfig: any = {
                        type: analysis.searchcraft_type,
                        stored: analysis.suggested_config.stored,
                    };

                    // Add optional properties only if they differ from defaults
                    if (analysis.is_required) {
                        fieldConfig.required = true;
                    }

                    if (!analysis.suggested_config.indexed) {
                        fieldConfig.indexed = false;
                    }

                    if (analysis.suggested_config.fast) {
                        fieldConfig.fast = true;
                    }

                    if (analysis.suggested_config.multi) {
                        fieldConfig.multi = true;
                    }

                    // Validate field configuration
                    try {
                        IndexFieldSchema.parse(fieldConfig);
                        fields[fieldName] = fieldConfig;
                    } catch (validationError) {
                        debugLog(`Field validation failed for ${fieldName}: ${validationError}`);
                        // Skip invalid fields rather than failing entirely
                        continue;
                    }
                }

                if (Object.keys(fields).length === 0) {
                    return createErrorResponse("No valid fields could be generated from the JSON structure");
                }

                // Determine search fields
                const finalSearchFields = search_fields || json_structure.suggested_search_fields;

                // Validate that search fields exist and are text fields
                const validSearchFields = finalSearchFields.filter(fieldName => {
                    const field = fields[fieldName];
                    if (!field) {
                        debugLog(`Search field '${fieldName}' not found in generated fields`);
                        return false;
                    }
                    if (field.type !== "text") {
                        debugLog(`Search field '${fieldName}' is not a text field (type: ${field.type})`);
                        return false;
                    }
                    return true;
                });

                if (validSearchFields.length === 0) {
                    return createErrorResponse("No valid text fields available for search_fields");
                }

                // Determine weight multipliers
                const finalWeightMultipliers = weight_multipliers || json_structure.suggested_weight_multipliers;

                // Validate weight multipliers reference existing search fields
                const validWeightMultipliers: Record<string, number> = {};
                for (const [fieldName, weight] of Object.entries(finalWeightMultipliers)) {
                    if (validSearchFields.includes(fieldName)) {
                        validWeightMultipliers[fieldName] = weight;
                    } else {
                        debugLog(`Weight multiplier for '${fieldName}' ignored - not in search_fields`);
                    }
                }

                // Validate time decay field if specified
                if (time_decay_field) {
                    const timeField = fields[time_decay_field];
                    if (!timeField) {
                        return createErrorResponse(`Time decay field '${time_decay_field}' not found in schema`);
                    }
                    if (timeField.type !== "datetime") {
                        return createErrorResponse(`Time decay field '${time_decay_field}' must be a datetime field`);
                    }
                    if (!timeField.fast || !timeField.indexed) {
                        debugLog(`Updating time decay field '${time_decay_field}' to be fast and indexed`);
                        fields[time_decay_field].fast = true;
                        fields[time_decay_field].indexed = true;
                    }
                }

                // Build the complete schema
                const schema: any = {
                    name: index_name,
                    search_fields: validSearchFields,
                    fields,
                };

                // Add optional properties
                if (Object.keys(validWeightMultipliers).length > 0) {
                    schema.weight_multipliers = validWeightMultipliers;
                }

                if (language) {
                    schema.language = language;
                }

                if (auto_commit_delay !== undefined) {
                    schema.auto_commit_delay = auto_commit_delay;
                }

                if (exclude_stop_words !== undefined) {
                    schema.exclude_stop_words = exclude_stop_words;
                }

                if (time_decay_field) {
                    schema.time_decay_field = time_decay_field;
                }

                // Wrap in the format expected by Searchcraft API
                const indexSchema = {
                    index: schema,
                };

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://generated-schema/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify({
                                    generated_at: new Date().toISOString(),
                                    source_analysis: {
                                        total_objects_analyzed: json_structure.total_objects_analyzed,
                                        total_fields_found: Object.keys(json_structure.fields).length,
                                        fields_included: Object.keys(fields).length,
                                        search_fields_count: validSearchFields.length,
                                    },
                                    searchcraft_schema: indexSchema,
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
                    `Failed to generate Searchcraft schema: ${errorMessage}`
                );
            }
        },
    );
};

/**
 * Validate that index name is URL-friendly
 */
function isValidIndexName(name: string): boolean {
    // Allow letters, numbers, hyphens, and underscores
    // Must start with a letter or number
    // Must not be empty or too long
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
    return pattern.test(name) && name.length > 0 && name.length <= 100;
}
