FROM node:22-slim

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
# Remove dev dependencies to reduce image size
RUN yarn install --frozen-lockfile --production

EXPOSE 8000

# Set default port to 8000 for Glama compatibility
ENV PORT=8000

CMD ["node", "dist/server.js"]

