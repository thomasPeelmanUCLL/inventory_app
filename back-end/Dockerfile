# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# OpenSSL is required by Prisma to generate the client
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY repository/prisma ./repository/prisma
RUN npx prisma generate --schema=repository/prisma/schema.prisma

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY app.ts ./
COPY controller ./controller
COPY middleware ./middleware
COPY model ./model
COPY repository ./repository
COPY service ./service
COPY types ./types
COPY util ./util
COPY lib ./lib
COPY dto ./dto
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# OpenSSL is required by Prisma at runtime
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY repository/prisma ./repository/prisma

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["node", "dist/app.js"]
