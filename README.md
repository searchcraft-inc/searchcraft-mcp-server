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
    <img src="https://img.shields.io/badge/Node.js-22+-339933.svg?logo=node.js&style=flat" alt="Node.js">
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-5.1-330033.svg?logo=express&style=flat" alt="Node.js">
  </a>
</p>

The Searchcraft MCP Server provides a suite of tools for managing your Searchcraft cluster's Documents, Indexes, Federations, Access Keys, and Analytics. It enables MCP Clients, like Claude Desktop, to be prompted in plain English to perform administrative actions like setting up search indexes, access keys, ingesting documents, viewing analytics, searching indexes, and more.

## Building an app in 2 minutes with Searchcraft MCP Server (video link)

<div align="center">
  <a href="https://youtu.be/Vs_98sUrFqA?si=m9aH-tvUAAFwQQVy" title="Watch the video">
    <img src="https://img.youtube.com/vi/Vs_98sUrFqA/hqdefault.jpg" alt="Building an app in 2 minutes with Searchcraft MCP Server">
  </a>
</div>

## Sample Prompts

Here is a sample prompt that could be used once Claude is connected to the Searchcraft MCP Server.

```text
I'd like to create a product search application using the create_vite_app tool.

Please use this JSON dataset https://dummyjson.com/products
First use the Searchcraft create_index_from_json tool to create the index and add the documents.

Then create an API read key for the vite app using the create_key tool.

App details:
- App name: "my-ecommerce-app"
- Endpoint: http://localhost:8000
- Index name: my-ecommerce-app
```

## Available Tools

The Searchcraft MCP Server currently provides three categories of tools, import tools, engine api tools, and app generation tools:

### Engine API Tools

These tools provide direct access to your Searchcraft cluster's core functionality for managing indexes, documents, federations, authentication, and search operations.

#### Index Management

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

#### Document Management

| Tool Name | Description |
|-----------|-------------|
| add_documents | Add one or multiple documents to an index. Documents should be provided as an array of JSON objects. |
| delete_all_documents | Delete all documents from an index. The index will continue to exist after all documents are deleted. |
| delete_document_by_id | Delete a single document from an index by its internal Searchcraft ID (_id). |
| delete_documents_by_field | Delete one or several documents from an index by field term match (e.g., {id: 'xyz'} or {title: 'foo'}). |
| delete_documents_by_query | Delete one or several documents from an index by query match. |
| get_document_by_id | Get a single document from an index by its internal Searchcraft ID (_id). |

#### Federation Management

| Tool Name | Description |
|-----------|-------------|
| create_federation | Create or update a federation with the specified configuration. |
| delete_federation | Delete a federation permanently. |
| get_federation_details | Get detailed information for a specific federation. |
| get_federation_stats | Get document counts per index for a federation as well as the total document count. |
| get_organization_federations | Get a list of all federations for a specific organization. |
| list_all_federations | Get a list of all federations in the Searchcraft instance. |
| update_federation | Replace the current federation entity with an updated one. |

#### Authentication & Key Management

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

#### Stopwords Management

| Tool Name | Description |
|-----------|-------------|
| add_stopwords | Add custom stopwords to an index. These are added on top of the default language-specific dictionary. |
| delete_all_stopwords | Delete all custom stopwords from an index. This only affects custom stopwords, not the default language dictionary. |
| delete_stopwords | Delete specific custom stopwords from an index. This only affects custom stopwords, not the default language dictionary. |
| get_index_stopwords | Get all stopwords for an index, including both default language dictionary and custom stopwords. |

#### Synonyms Management

| Tool Name | Description |
|-----------|-------------|
| add_synonyms | Add synonyms to an index. Synonyms only work with fuzzy queries, not exact match queries. |
| delete_all_synonyms | Delete all synonyms from an index. |
| delete_synonyms | Delete specific synonyms from an index by their keys. |
| get_index_synonyms | Get all synonyms defined for an index. |

#### Search & Analytics

| Tool Name | Description |
|-----------|-------------|
| get_measure_conversion | Get measurement conversion data with optional filtering and aggregation parameters. *requires Clickhouse if running locally |
| get_measure_summary | Get measurement summary data with optional filtering and aggregation parameters. *requires Clickhouse if running locally|
| get_search_results | Performs a search query using the Searchcraft API with support for fuzzy/exact matching, facets, and date ranges. |
| get_prelim_search_data | Get schema fields and facet information for a search index to understand available fields for constructing queries. |
| get_searchcraft_status | Get the current status of the Searchcraft search service. |

### Import Tools

These tools provide workflows for importing JSON data and automatically generating Searchcraft schemas. Perfect for quickly setting up new indexes from existing data sources.

| Tool Name | Description |
|-----------|-------------|
| analyze_json_from_file | Read JSON data from a local file and analyze its structure to understand field types and patterns for Searchcraft index schema generation. |
| analyze_json_from_url | Fetch JSON data from a URL and analyze its structure to understand field types and patterns for Searchcraft index schema generation. |
| generate_searchcraft_schema | Generate a complete Searchcraft index schema from analyzed JSON structure, with customizable options for search fields, weights, and other index settings. |
| create_index_from_json | Complete workflow to create a Searchcraft index from JSON data. Fetches JSON from URL or file, analyzes structure, generates schema, creates the index, and adds all documents in one step. |

#### Import Tools Workflow

The import tools are designed to work together in a streamlined workflow:

1. **Analyze** → Use `analyze_json_from_file` or `analyze_json_from_url` to examine your JSON data structure
2. **Generate** → Use `generate_searchcraft_schema` to create a customized Searchcraft schema from the analysis
3. **Create** → Use the Engine API `create_index` tool to create the index with your generated schema
4. **Import** → Use `add_documents` to populate your new index with data

**Or use the all-in-one approach:**

- **One-Step** → Use `create_index_from_json` to analyze, generate schema, create the index, and import all documents in one command

### App Generation Tools

These tools create complete, ready-to-run search applications from your JSON data, perfect for prototyping and demos.

| Tool Name | Description |
|-----------|-------------|
| create_vite_app | Creates a complete Vite + React search application from JSON data. Analyzes your data structure, generates optimized search templates, and creates a fully functional web app with Searchcraft integration. |

#### App Generation Workflow

The app generation tools provide an end-to-end solution for creating search applications:

1. **Data Analysis** → Automatically analyzes your JSON structure to understand field types and content
2. **Template Generation** → Creates optimized search result templates based on your data fields
3. **App Creation** → Clones and configures a complete Vite + React application
4. **Environment Setup** → Configures Searchcraft connection settings
5. **Ready to Run** → Provides a fully functional search app you can immediately start and customize

## Detailed Tool Usage

### Using create_index_from_json

The `create_index_from_json` tool provides a complete workflow to create a Searchcraft index from JSON data in a single command. This is perfect for quickly setting up search indexes from existing datasets. Note, if you know the language of the data you are importing you should specify it with the `language` parameter (use the [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) two letter code for the language)

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | `"url"` or `"file"` | ✅ | Whether to fetch data from a URL or read from a local file |
| `path` | `string` | ✅ | URL or file path to the JSON data |
| `index_name` | `string` | ✅ | Name for the new Searchcraft index |
| `sample_size` | `number` | ❌ | Number of items to analyze for schema generation (default: 10) |
| `search_fields` | `string[]` | ❌ | Override automatically detected search fields |
| `weight_multipliers` | `object` | ❌ | Custom field weights for search relevance (0.0-10.0) |
| `language` | `string` | ❌ | Language code for the index (e.g., "en", "es") |
| `auto_commit_delay` | `number` | ❌ | Auto commit delay in seconds |
| `exclude_stop_words` | `boolean` | ❌ | Whether to exclude stop words from search |
| `time_decay_field` | `string` | ❌ | Field name for time-based relevance decay |

#### Example Usage

**From a URL:**

```json
{
  "source": "url",
  "path": "https://api.example.com/products.json",
  "index_name": "products",
  "sample_size": 50,
  "search_fields": ["title", "description", "category"],
  "weight_multipliers": {
    "title": 2.0,
    "description": 1.0,
    "category": 1.5
  }
}
```

**From a local file:**
```json
{
  "source": "file",
  "path": "/path/to/data.json",
  "index_name": "my_data",
  "language": "en"
}
```

#### What it does

1. **Fetches/Reads Data** → Downloads from URL or reads from local file
2. **Analyzes Structure** → Examines JSON to understand field types and patterns
3. **Generates Schema** → Creates optimized Searchcraft index schema
4. **Creates Index** → Sets up the index in your Searchcraft cluster
5. **Imports Documents** → Adds all JSON data as searchable documents
6. **Returns Summary** → Provides detailed information about what was created

#### Expected JSON Format

The tool works with various JSON structures:

- **Array of objects**: `[{...}, {...}, ...]`
- **Object with array property**: `{"data": [{...}, {...}], "meta": {...}}`
- **Single object**: `{...}` (will be treated as a single document)

The tool automatically finds the best array of objects to use for the index.

### Using create_vite_app

The `create_vite_app` tool creates a complete, ready-to-run search application from your JSON data. It's perfect for quickly prototyping search interfaces or creating demo applications.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data_source` | `"url"` or `"file"` | ✅ | Whether to fetch data from a URL or read from a local file |
| `data_path` | `string` | ✅ | URL or file path to the JSON data |
| `app_name` | `string` | ✅ | Name for the generated app (used for directory name) |
| `VITE_ENDPOINT_URL` | `string` | ✅ | Your Searchcraft cluster endpoint URL |
| `VITE_INDEX_NAME` | `string` | ✅ | The Searchcraft index name to connect to |
| `VITE_READ_KEY` | `string` | ✅ | Searchcraft read key for the application |
| `sample_size` | `number` | ❌ | Number of items to analyze for template generation (default: 50) |
| `search_fields` | `string[]` | ❌ | Override automatically detected search fields |
| `weight_multipliers` | `object` | ❌ | Custom field weights for search relevance (0.0-10.0) |

#### Example Usage

If you saw the [prompt](#sample-prompts) earlier in the documentation you can easily use the `create_vite_app` tool with natural language. However, you want finer grain control you can use the tool with JSON parameters.

**Creating a product search app:**
```json
{
  "data_source": "url",
  "data_path": "https://api.example.com/products.json",
  "app_name": "product-search",
  "VITE_ENDPOINT_URL": "https://your-cluster.searchcraft.io",
  "VITE_INDEX_NAME": "products",
  "VITE_READ_KEY": "your_read_key_here",
  "sample_size": 100,
  "search_fields": ["title", "description", "brand"],
  "weight_multipliers": {
    "title": 2.5,
    "description": 1.0,
    "brand": 1.8
  }
}
```

**Creating a blog search app from local data:**
```json
{
  "data_source": "file",
  "data_path": "/path/to/blog-posts.json",
  "app_name": "blog-search",
  "VITE_ENDPOINT_URL": "https://your-cluster.searchcraft.io",
  "VITE_INDEX_NAME": "blog_posts",
  "VITE_READ_KEY": "your_read_key_here"
}
```

#### What it does

1. **Analyzes Data Structure** → Examines your JSON to understand field types and content patterns
2. **Generates Search Templates** → Creates optimized result display templates based on your data
3. **Clones Vite Template** → Downloads the official Searchcraft Vite + React template
4. **Installs Dependencies** → Sets up all required npm packages
5. **Configures Environment** → Creates `.env` file with your Searchcraft settings
6. **Customizes Templates** → Generates dynamic search result components
7. **Updates App Code** → Modifies the main app with your specific branding and configuration

#### Generated App Features

The created application includes:

- **React + Vite** → Modern, fast development setup
- **Searchcraft SDK Integration** → Full search functionality out of the box
- **Responsive Design** → Works on desktop and mobile devices
- **Auto-generated Templates** → Smart result display based on your data structure
- **Environment Configuration** → Easy setup for different environments
- **Development Server** → Hot reload for rapid customization

#### Template Generation Logic

The tool intelligently analyzes your data to create optimal search result templates:

- **Title Field Detection** → Finds the best field to use as the main title
- **Description Field Detection** → Identifies descriptive text fields
- **Image Field Detection** → Locates image URLs for visual results
- **Date Field Detection** → Finds timestamp fields for temporal sorting
- **Additional Fields** → Includes other relevant text fields for comprehensive results

#### Next Steps After Creation

Once the app is created, you can:

1. **Start Vite Server**:
   ```bash
   cd apps/your-app-name
   yarn dev
   ```

2. **Customize Styling** → Modify CSS and components to match your brand

3. **Add Features** → Extend with filters, facets, or advanced search options

4. **Deploy** → Build and deploy to your preferred hosting platform

#### Prerequisites

- **Existing Searchcraft Index** → The index specified in `VITE_INDEX_NAME` should already exist
- **Valid Read Key** → The `VITE_READ_KEY` must have read permissions for the index
- **Git Available** → The tool uses git to clone the template repository
- **Node.js & Yarn** → Required for dependency installation

### Complete Workflow: From JSON to Search App

Here's how to use both tools together to go from raw JSON data to a fully functional search application:

#### Option 1: Two-Step Process (Recommended for Production)

**Step 1: Create the Searchcraft Index**
```json
{
  "source": "url",
  "path": "https://api.example.com/products.json",
  "index_name": "products",
  "sample_size": 100,
  "search_fields": ["title", "description", "category", "brand"],
  "weight_multipliers": {
    "title": 2.5,
    "description": 1.0,
    "category": 1.8,
    "brand": 1.5
  },
  "language": "en"
}
```

**Step 2: Create the Search Application**
```json
{
  "data_source": "url",
  "data_path": "https://api.example.com/products.json",
  "app_name": "product-search-app",
  "VITE_ENDPOINT_URL": "https://your-cluster.searchcraft.io",
  "VITE_INDEX_NAME": "products",
  "VITE_READ_KEY": "your_read_key_here",
  "sample_size": 100,
  "search_fields": ["title", "description", "category", "brand"],
  "weight_multipliers": {
    "title": 2.5,
    "description": 1.0,
    "category": 1.8,
    "brand": 1.5
  }
}
```

#### Option 2: App-Only Process (For Existing Indexes)

If you already have a Searchcraft index set up, you can jump straight to creating the app:

```json
{
  "data_source": "url",
  "data_path": "https://api.example.com/products.json",
  "app_name": "my-search-app",
  "VITE_ENDPOINT_URL": "https://your-cluster.searchcraft.io",
  "VITE_INDEX_NAME": "existing_index",
  "VITE_READ_KEY": "your_read_key_here"
}
```

#### Benefits of the Two-Step Approach

- **Index Optimization** → Fine-tune your search index separately from the UI
- **Multiple Apps** → Create different search interfaces for the same data
- **Production Ready** → Better separation of concerns for production deployments
- **Easier Debugging** → Test search functionality independently of the UI

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
ADMIN_KEY= # The admin key (super user key) of your Searchcraft Cluster when running locally.
```

[.env sample](.env.example)

### Remote Usage

If you have already created an index through Vektron on Searchcraft Cloud you may use the write key for the index you are trying to access and use the MCP server for API operations that don't require admin privileges.
**IMPORTANT**: If you use the MCP server with a write key it should **NOT** be publicly exposed to the internet. Write keys are intended to be secured and by running an MCP server any user with access to the MCP server will be able to write to the index or delete data.

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

### Option 2: Claude Code

For use with Claude Code, use the CLI to configure the MCP server:

**Basic setup:**
```bash
# Add the Searchcraft MCP server to Claude Code
claude mcp add searchcraft -- node /path/to/searchcraft-mcp-server/dist/stdio-server.js
```

**With environment variables:**
```bash
# Add with your Searchcraft cluster configuration
claude mcp add searchcraft \
  --env ENDPOINT_URL=https://your-cluster.searchcraft.io \
  --env ADMIN_KEY=your_admin_key_here \
  -- node /path/to/searchcraft-mcp-server/dist/stdio-server.js
```

**Configuration scopes:**
- `--scope local` (default): Available only to you in the current project
- `--scope project`: Shared with team via `.mcp.json` file (recommended for teams)
- `--scope user`: Available to you across all projects

**Managing servers:**
```bash
# List configured servers
claude mcp list

# Check server status
/mcp

# Remove server
claude mcp remove searchcraft
```

### Option 3: Open WebUI (via Pipelines)

Open WebUI supports MCP servers through its Pipelines framework. This requires creating a custom pipeline that bridges your MCP server to Open WebUI.

**Step 1: Start the Searchcraft MCP HTTP server**
```bash
yarn start  # Starts HTTP server on port 3100
```

**Step 2: Create an MCP Pipeline for Open WebUI**

Create a file called `searchcraft_mcp_pipeline.py`:

```python
"""
title: Searchcraft MCP Pipeline
author: Searchcraft Team
version: 1.0.0
license: Apache-2.0
description: A pipeline that integrates Searchcraft MCP server with Open WebUI
requirements: requests
"""

import requests
import json
from typing import List, Union, Generator, Iterator
from pydantic import BaseModel


class Pipeline:
    class Valves(BaseModel):
        MCP_SERVER_URL: str = "http://localhost:3100/mcp"
        ENDPOINT_URL: str = ""
        ADMIN_KEY: str = ""

    def __init__(self):
        self.name = "Searchcraft MCP Pipeline"
        self.valves = self.Valves()

    async def on_startup(self):
        print(f"on_startup:{__name__}")

    async def on_shutdown(self):
        print(f"on_shutdown:{__name__}")

    def pipe(
        self, user_message: str, model_id: str, messages: List[dict], body: dict
    ) -> Union[str, Generator, Iterator]:
        # This pipeline acts as a bridge between Open WebUI and your MCP server
        # You can customize this to handle specific Searchcraft operations

        # Example: If user mentions search operations, route to MCP server
        if any(keyword in user_message.lower() for keyword in ['search', 'index', 'document', 'searchcraft']):
            try:
                # Initialize MCP session
                init_payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2025-06-18",
                        "capabilities": {},
                        "clientInfo": {"name": "open-webui-pipeline", "version": "1.0.0"}
                    }
                }

                response = requests.post(self.valves.MCP_SERVER_URL, json=init_payload)

                if response.status_code == 200:
                    # Add context about available Searchcraft tools
                    enhanced_message = f"""
{user_message}

[Available Searchcraft MCP Tools: create_index, delete_index, add_documents, get_search_results, list_all_indexes, get_index_stats, create_key, delete_key, and 20+ more tools for managing Searchcraft clusters]
"""
                    return enhanced_message

            except Exception as e:
                print(f"MCP connection error: {e}")

        return user_message
```

**Step 3: Install the Pipeline in Open WebUI**

1. **Via Admin Panel:**
   - Go to Admin Settings → Pipelines
   - Click "Add Pipeline"
   - Paste the pipeline code above
   - Configure the valves with your Searchcraft settings:
     - `MCP_SERVER_URL`: `http://localhost:3100/mcp`
     - `ENDPOINT_URL`: Your Searchcraft cluster URL
     - `ADMIN_KEY`: Your Searchcraft admin key

2. **Via Docker Environment:**
   ```bash
   # Save the pipeline to a file and mount it
   docker run -d -p 3000:8080 \
     -v open-webui:/app/backend/data \
     -v ./searchcraft_mcp_pipeline.py:/app/backend/data/pipelines/searchcraft_mcp_pipeline.py \
     --name open-webui \
     ghcr.io/open-webui/open-webui:main
   ```

**Step 4: Configure Open WebUI to use Pipelines**

1. Start Open WebUI with Pipelines support:
   ```bash
   # Using Docker Compose (recommended)
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

     pipelines:
       image: ghcr.io/open-webui/pipelines:main
       volumes:
         - pipelines:/app/pipelines
       environment:
         - PIPELINES_API_KEY=0p3n-w3bu!
   ```

2. In Open WebUI Settings → Connections:
   - Set OpenAI API URL to your Pipelines instance
   - Enable the Searchcraft MCP Pipeline

### Option 4: HTTP Server (for testing/remote deployment)

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

### Option 5: Docker

Run the Searchcraft MCP server in a Docker container for easy deployment and portability.

**Build the Docker image:**
```bash
docker build --load -t searchcraft-mcp-server .
```

**Run the container:**
```bash
docker run -it -p 8000:8000 \
  --name searchcraft-mcp-server \
  -e ENDPOINT_URL="https://your-cluster.searchcraft.io" \
  -e ADMIN_KEY="your_admin_key_here" \
  searchcraft-mcp-server
```

**Test the server:**
```bash
# Health check
curl http://localhost:8000/health

# Test MCP endpoint
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

**Remote inspection with MCP Inspector:**
```bash
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:8000/mcp
```

**Docker Configuration:**
- Uses Node.js 22-slim as the base image
- Exposes port 8000 by default (configurable via `PORT` environment variable)
- Automatically handles graceful shutdown on SIGINT/SIGTERM
- Optimized for production with minimal image size

**Environment Variables:**
- `PORT` - HTTP server port (default: 8000)
- `ENDPOINT_URL` - Your Searchcraft cluster endpoint URL
- `ADMIN_KEY` - Your Searchcraft admin key
- `DEBUG` - Enable debug logging (optional)

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

## Deployment Options Comparison

| Feature | stdio (Recommended) | HTTP (Local) | Docker |
|---------|---------------------|--------------|--------|
| **Performance** | ✅ Best (Direct IPC) | ⚠️ HTTP overhead | ✅ Good |
| **Security** | ✅ No exposed ports | ⚠️ Network port required | ✅ Isolated environment |
| **Setup Complexity** | ✅ Simple | ⚠️ Port management needed | ✅ Simple (one command) |
| **Claude Desktop** | ✅ Native support | ⚠️ Requires mcp-remote | ⚠️ Requires mcp-remote |
| **Claude Code** | ✅ Native support | ✅ Supported | ✅ Supported |
| **Open WebUI** | ❌ Not supported | ✅ Via Pipelines | ✅ Via Pipelines |
| **Remote Deployment** | ❌ Local only | ✅ Possible but manual | ✅ Easy containerization |
| **Testing** | ⚠️ Requires MCP tools | ✅ Easy with curl | ✅ Easy with curl |
| **Multiple Clients** | ❌ One at a time | ✅ Concurrent access | ✅ Concurrent access |
| **Portability** | ⚠️ Node.js required | ⚠️ Node.js required | ✅ Runs anywhere |

**Use stdio when:**
- Using Claude Desktop or Claude Code locally
- You want the absolute best performance
- You prefer direct process communication

**Use HTTP (local) when:**
- You need to test/debug the HTTP interface
- You're developing custom integrations
- You need multiple concurrent local clients

**Use Docker when:**
- You need remote deployment
- You want easy, reproducible setup
- You're deploying to cloud platforms
- You want isolation and security
- You need to publish your server for inspection

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

## Issues and Feature Requests

Visit https://github.com/searchcraft-inc/searchcraft-issues

## License

Licensed under the [Apache 2.0 License](LICENSE).

<p align="center">
Built with 🛰️ by the <a href="https://searchcraft.io">Searchcraft</a> team
</p>
