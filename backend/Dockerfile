# ---- Builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
# Generate Prisma Client and build NestJS
RUN npx prisma generate && npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY package*.json ./
# Install only production deps
RUN npm ci --omit=dev
# Copy built app and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Prisma client is in node_modules from prod install
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]