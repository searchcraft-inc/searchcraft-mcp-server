# Open WebUI Setup Guide for Searchcraft MCP Server

This guide shows you how to integrate the Searchcraft MCP Server with Open WebUI using the Pipelines framework.

## Overview

Open WebUI supports MCP servers through its **Pipelines** framework, which acts as a bridge between Open WebUI and MCP servers. This setup allows you to use Searchcraft's 30+ tools directly within Open WebUI's chat interface.

## Prerequisites

- Docker and Docker Compose installed
- Searchcraft MCP Server built and ready (`yarn build`)
- Basic understanding of Open WebUI and Pipelines

## Quick Setup (Recommended)

### Step 1: Start Searchcraft MCP Server

```bash
# In your searchcraft-mcp-server directory
yarn start  # Starts HTTP server on port 3100
```

### Step 2: Create Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "3000:8080"
    volumes:
      - open-webui:/app/backend/data
    environment:
      - OPENAI_API_BASE_URL=http://pipelines:9099
      - OPENAI_API_KEY=0p3n-w3bu!
    depends_on:
      - pipelines

  pipelines:
    image: ghcr.io/open-webui/pipelines:main
    ports:
      - "9099:9099"
    volumes:
      - pipelines:/app/pipelines
      - ./open_webui_pipeline.py:/app/pipelines/searchcraft_mcp_pipeline.py
    environment:
      - PIPELINES_API_KEY=0p3n-w3bu!
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  open-webui:
  pipelines:
```

### Step 3: Copy the Pipeline File

Copy the provided `open_webui_pipeline.py` to your current directory (it should be in the same folder as your `docker-compose.yml`).

### Step 4: Start the Services

```bash
docker compose up -d
```

### Step 5: Configure Open WebUI

1. Open http://localhost:3000 in your browser
2. Create an admin account
3. Go to **Admin Settings** → **Pipelines**
4. You should see the "Searchcraft MCP Pipeline" listed
5. Click on it and configure the valves:
   - `MCP_SERVER_URL`: `http://host.docker.internal:3100/mcp`
   - `ENDPOINT_URL`: Your Searchcraft cluster URL
   - `ADMIN_KEY`: Your Searchcraft admin key
   - `ENABLE_MCP_TOOLS`: `true`

### Step 6: Test the Integration

1. Start a new chat in Open WebUI
2. Try asking: "List all my Searchcraft indexes"
3. The pipeline should enhance your message with Searchcraft context
4. The AI will have access to information about available Searchcraft tools

## Manual Setup (Alternative)

If you prefer to set up components individually:

### 1. Start Pipelines Server

```bash
docker run -d -p 9099:9099 \
  --add-host=host.docker.internal:host-gateway \
  -v pipelines:/app/pipelines \
  --name pipelines \
  ghcr.io/open-webui/pipelines:main
```

### 2. Install the Pipeline

Copy the pipeline code from `open_webui_pipeline.py` and:

1. Go to http://localhost:9099 (Pipelines admin interface)
2. Add the pipeline code
3. Configure the valves

### 3. Start Open WebUI

```bash
docker run -d -p 3000:8080 \
  -e OPENAI_API_BASE_URL=http://host.docker.internal:9099 \
  -e OPENAI_API_KEY=0p3n-w3bu! \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

## Configuration Options

### Pipeline Valves

- **MCP_SERVER_URL**: URL of your Searchcraft MCP server (default: `http://localhost:3100/mcp`)
- **ENDPOINT_URL**: Your Searchcraft cluster endpoint URL
- **ADMIN_KEY**: Your Searchcraft admin key for full access
- **ENABLE_MCP_TOOLS**: Enable/disable MCP integration (default: `true`)

### Environment Variables

For the Searchcraft MCP server, you can also set:

```bash
# In your .env file
ENDPOINT_URL=https://your-cluster.searchcraft.io
ADMIN_KEY=your_admin_key_here
```

## How It Works

1. **User Input**: User asks about Searchcraft operations in Open WebUI
2. **Pipeline Processing**: The pipeline detects Searchcraft-related keywords
3. **Context Enhancement**: Adds information about available MCP tools
4. **AI Response**: The AI model responds with knowledge of Searchcraft capabilities
5. **Tool Execution**: When needed, the pipeline can facilitate tool calls to the MCP server

## Troubleshooting

### Pipeline Not Loading

- Check that the pipeline file is properly mounted
- Verify the pipeline syntax is correct
- Check Pipelines logs: `docker logs pipelines`

### MCP Connection Issues

- Ensure Searchcraft MCP server is running on port 3100
- Check network connectivity between containers
- Verify the MCP_SERVER_URL in pipeline valves

### Open WebUI Not Connecting to Pipelines

- Confirm OPENAI_API_BASE_URL points to Pipelines
- Check that both services are running
- Verify the API key matches

## Advanced Usage

### Custom Tool Integration

You can extend the pipeline to handle specific Searchcraft operations:

```python
def _handle_search_request(self, query: str):
    """Handle direct search requests through MCP"""
    # Implementation for direct MCP tool calls
    pass
```

### Multiple MCP Servers

The pipeline can be extended to work with multiple MCP servers by modifying the `_initialize_mcp` method.

## Support

For issues specific to:

- **Searchcraft MCP Server**: Check the main README.md
- **Open WebUI**: Visit https://github.com/open-webui/open-webui
- **Pipelines**: Visit https://github.com/open-webui/pipelines
- **General questions about Searchcraft**: Join our [Discord server](https://discord.gg/RQnGD63qWw).
- **Issues / Feature Requests**: Visit https://github.com/searchcraft-inc/searchcraft-issues
