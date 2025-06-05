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
  <a href="https://nodejs.org/en/">
    <img src="https://img.shields.io/badge/Express-20+-330033.svg?logo=express&style=flat" alt="Node.js">
  </a>
</p>

### What is this repository for? ###

### Running the server

Create `.env` file at project root. Refer to `.env.example` for the env values you need.


Install dependencies with yarn
```bash
yarn
```

Start the server
```bash
yarn start
```


### Claude Desktop
Claude Desktop is an MCP client that we can connect our MCP server to.
Since this is a node/express server, you must use `mcp-remote` to bridge it into Claude Desktop.
We do this rather than use the stdio transport type. This allows more flexibility into where/how the server is hosted.

https://github.com/geelen/mcp-remote


In your `claude_desktop_config.json` file, located at `/Users/[My Workspace]]/Library/Application Support/Claude/claude_desktop_config.json` put the following:

```
{
  "mcpServers": {
    "remote-example": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:<MY-PORT-FROM-ENV>/mcp"
      ]
    }
  }
}
```

To view claude's logs for debugging purposes, use the npm script:
```bash
yarn claude-logs
```


### Inspector

You can also view the mcp server tools/prompts/resources using the inspector. While the mcp server is running, you can launch the inspector:

```bash
yarn inspect
```

Choose Transport Type: Streamable HTTP
And enter the server url in the input box, and click "Connect". The server url will be something like:
```
http://localhost:<MY-PORT-FROM-ENV>/mcp
```
depending on what port your chose

