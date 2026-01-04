FROM node:18-alpine AS builder

WORKDIR /app

# Copy generic package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

# Copy source code
COPY . .

# Build Web
# NEXT_PUBLIC_API_URL must be provided at build time or runtime. 
# Next.js bundles env vars at build time for client-side, so we might need a build arg.
ENV NEXT_PUBLIC_API_URL=https://api.mediturnosapp.com
RUN npm run build --workspace=apps/web

# --- Production Image ---
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files for standalone mode
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/.next/standalone ./

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
