FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
COPY .env.production .env
ENV NODE_ENV=production

RUN bunx prisma generate

RUN bun run build

FROM oven/bun:1.3-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env .env

EXPOSE 3000
CMD ["sh", "-c", "bunx prisma migrate deploy && rm -rf ./prisma/migrations ./node_modules .env && ./dist/server"]