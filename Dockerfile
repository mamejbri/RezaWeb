# Build Angular
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && npm ci --no-audit --no-fund

COPY . .

RUN npm run build -- --configuration=production

# Serve via Nginx + the Angular Universal Node server (for SSR of dynamic
# routes like /reservation/:slug that aren't part of the prerendered build)
FROM nginx:stable-alpine

RUN apk add --no-cache nodejs

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/reza-web/browser/ /usr/share/nginx/html
COPY --from=build /app/dist/reza-web/server/ /app/server

COPY nginx.conf /etc/nginx/templates/default.conf.template

# The base image's own /docker-entrypoint.sh only runs its template/envsubst
# pipeline (and anything in /docker-entrypoint.d/) when the container's
# command is literally "nginx" — so the Node server is started from a script
# dropped into /docker-entrypoint.d/ rather than by replacing CMD, keeping
# that pipeline (and the ${BACKEND_URL} substitution) intact.
COPY docker-entrypoint.sh /docker-entrypoint.d/99-start-node.sh
RUN chmod +x /docker-entrypoint.d/99-start-node.sh

ENV SSR_PORT=4000

EXPOSE 80
