FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Development
FROM base AS development
ENV NODE_ENV=development \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true

COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# Build
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/dist ./dist
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
