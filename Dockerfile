FROM node:22-slim

# Add MCP server metadata label
LABEL io.modelcontextprotocol.server.name="io.github.searchcraft-inc/searchcraft-mcp-server"

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
# Remove dev dependencies to reduce image size
RUN yarn install --frozen-lockfile --production

# Environment variables with placeholder values
# Server Config
ENV PORT=3100
ENV USER_AGENT=searchcraft-mcp-server/0.2.0
ENV DEBUG=false
ENV LOG_LEVEL=LOG

# Searchcraft Config (REQUIRED - must be overridden at runtime)
ENV ENDPOINT_URL=""
ENV CORE_API_KEY=""

# Expose the port (can be overridden via PORT env var)
EXPOSE ${PORT}

# Default to stdio mode for MCP Inspector compatibility
# Override with: docker run <image> node dist/server.js for HTTP mode
CMD ["node", "dist/stdio-server.js"]

