import { z } from "zod";

export const IndexFieldSchema = z.object({
    type: z
        .enum(["text", "datetime", "bool", "f64", "u64", "i64", "facet"])
        .describe("The field data type"),
    required: z
        .boolean()
        .optional()
        .describe("Whether this field is required in documents"),
    stored: z
        .boolean()
        .optional()
        .describe("Whether this field is stored and retrievable"),
    indexed: z
        .boolean()
        .optional()
        .describe("Whether this field is indexed for searching"),
    fast: z
        .boolean()
        .optional()
        .describe(
            "Whether this field uses fast field storage for sorting/filtering (not used on text or facet fields)",
        ),
    multi: z
        .boolean()
        .optional()
        .describe("Whether this field can contain multiple values"),
});

export const IndexSchema = z.object({
    name: z
        .string()
        .describe(
            "The name of the index (should be URL friendly - no spaces or special characters)",
        ),
    auto_commit_delay: z
        .number()
        .optional()
        .describe(
            "Auto commit delay in seconds - time to wait since last ingestion request before automatically committing",
        ),
    language: z
        .string()
        .optional()
        .describe(
            "Two letter ISO 639 language code (e.g., 'en') for stemming and stop word filtering",
        ),
    enable_language_stemming: z
        .boolean()
        .optional()
        .describe(
            "Whether to enable language specific stemming algorithm (requires language code)",
        ),
    search_fields: z
        .array(z.string())
        .describe(
            "Array of default text field names to search against when no specific field is specified",
        ),
    fields: z
        .record(IndexFieldSchema)
        .describe("Field definitions for the index"),
    weight_multipliers: z
        .record(z.number().min(0.0).max(10.0))
        .optional()
        .describe(
            "Weight multipliers for search fields (0.0 - 10.0) - gives more/less importance to specific fields",
        ),
    exclude_stop_words: z
        .boolean()
        .optional()
        .describe(
            "Whether to exclude stop words when performing searches (enabled by default on Searchcraft Cloud)",
        ),
    time_decay_field: z
        .string()
        .optional()
        .describe(
            "Field name for exponential temporal decay function on relevancy scoring (must be a datetime field marked as fast and indexed)",
        ),
});

export const CreateIndexRequestSchema = z.object({
    index: IndexSchema,
});

export const PatchIndexSchema = z.object({
    search_fields: z
        .array(z.string())
        .optional()
        .describe(
            "Array of default text field names to search against when no specific field is specified",
        ),
    weight_multipliers: z
        .record(z.number().min(0.0).max(10.0))
        .optional()
        .describe(
            "Weight multipliers for search fields (0.0 - 10.0) - gives more/less importance to specific fields",
        ),
    language: z
        .string()
        .optional()
        .describe(
            "Two letter ISO 639 language code (e.g., 'en') for stemming and stop word filtering",
        ),
    time_decay_field: z
        .string()
        .optional()
        .describe(
            "Field name for exponential temporal decay function on relevancy scoring (must be a datetime field marked as fast and indexed)",
        ),
    auto_commit_delay: z
        .number()
        .optional()
        .describe(
            "Auto commit delay in seconds - time to wait since last ingestion request before automatically committing",
        ),
    exclude_stop_words: z
        .boolean()
        .optional()
        .describe(
            "Whether to exclude stop words when performing searches (enabled by default on Searchcraft Cloud)",
        ),
});

export const KeySchema = z.object({
    allowed_indexes: z
        .array(z.string())
        .describe("Array of index names this key can access"),
    permissions: z
        .union([z.literal(1), z.literal(15), z.literal(63)])
        .describe("Permission level: 1=read, 15=ingest, 63=admin"),
    name: z.string().describe("Name of this key"),
    organization_id: z
        .number()
        .optional()
        .describe("Organization ID (optional)"),
    organization_name: z
        .string()
        .optional()
        .describe("Organization name (optional)"),
    application_id: z.number().optional().describe("Application ID (optional)"),
    application_name: z
        .string()
        .optional()
        .describe("Application name (optional)"),
    status: z.enum(["active", "inactive"]).describe("Key status"),
    federation_name: z
        .string()
        .optional()
        .describe(
            "Federation name (optional, only for read keys associated with a federation)",
        ),
});

export const MeasureQueryParamsSchema = z.object({
    organization_id: z.string().describe("Organization ID to filter by"),
    application_id: z
        .string()
        .optional()
        .describe("Application ID to filter by"),
    index_names: z
        .array(z.string().describe("Index name to filter by"))
        .transform((arr) => arr.join("|"))
        .optional()
        .describe("An array of index names to filter by"),

    user_id: z.string().optional().describe("User ID to filter by"),
    session_id: z.string().optional().describe("Session ID to filter by"),
    event_name: z.string().optional().describe("Event name to filter by"),
    date_start: z
        .number()
        .int()
        .optional()
        .describe("Start date as Unix timestamp"),
    date_end: z
        .number()
        .int()
        .optional()
        .describe("End date as Unix timestamp"),
    granularity: z
        .enum(["minutes", "hours", "days", "weeks", "months", "years"])
        .optional()
        .describe("Time granularity for aggregating results"),
    rpp: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Results per page (pagination)"),
    page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number (pagination)"),
});
