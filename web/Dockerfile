# Built from the repository root: docker build -f web/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /build
COPY web/package.json web/package-lock.json ./
RUN npm ci
# packages/core resolves its own imports (openapi-fetch) from its own node_modules, as in a checkout.
COPY packages/core/package.json packages/core/package-lock.json ../packages/core/
RUN cd ../packages/core && npm ci
COPY web/ .
COPY shared/ ../shared/
COPY packages/core/ ../packages/core/
COPY docs/manual/ ../docs/manual/
RUN npm run build

# Caddy serves the PWA and terminates TLS; /api is proxied to the API container.
FROM caddy:2-alpine
COPY --from=build /build/dist /srv
COPY infra/caddy/ /etc/caddy/
