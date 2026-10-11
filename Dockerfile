FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=http://localhost:3005
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build \
  && node scripts/render-nginx-config.mjs "$VITE_API_URL" > /tmp/default.conf

FROM nginxinc/nginx-unprivileged:stable-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /tmp/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
