FROM node:22-slim

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

CMD ["node", "dist/server.js"]

