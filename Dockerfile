# Dashboard image. No database, no secrets: configuration comes from the host's environment at runtime
# (CORE_URL, CORE_PUBLIC_URL, APP_URL, CORE_SIGNING_KEYS, CORE_SIGNING_KEY_ID and display settings).
#   docker build -t listing-seo-dashboard .
FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
# The server's startup check refuses to start on a missing or insecure configuration.
CMD ["node", "server.js"]
