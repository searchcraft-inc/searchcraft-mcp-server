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

The Searchcraft MCP Server allows for easily integrating search into MCP clients. Integrates with things like Claude Desktop, which allows Claude to search for information on the search index that you specify.


## Available Tools

| Tool | Description |
|------|-------------|
| **get_search_results** | Performs search queries on the search index provided. It allows for complex queries based on fuzzy + exact keyword matching, date ranges, and facets. |
| **get_search_index_schema** | Retrieves the current search index schema, including schema fields and facet information. Gives the MCP Client additional context about how to construct search queries. |
| **get_searchcraft_status** | Performs a basic health check api request to the Searchcraft service. |

## Getting Started

### Environment Variables
Create `.env` file at the project's root and fill in the values:

```
# Server Config
USER_AGENT=searchcraft-mcp-server/<project-version>
DEBUG=true
PORT=3100

# Searchcraft Config
ENDPOINT_URL=
INDEX_NAME=
READ_KEY=
INGEST_KEY=
```

[.env sample](.env.example)


You will need a Searchcraft search index. Head to [Vektron ↗︎](https://vektron.searchcraft.io), your command center for creating and configuring indexes, managing settings, and navigating all things Searchcraft.


### Running the Server

Install dependencies with yarn
```bash
yarn
```

Build & Start the server
```bash
yarn build
yarn start
```

## Usage With Claude Desktop

The server must be running in order for Claude Desktop to detect `searchcraft-mcp-server`'s tools.

`searchcraft-mcp-server` uses `StreamableHTTPServerTransport`, so in order to connect it to Claude Desktop, we use [mcp-remote ↗︎](https://github.com/geelen/mcp-remote).

In your claude desktop config file, add the following:

**claude_desktop_config.json**
```json
{
  "mcpServers": {
    "searchcraft": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:<MY-PORT-FROM-ENV>/mcp"
      ]
    }
  }
}
```

The claude desktop config file can be found at `/Users/[My Workspace]]/Library/Application Support/Claude/claude_desktop_config.json`. If no file exists here you can create it.

[Claude desktop config example](claude_desktop_config_example.example.json)

## Debugging

To view claude's logs for debugging purposes, use the npm script:
```bash
yarn claude-logs
```

### Inspector Tool

You can view and try out the available tools/prompts/resources using the inspector. While the mcp server is running, you can launch the inspector:

```bash
yarn inspect
```

- Choose Transport Type: Streamable HTTP
- Specify the URL that the server is running on, including the port number.
- Hit "Connect"

```
http://localhost:<MY-PORT-FROM-ENV>/mcp
```

The Inspector allows you to view available tools and to try making test calls to them.

## Resources

- 📘 [Searchcraft Docs](https://docs.searchcraft.io)
- 🛰️ [Vektron Dashboard](https://vektron.searchcraft.io)
- 💬 [Searchcraft Discord](https://discord.gg/WteTxPBM)
- 🧠 [Searchcraft Reddit](https://www.reddit.com/r/searchcraft/)
- 🧪 [Searchcraft SDK on npm](https://www.npmjs.com/package/@searchcraft/react-sdk)

## License

Licensed under the [Apache 2.0 License](LICENSE).

<p align="center">
Built with 🛰️ by the <a href="https://searchcraft.io">Searchcraft</a> team
</p>
