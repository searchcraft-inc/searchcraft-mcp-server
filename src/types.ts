export interface SearchcraftHit {
    // biome-ignore lint/suspicious/noExplicitAny: Doc type is dependent on index schema
    doc: Record<string, any>;
    document_id: string;
    score: number;
    source_index?: string;
}

export interface SearchcraftResponse {
    status: number;
    data: {
        hits: SearchcraftHit[];
        count: number;
        time_taken: number;
        // biome-ignore lint/suspicious/noExplicitAny: Facets are a complex data structure that we do not need to model for our purposes
        facets?: Array<Record<string, any>>;
    };
}

export interface SearchcraftQueryPart {
    occur?: "must" | "should";
    exact?: { ctx: string };
    fuzzy?: { ctx: string };
}

export interface SearchcraftQuery {
    query: SearchcraftQueryPart[];
    limit?: number;
    offset?: number;
    order_by?: string;
    sort?: "asc" | "desc";
}
