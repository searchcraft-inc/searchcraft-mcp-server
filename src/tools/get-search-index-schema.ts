import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SearchcraftQuery } from "../types.js";
import { debugLog, performSearchcraftRequest } from "../helpers.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool: get_search_index_schema
 *
 * This tool provides an interface for getting the current search index schema, including schema fields and facet information.
 * Gives the MCP Client additional context about how to construct search queries.
 *
 * @param server
 */
export const registerGetSearchIndexSchema = (server: McpServer) => {
    server.tool(
        "get_search_index_schema",
        "Gets the schema fields and facet information for the search index in order to understand available fields and facet information for constructing a search query.",
        {},
        async () => {
            debugLog("[Tool Call] get-search-index-schema");
            const baseUrl = process.env.ENDPOINT_URL;
            const readKey = process.env.READ_KEY;
            const federation = process.env.FEDERATION_NAME;
            const index = process.env.INDEX_NAME;

            // Validate required environment variables
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

            // Get Schema Fields for this Index
            const schemaFieldEndpoint = `${baseUrl}/index/${index}`;
            const schemaFieldResponse = await fetch(schemaFieldEndpoint, {
                headers: {
                    Authorization: process.env.INGEST_KEY || "",
                },
            });
            const schemaFieldResponseText = await schemaFieldResponse.text();

            // Get the top-level Facets for this index if any exist
            // {"limit":1, "query":{"exact":{"ctx":"*"}}}
            const initialQuery: SearchcraftQuery = {
                limit: 1,
                query: [{ exact: { ctx: "*" } }],
            };

            const endpoint = `${baseUrl.replace(/\/$/, "")}/index/${index}/search`;

            const initialQueryResponse = await performSearchcraftRequest(
                endpoint,
                initialQuery,
                readKey,
            );

            let initialFacetsText: string | undefined;

            if (initialQueryResponse.data.facets) {
                initialFacetsText = JSON.stringify(
                    initialQueryResponse.data.facets,
                );
            }

            const result: CallToolResult = {
                content: [
                    {
                        type: "resource",
                        resource: {
                            uri: `searchcraft://schema-fields/${Date.now()}`,
                            mimeType: "application/json",
                            text: schemaFieldResponseText,
                        },
                    },
                ],
            };

            if (initialFacetsText) {
                result.content.push({
                    type: "resource",
                    resource: {
                        uri: `searchcraft://facets/${Date.now()}`,
                        mimeType: "application/json",
                        text: initialFacetsText,
                    },
                });
            } else {
                result.content.push({
                    type: "text",
                    text: "There are no facet types associated with this index. Do not include facetFilters with your search.",
                });
            }

            result.content.push({
                type: "text",
                text: "The preliminary search data has been retrieved. This data represents schema fields and facets for constructing search queries. You can now begin querying for search results.",
            });

            return result;
        },
    );
};
