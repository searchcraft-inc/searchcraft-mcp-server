import { debugLog } from "../../helpers.js";

export interface FieldAnalysis {
    type: "string" | "number" | "boolean" | "array" | "object" | "null";
    searchcraft_type: "text" | "datetime" | "bool" | "f64" | "u64" | "facet";
    is_array: boolean;
    sample_values: any[];
    is_required: boolean;
    suggested_config: {
        stored: boolean;
        indexed: boolean;
        fast: boolean;
        multi: boolean;
    };
}

export interface JsonStructureAnalysis {
    total_objects_analyzed: number;
    fields: Record<string, FieldAnalysis>;
    suggested_search_fields: string[];
    suggested_weight_multipliers: Record<string, number>;
}

/**
 * Recursively finds all arrays in an object with their paths and depths
 */
export function findArraysInObject(obj: any, path: string = "", depth: number = 0, maxDepth: number = 3): Array<{path: string, array: any[], depth: number, length: number}> {
    const arrays: Array<{path: string, array: any[], depth: number, length: number}> = [];

    if (depth > maxDepth) return arrays;

    if (typeof obj === "object" && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;

            if (Array.isArray(value)) {
                arrays.push({
                    path: currentPath,
                    array: value,
                    depth,
                    length: value.length
                });
            } else if (typeof value === "object" && value !== null) {
                arrays.push(...findArraysInObject(value, currentPath, depth + 1, maxDepth));
            }
        }
    }

    return arrays;
}

/**
 * Flattens nested objects and removes complex nested structures that Searchcraft can't handle
 */
export function flattenDocumentForSearchcraft(doc: any): any {
    const flattened: any = {};

    function flattenObject(obj: any, prefix: string = ""): void {
        for (const [key, value] of Object.entries(obj)) {
            const fieldName = prefix ? `${prefix}.${key}` : key;

            if (value === null || value === undefined) {
                // Skip null/undefined values to avoid validation errors
                continue;
            } else if (Array.isArray(value)) {
                // Handle arrays
                if (value.length > 0) {
                    const firstItem = value[0];
                    if (typeof firstItem === "object" && firstItem !== null) {
                        // Array of objects - skip for now
                        // Could be flattened in the future if needed
                        continue;
                    } else {
                        // Array of primitives - clean and keep, with optional type conversion
                        const cleanArray = value.filter(v => v !== null && v !== undefined);
                        if (cleanArray.length > 0) {
                            // Keep array as-is - we'll handle f64 conversion at JSON serialization time
                            flattened[fieldName] = cleanArray;
                        }
                    }
                } else {
                    // Empty array - skip
                    continue;
                }
            } else if (typeof value === "object") {
                // Nested object - flatten it
                flattenObject(value, fieldName);
            } else {
                // Primitive value - validate and apply optional type conversion based on schema
                if (typeof value === "number") {
                    // Ensure numbers are valid (not NaN or Infinity)
                    if (isFinite(value) && !isNaN(value)) {
                        // Keep the value as-is - we'll handle f64 conversion at JSON serialization time
                        flattened[fieldName] = value;
                    }
                } else if (typeof value === "string") {
                    // Keep non-empty strings
                    if (value.trim().length > 0) {
                        flattened[fieldName] = value;
                    }
                } else if (typeof value === "boolean") {
                    // Keep boolean values
                    flattened[fieldName] = value;
                } else {
                    // For other types, convert to string if possible
                    const stringValue = String(value);
                    if (stringValue && stringValue !== "undefined" && stringValue !== "null") {
                        flattened[fieldName] = stringValue;
                    }
                }
            }
        }
    }

    flattenObject(doc);
    return flattened;
}


/**
 * Extracts the best array from JSON data using the same logic as analyzeJsonStructure
 */
export function extractContentArray(jsonData: any): any[] {
    if (Array.isArray(jsonData)) {
        return jsonData;
    } else if (typeof jsonData === "object" && jsonData !== null) {
        // Find all arrays in the object, prioritizing those closest to root and largest in size
        const foundArrays = findArraysInObject(jsonData);

        if (foundArrays.length > 0) {
            // Sort by depth (ascending) then by length (descending)
            foundArrays.sort((a, b) => {
                if (a.depth !== b.depth) return a.depth - b.depth;
                return b.length - a.length;
            });

            const bestLikelyArray = foundArrays[0];

            return bestLikelyArray.array;
        } else {
            // Single object
            return [jsonData];
        }
    } else {
        throw new Error("JSON data must be an object or array of objects");
    }
}

/**
 * Analyzes JSON structure and provides recommendations for Searchcraft schema
 */
export function analyzeJsonStructure(jsonData: any, sampleSize: number = 10): JsonStructureAnalysis {
    //debugLog(`Starting JSON structure analysis with sample size: ${sampleSize}`);

    // Extract the best array and take a sample for analysis
    const allObjects = extractContentArray(jsonData);
    const objects = allObjects.slice(0, sampleSize);

    if (objects.length === 0) {
        throw new Error("No objects to analyze");
    }

    //debugLog(`Analyzing ${objects.length} objects`);

    // Collect all field information
    const fieldStats: Record<string, {
        types: Set<string>;
        values: any[];
        occurrences: number;
        isArrayField: boolean;
    }> = {};

    // Analyze each object
    for (const obj of objects) {
        if (typeof obj !== "object" || obj === null) {
            continue;
        }

        analyzeObject(obj, fieldStats, "");
    }

    // Convert field stats to analysis
    const fields: Record<string, FieldAnalysis> = {};
    const textFields: string[] = [];
    const weightMultipliers: Record<string, number> = {};

    for (const [fieldName, stats] of Object.entries(fieldStats)) {
        const analysis = analyzeField(fieldName, stats);
        fields[fieldName] = analysis;

        // Collect text fields for search_fields
        if (analysis.searchcraft_type === "text") {
            textFields.push(fieldName);

            // Suggest weight multipliers based on field name patterns
            const weight = suggestWeight(fieldName);
            if (weight !== 1.0) {
                weightMultipliers[fieldName] = weight;
            }
        }
    }

    return {
        total_objects_analyzed: objects.length,
        fields,
        suggested_search_fields: textFields,
        suggested_weight_multipliers: weightMultipliers,
    };
}

/**
 * Recursively analyze an object and collect field statistics
 */
function analyzeObject(obj: any, fieldStats: Record<string, any>, prefix: string = ""): void {
    for (const [key, value] of Object.entries(obj)) {
        const fieldName = prefix ? `${prefix}.${key}` : key;

        if (!fieldStats[fieldName]) {
            fieldStats[fieldName] = {
                types: new Set<string>(),
                values: [],
                occurrences: 0,
                isArrayField: false,
            };
        }

        fieldStats[fieldName].occurrences++;

        if (Array.isArray(value)) {
            fieldStats[fieldName].isArrayField = true;
            fieldStats[fieldName].types.add("array");

            // Analyze array elements
            for (const item of value.slice(0, 5)) { // Sample first 5 items
                if (item !== null && item !== undefined) {
                    fieldStats[fieldName].types.add(typeof item);
                    fieldStats[fieldName].values.push(item);
                }
            }
        } else if (value === null) {
            fieldStats[fieldName].types.add("null");
        } else if (typeof value === "object") {
            fieldStats[fieldName].types.add("object");
            // For nested objects, we could recursively analyze, but for now we'll treat as text
            fieldStats[fieldName].values.push(JSON.stringify(value));
        } else {
            fieldStats[fieldName].types.add(typeof value);
            fieldStats[fieldName].values.push(value);
        }
    }
}

/**
 * Analyze a single field and determine its Searchcraft configuration
 */
function analyzeField(fieldName: string, stats: any): FieldAnalysis {
    const types = Array.from(stats.types);

    // Only make "id" and title-related fields required
    const requiredFieldPatterns = ["id", "title", "name", "headline", "heading"];
    const isRequired = requiredFieldPatterns.some(pattern =>
        fieldName.toLowerCase().includes(pattern.toLowerCase())
    );

    const isArray = stats.isArrayField;

    // Determine primary type (excluding null)
    const nonNullTypes = types.filter(t => t !== "null");
    const primaryType: "string" | "number" | "boolean" | "array" | "object" | "null" =
        nonNullTypes.length > 0 ? nonNullTypes[0] as "string" | "number" | "boolean" | "array" | "object" : "null";

    // Determine Searchcraft type
    const searchcraftType = determineSearchcraftType(primaryType, stats.values, fieldName);

    // Suggest configuration
    const suggestedConfig = suggestFieldConfig(searchcraftType, fieldName, isArray);

    return {
        type: primaryType,
        searchcraft_type: searchcraftType,
        is_array: isArray,
        sample_values: stats.values.slice(0, 5), // First 5 sample values
        is_required: isRequired,
        suggested_config: suggestedConfig,
    };
}

/**
 * Determine the appropriate Searchcraft field type
 */
function determineSearchcraftType(
    jsonType: string,
    sampleValues: any[],
    fieldName: string
): "text" | "datetime" | "bool" | "f64" | "u64" | "facet" {
    switch (jsonType) {
        case "boolean":
            return "bool";

        case "number":
            // Fields that commonly contain decimals should always be f64
            const decimalFieldPatterns = [
                "percentage", "percent", "rate", "ratio", "price", "cost", "amount",
                "discount", "height", "width", "depth", "discountPercentage",
                "dimension", "size", "length", "distance", "temperature", "lat", "lng",
                "latitude", "longitude", "coord"
            ];

            const isLikelyDecimalField = decimalFieldPatterns.some(pattern =>
                fieldName.toLowerCase().includes(pattern.toLowerCase())
            );

            if (isLikelyDecimalField) {
                return "f64";
            }

            // Check if all numbers are integers for other fields
            const allIntegers = sampleValues.every(v =>
                typeof v === "number" && Number.isInteger(v) && v >= 0
            );
            return allIntegers ? "u64" : "f64";

        case "string":
            // Check for date patterns
            if (isDateField(sampleValues, fieldName)) {
                return "datetime";
            }

            // Check for facet patterns (hierarchical categories)
            if (isFacetField(sampleValues, fieldName)) {
                return "facet";
            }

            return "text";

        default:
            return "text";
    }
}

/**
 * Check if field contains date values
 */
function isDateField(sampleValues: any[], fieldName: string): boolean {
    const dateFieldNames = ["date", "time", "created", "updated", "published", "modified"];
    const hasDateName = dateFieldNames.some(name =>
        fieldName.toLowerCase().includes(name)
    );

    if (!hasDateName) return false;

    // Check if values look like dates
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO 8601
        /^\d{10}$/, // Unix timestamp (10 digits)
        /^\d{13}$/, // Unix timestamp in milliseconds (13 digits)
    ];

    return sampleValues.some(value => {
        if (typeof value === "string") {
            return datePatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === "number") {
            // Check if it's a reasonable timestamp
            return value > 946684800 && value < 4102444800; // Between 2000 and 2100
        }
        return false;
    });
}

/**
 * Check if field contains facet-like values (hierarchical categories)
 */
function isFacetField(sampleValues: any[], fieldName: string): boolean {
    const facetFieldNames = ["category", "tag", "type", "section", "department"];
    const hasFacetName = facetFieldNames.some(name =>
        fieldName.toLowerCase().includes(name)
    );

    if (!hasFacetName) return false;

    // Check if values look like hierarchical paths
    return sampleValues.some(value =>
        typeof value === "string" && value.includes("/")
    );
}

/**
 * Suggest field configuration based on type and usage
 */
function suggestFieldConfig(
    searchcraftType: string,
    fieldName: string,
    isArray: boolean
): FieldAnalysis["suggested_config"] {
    const config = {
        stored: true, // Most fields should be stored for display
        indexed: true, // Most fields should be indexed
        fast: false, // Only specific types need fast fields
        multi: isArray, // Set multi if it's an array field
    };

    // Adjust based on field type
    switch (searchcraftType) {
        case "text":
        case "facet":
            config.fast = false; // Text and facet fields don't use fast
            break;

        case "datetime":
        case "f64":
        case "u64":
        case "bool":
            config.fast = true; // Numeric and date fields benefit from fast
            break;
    }

    // Define field name patterns for special handling
    const fieldPatterns = [
        {
            // ID fields - usually don't need to be searchable
            patterns: ["id"],
            config: { indexed: false, fast: false }
        },
        {
            // URL/Link fields - usually don't need to be searchable
            patterns: ["url", "link"],
            config: { indexed: false }
        },
        {
            // Media fields - usually don't need to be searchable
            patterns: ["image", "thumbnail", "photo", "video", "path", "poster"],
            config: { indexed: false }
        }
    ];

    const name = fieldName.toLowerCase();

    // Apply special configurations based on field name patterns
    for (const { patterns, config: patternConfig } of fieldPatterns) {
        if (patterns.some(pattern => name.includes(pattern))) {
            Object.assign(config, patternConfig);
            break; // Apply only the first matching pattern
        }
    }

    return config;
}

/**
 * Suggest weight multipliers based on field name patterns
 */
function suggestWeight(fieldName: string): number {
    const name = fieldName.toLowerCase();

    // Define field name patterns with their corresponding weights
    const weightPatterns = [
        {
            // Higher weight for title-like fields
            patterns: ["title", "name", "headline", "heading"],
            weight: 2.0
        },
        {
            // Lower weight for description/content fields
            patterns: ["description", "content", "body", "overview"],
            weight: 0.5
        },
        {
            // Lower weight for summary/excerpt fields
            patterns: ["summary", "excerpt", "snippet", "subhead", "subheadline"],
            weight: 1.0
        },
        {
            patterns: ["tags", "keywords"],
            weight: 0.8
        }
    ];

    // Check each pattern group
    for (const { patterns, weight } of weightPatterns) {
        if (patterns.some(pattern => name.includes(pattern))) {
            return weight;
        }
    }

    return 1.0; // Default weight
}
