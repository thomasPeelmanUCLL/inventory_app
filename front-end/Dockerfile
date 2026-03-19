# ── Stage 1: Install dependencies ────────────────────────────
FROM node:20-alpine3.21 AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────
FROM node:20-alpine3.21 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_API_URL is baked in at build time — injected via --build-arg in CI
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# INTERNAL_API_URL is used by Next.js rewrites at build time.
ARG INTERNAL_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL

RUN npm run build

# ── Stage 3: Production image ─────────────────────────────────
FROM node:20-alpine3.21 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Bind to all interfaces (IPv4 + IPv6) — required when k8s uses IPv6 pod networking
ENV HOSTNAME="::"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/public           ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static     ./.next/static

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
