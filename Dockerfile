# ─────────────────────────────────────────────────
#  snip.link — Multi-stage Dockerfile
# ─────────────────────────────────────────────────

# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Copy server + built frontend
COPY server ./server
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 appuser
USER appuser

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
