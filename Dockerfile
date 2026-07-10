# syntax=docker/dockerfile:1

# ── Stage 1: build Vite SPA ──────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# pnpm 9: onlyBuiltDependencies ainda via package/workspace sem política estrita do 10
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --config.virtual-store-dir=node_modules/.pnpm

COPY index.html vite.config.ts tsconfig*.json components.json ./
COPY postcss.config.js tailwind.config.ts ./
COPY public ./public
COPY src ./src

# Vite embute VITE_* no bundle em tempo de build
ARG VITE_USE_MOCKS=false
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_PUBLISHABLE_KEY=
ARG VITE_STRIPE_PUBLISHABLE_KEY=

ENV VITE_USE_MOCKS=$VITE_USE_MOCKS \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

RUN pnpm run build

# ── Stage 2: Nginx estático ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
