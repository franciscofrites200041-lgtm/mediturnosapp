FROM node:18-alpine AS builder

WORKDIR /app

# Copy generic package files
COPY package.json package-lock.json ./
# Copy specific app package files (assuming monorepo structure)
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build API
RUN npm run build --workspace=apps/api

# --- Production Image ---
FROM node:18-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

# Install ONLY prod deps to save space
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy necessary config files if needed
COPY --from=builder /app/apps/api/.env.example ./apps/api/.env

EXPOSE 3001

# Start the application
CMD ["node", "apps/api/dist/main"]
