<img alt="ReTail website screenshot" src="./header.png">
<h1 align="center">searchcraft-mcp-server</h1>
<p align="center">
An MCP Server powered by <a href="https://searchcraft.io">Searchcraft</a> – the developer-first vertical search engine.
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript&style=flat" alt="TypeScript">
  </a>
  <a href="https://nodejs.org/en/">
    <img src="https://img.shields.io/badge/Node.js-20+-339933.svg?logo=node.js&style=flat" alt="Node.js">
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-5.1-330033.svg?logo=express&style=flat" alt="Node.js">
  </a>
</p>

The Searchcraft MCP Server provides a suite of tools for managing your Searchcraft cluster's Documents, Indexes, Federations, Access Keys, and Analytics. It enables MCP Clients, like Claude Desktop, to be prompted in plain English to perform administrative actions like setting up search indexes, access keys, ingesting documents, viewing analytics, searching indexes, and more.

## Available Tools

### Index Management

| Tool Name | Description |
|-----------|-------------|
| create_index | Create a new index with the specified schema. This will empty the index if it already exists. |
| delete_index | Delete an index and all its documents permanently. |
| get_all_index_stats | Get document counts and statistics for all indexes. |
| get_index_schema | Get the schema definition for a specific index. |
| get_index_stats | Get statistics and metadata for a specific index (document count, etc.). |
| list_all_indexes | Get a list of all indexes in the Searchcraft instance. |
| patch_index | Make partial configuration changes to an index schema (search_fields, weight_multipliers, etc.). |
| update_index | Replace the entire contents of an existing index with a new schema definition. |

### Document Management

| Tool Name | Description |
|-----------|-------------|
| add_documents | Add one or multiple documents to an index. Documents should be provided as an array of JSON objects. |
| delete_all_documents | Delete all documents from an index. The index will continue to exist after all documents are deleted. |
| delete_document_by_id | Delete a single document from an index by its internal Searchcraft ID (_id). |
| delete_documents_by_field | Delete one or several documents from an index by field term match (e.g., {id: 'xyz'} or {title: 'foo'}). |
| delete_documents_by_query | Delete one or several documents from an index by query match. |
| get_document_by_id | Get a single document from an index by its internal Searchcraft ID (_id). |

### Federation Management

| Tool Name | Description |
|-----------|-------------|
| create_federation | Create or update a federation with the specified configuration. |
| delete_federation | Delete a federation permanently. |
| get_federation_details | Get detailed information for a specific federation. |
| get_federation_stats | Get document counts per index for a federation as well as the total document count. |
| get_organization_federations | Get a list of all federations for a specific organization. |
| list_all_federations | Get a list of all federations in the Searchcraft instance. |
| update_federation | Replace the current federation entity with an updated one. |

### Authentication & Key Management

| Tool Name | Description |
|-----------|-------------|
| create_key | Create a new authentication key with specified permissions and access controls. |
| delete_all_keys | Delete all authentication keys on the Searchcraft cluster. Use with extreme caution! |
| delete_key | Delete a specific authentication key permanently. |
| get_application_keys | Get a list of all authentication keys associated with a specific application. |
| get_federation_keys | Get a list of all authentication keys associated with a specific federation. |
| get_key_details | Get detailed information for a specific authentication key. |
| get_organization_keys | Get a list of all authentication keys associated with a specific organization. |
| list_all_keys | Get a list of all authentication keys on the Searchcraft cluster. |
| update_key | Update an existing authentication key with new configuration. |

### Stopwords Management

| Tool Name | Description |
|-----------|-------------|
| add_stopwords | Add custom stopwords to an index. These are added on top of the default language-specific dictionary. |
| delete_all_stopwords | Delete all custom stopwords from an index. This only affects custom stopwords, not the default language dictionary. |
| delete_stopwords | Delete specific custom stopwords from an index. This only affects custom stopwords, not the default language dictionary. |
| get_index_stopwords | Get all stopwords for an index, including both default language dictionary and custom stopwords. |

### Synonyms Management

| Tool Name | Description |
|-----------|-------------|
| add_synonyms | Add synonyms to an index. Synonyms only work with fuzzy queries, not exact match queries. |
| delete_all_synonyms | Delete all synonyms from an index. |
| delete_synonyms | Delete specific synonyms from an index by their keys. |
| get_index_synonyms | Get all synonyms defined for an index. |

### Search & Measurement

| Tool Name | Description |
|-----------|-------------|
| get_measure_conversion | Get measurement conversion data with optional filtering and aggregation parameters. |
| get_measure_summary | Get measurement summary data with optional filtering and aggregation parameters. |
| get_search_results | Performs a search query using the Searchcraft API with support for fuzzy/exact matching, facets, and date ranges. |
| get_searchcraft_status | Get the current status of the Searchcraft search service. |

## Getting Started

### Environment Variables
Create `.env` file at the project's root and fill in the values:

```
# Server Config
USER_AGENT=searchcraft-mcp-server/<project-version>
DEBUG=true
PORT=3100

# Searchcraft Config
ENDPOINT_URL= # The endpoint url of your Searchcraft Cluster
ADMIN_KEY= # The admin key (super user key) of your Searchcraft Cluster
```

[.env sample](.env.example)


### Installation & Setup

Make sure your environment has the correct version of node selected.
```bash
nvm use
```

Install dependencies with yarn
```bash
yarn
```

Build the server
```bash
yarn build
```

This creates two server versions:
- `dist/server.js` - HTTP server for testing and remote deployment
- `dist/stdio-server.js` - stdio server for Claude Desktop

## Usage

### Option 1: Claude Desktop (stdio) - Recommended

For local use with Claude Desktop, use the stdio version which provides better performance and reliability.

**claude_desktop_config.json**
```json
{
  "mcpServers": {
    "searchcraft": {
      "command": "node",
      "args": [
        "/path/to/searchcraft-mcp-server/dist/stdio-server.js"
      ]
    }
  }
}
```

The claude desktop config file can be found at:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

If the file doesn't exist, create it.

### Option 2: HTTP Server (for testing/remote deployment)

Start the HTTP server for testing, debugging, or remote deployment:

```bash
yarn start  # Starts HTTP server on port 3100
```

For Claude Desktop with HTTP server, you'll need [mcp-remote](https://github.com/geelen/mcp-remote):

**claude_desktop_config.json**
```json
{
  "mcpServers": {
    "searchcraft": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:3100/mcp"
      ]
    }
  }
}
```

### Available Scripts

```bash
# Development
yarn dev          # Watch HTTP server
yarn dev:stdio    # Watch stdio server

# Production
yarn start        # Start HTTP server
yarn start:stdio  # Start stdio server

# Testing
yarn inspect      # Launch MCP inspector
yarn claude-logs  # View Claude Desktop logs
```

## stdio vs HTTP: Which to Choose?

| Feature | stdio (Recommended) | HTTP |
|---------|-------------------|------|
| **Performance** | ✅ Direct IPC, lower latency | ⚠️ HTTP overhead |
| **Security** | ✅ No exposed ports | ⚠️ Network port required |
| **Simplicity** | ✅ No port management | ⚠️ Port conflicts possible |
| **Claude Desktop** | ✅ Native support | ⚠️ Requires mcp-remote |
| **Remote Access** | ❌ Local only | ✅ Can deploy remotely |
| **Testing** | ⚠️ Requires MCP tools | ✅ Easy with curl/Postman |
| **Multiple Clients** | ❌ One client at a time | ✅ Multiple concurrent clients |

**Use stdio when:**
- Using Claude Desktop locally
- You want the best performance
- You prefer simplicity

**Use HTTP when:**
- You need remote access
- You want easy testing/debugging
- You need multiple concurrent clients
- You're deploying to a server

## Debugging

### Claude Desktop Logs

To view Claude Desktop's logs for debugging MCP connections:
```bash
yarn claude-logs
```

### Testing with MCP Inspector

The MCP Inspector allows you to test your server tools interactively.

**For stdio server (recommended):**
```bash
yarn inspect
```
- Choose Transport Type: stdio
- Command: `node dist/stdio-server.js`

**For HTTP server:**
```bash
yarn start  # Start HTTP server first
yarn inspect
```
- Choose Transport Type: Streamable HTTP
- URL: `http://localhost:3100/mcp`

### Manual Testing

**Test HTTP server:**
```bash
# Health check
curl http://localhost:3100/health

# Test MCP endpoint
curl -X POST http://localhost:3100/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

**Test stdio server:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/stdio-server.js
```

## Resources

- 📘 [Searchcraft Docs](https://docs.searchcraft.io)
- 🛰️ [Vektron Dashboard](https://vektron.searchcraft.io)
- 💬 [Searchcraft Discord](https://discord.gg/RQnGD63qWw)
- 🧠 [Searchcraft Reddit](https://www.reddit.com/r/searchcraft/)
- 🧪 [Searchcraft SDK on npm](https://www.npmjs.com/package/@searchcraft/react-sdk)

## License

Licensed under the [Apache 2.0 License](LICENSE).

<p align="center">
Built with 🛰️ by the <a href="https://searchcraft.io">Searchcraft</a> team
</p>
