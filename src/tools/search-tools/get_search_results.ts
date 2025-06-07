import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { debugLog, performSearchcraftRequest } from "../../helpers.js";
import type { SearchcraftQuery, SearchcraftQueryPart } from "../../types.js";

/**
 * Tool: get_search_results
 *
 * This tool provides an interface for making search queries to the index specified in the environment variables.
 * It allows for complex queries based on fuzzy + exact keyword matching, date ranges, and facets.
 *
 * @param server
 */
export const registerGetSearchResults = (server: McpServer) => {
    server.tool(
        "get_search_results",
        "Performs a search query using the Searchcraft API with support for fuzzy/exact matching, facets, and date ranges.",
        {
            fuzzyKeywordsThatCanOptionallyAppear: z
                .array(
                    z
                        .string()
                        .describe(
                            "A keyword that is fuzzy-matched against data in the document. Must be a single word.",
                        ),
                )
                .describe(
                    "A list of keywords that are fuzzy-matched against document data. A document is considered to be a match when ANY of these values are found in the document.",
                ),
            fuzzyKeywordsThatMustAppear: z
                .array(
                    z
                        .string()
                        .describe(
                            "A keyword that is fuzzy-matched against data in the document. Must be a single word.",
                        ),
                )
                .describe(
                    "A list of keywords that are fuzzy-matched against document data. A document is considered to be a match only when ALL of these values are found in the document.",
                ),
            exactSearchTermsThatCanOptionallyAppear: z
                .array(
                    z
                        .string()
                        .describe(
                            "An exact term or phrase to search for in a document.",
                        ),
                )
                .describe(
                    "A list of exact search terms or phrases to search for in document data. A document is considered to be a match when ANY of these values are found in the document.",
                ),
            exactSearchTermsThatMustAppear: z
                .array(
                    z
                        .string()
                        .describe(
                            "An exact term or phrase to search for in a document.",
                        ),
                )
                .describe(
                    "A list of exact search terms or phrases to search for in document data. A document is considered to be a match when ANY of these values are found in the document.",
                ),
            dateRangeFilters: z
                .array(
                    z.object({
                        startDate: z
                            .string()
                            .transform((dateStr) => new Date(dateStr))
                            .describe(
                                "The starting date to include search results. This is a date string.",
                            ),
                        endDate: z
                            .string()
                            .transform((dateStr) => new Date(dateStr))
                            .describe(
                                "The ending date to include search results from. This is a date string.",
                            ),
                        schemaFieldName: z
                            .string()
                            .describe(
                                "The schema field to use for filtering the search results by. Must be one of the type: datetime schema fields defined in the index.",
                            ),
                    }),
                )
                .optional()
                .describe(
                    "The schema field date ranges to use to filter the search results by. Only schema fields of type datetime can have date filters applied to them.",
                ),
            facetFilters: z
                .array(
                    z
                        .object({
                            facetPaths: z
                                .array(
                                    z
                                        .string()
                                        .describe(
                                            "The individual facet paths to include. These can be any of the path values found in the schemaFieldName's facet object. Path strings must include a beginning / value. Example: /sports",
                                        ),
                                )
                                .describe(
                                    "An array of the facet paths to use for the search results. Only search results that correspond to these paths will be included in the response.",
                                ),
                            schemaFieldName: z
                                .string()
                                .describe(
                                    "The schema field to use for filtering by facet. Must be one of the type: facet schema fields defined in the index.",
                                ),
                        })
                        .describe(
                            "Represents a grouping of facet paths that search results should be returned from, all from the same corresponding schema field.",
                        ),
                )
                .optional()
                .describe(
                    "Represents a collection of groupings of facet paths that search results should be returned from. Each grouping corresponds to a schema field of type: facet.",
                ),
            index: z
                .string()
                .describe("The name of the index to get search data on."),
            readKey: z.string().describe("A read key for this index."),
        },
        async ({
            fuzzyKeywordsThatCanOptionallyAppear,
            fuzzyKeywordsThatMustAppear,
            exactSearchTermsThatMustAppear,
            exactSearchTermsThatCanOptionallyAppear,
            dateRangeFilters,
            facetFilters,
            index,
            readKey,
        }) => {
            debugLog("[Tool Call] get-search-results");
            try {
                const baseUrl = process.env.ENDPOINT_URL;
                const federation = process.env.FEDERATION_NAME;

                if (!baseUrl) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "❌ Error: ENDPOINT_URL environment variable is required",
                            },
                        ],
                        isError: true,
                    };
                }

                if (!readKey) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "❌ Error: READ_KEY environment variable is required",
                            },
                        ],
                        isError: true,
                    };
                }

                let endpoint: string;
                if (federation) {
                    endpoint = `${baseUrl.replace(/\/$/, "")}/federation/${federation}/search`;
                } else if (index) {
                    endpoint = `${baseUrl.replace(/\/$/, "")}/index/${index}/search`;
                } else {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "❌ Error: Either FEDERATION_NAME or INDEX_NAME environment variable must be set",
                            },
                        ],
                        isError: true,
                    };
                }

                const fuzzyShouldParts: SearchcraftQueryPart[] =
                    fuzzyKeywordsThatCanOptionallyAppear.map((searchTerm) => {
                        return {
                            occur: "should",
                            fuzzy: {
                                ctx: searchTerm,
                            },
                        };
                    });

                const fuzzyMustParts: SearchcraftQueryPart[] =
                    fuzzyKeywordsThatMustAppear.map((searchTerm) => {
                        return {
                            occur: "must",
                            fuzzy: {
                                ctx: searchTerm,
                            },
                        };
                    });

                const exactShouldParts: SearchcraftQueryPart[] =
                    exactSearchTermsThatCanOptionallyAppear.map(
                        (searchTerm) => {
                            return {
                                occur: "should",
                                exact: {
                                    ctx: searchTerm,
                                },
                            };
                        },
                    );

                const exactMustParts: SearchcraftQueryPart[] =
                    exactSearchTermsThatMustAppear.map((searchTerm) => {
                        return {
                            occur: "must",
                            exact: {
                                ctx: searchTerm,
                            },
                        };
                    });

                const facetParts: SearchcraftQueryPart[] = (
                    facetFilters || []
                ).map((facetFilterGroup) => {
                    return {
                        occur: "must",
                        exact: {
                            ctx: `${facetFilterGroup.schemaFieldName}: IN [${facetFilterGroup.facetPaths.join(" ")}]`,
                        },
                    };
                });

                const dateRangeParts: SearchcraftQueryPart[] = (
                    dateRangeFilters || []
                ).map((dateRangeFilter) => {
                    return {
                        occur: "must",
                        exact: {
                            ctx: `${dateRangeFilter.schemaFieldName}:[${dateRangeFilter.startDate.toISOString()} TO ${dateRangeFilter.endDate.toISOString()}]`,
                        },
                    };
                });

                const searchcraftQuery: SearchcraftQuery = {
                    query: [
                        ...fuzzyShouldParts,
                        ...fuzzyMustParts,
                        ...exactShouldParts,
                        ...exactMustParts,
                        ...dateRangeParts,
                        ...facetParts,
                    ],
                    limit: 4,
                };

                // Make the API request
                const response = await performSearchcraftRequest(
                    endpoint,
                    searchcraftQuery,
                    readKey,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://search-results/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(response.data.hits),
                            },
                        },
                    ],
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";

                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ Searchcraft search failed: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
};
