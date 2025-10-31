import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
    getSearchcraftConfig,
    makeSearchcraftRequest,
} from "../../../helpers.js";

export const registerAddSynonyms = (server: McpServer) => {
    /**
     * Tool: add_synonyms
     * POST /index/:index_name/synonyms - Add synonyms to an index
     */
    server.tool(
        "add_synonyms",
        "Add synonyms to an index. Synonyms only work with fuzzy queries, not exact match queries.",
        {
            index_name: z
                .string()
                .describe("The name of the index to add synonyms to"),
            synonyms: z
                .array(
                    z
                        .object({
                            base_word: z
                                .string()
                                .describe(
                                    "The base word that the given synonyms will resolve to during fuzzy queries.",
                                ),
                            synonyms: z
                                .array(
                                    z
                                        .string()
                                        .transform((synonym) => synonym.trim())
                                        .describe(
                                            "A synonym that will resolve to the base word during fuzzy queries.",
                                        ),
                                )
                                .describe(
                                    "An array of synonyms that resolve to the base word during fuzzy queries.",
                                ),
                        })
                        .transform(
                            (mapping) =>
                                `${mapping.base_word}:${mapping.synonyms.join(",")}`,
                        )
                        .describe(
                            "The synonyms -> base word mapping definition",
                        ),
                )
                .describe("Synonym definitions to add to the index"),
        },
        async ({ index_name, synonyms }) => {
            debugLog("[Tool Call] add_synonyms");
            try {
                const config = getSearchcraftConfig();
                if (config.error) {
                    return config.error;
                }
                const { endpointUrl, apiKey } = config;

                const endpoint = `${endpointUrl.replace(/\/$/, "")}/index/${index_name}/synonyms`;
                const response = await makeSearchcraftRequest(
                    endpoint,
                    "POST",
                    apiKey,
                    synonyms,
                );

                return {
                    content: [
                        {
                            type: "resource",
                            resource: {
                                uri: `searchcraft://synonyms-added/${index_name}/${Date.now()}`,
                                mimeType: "application/json",
                                text: JSON.stringify(response, null, 2),
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
                    `Failed to add synonyms: ${errorMessage}`,
                );
            }
        },
    );
};
