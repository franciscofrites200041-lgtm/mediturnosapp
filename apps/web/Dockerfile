FROM node:20-alpine AS base
RUN npm install -g pnpm

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

# Build con variable de entorno quemada para producción
ENV NEXT_PUBLIC_API_URL=https://api.mediturnosapp.com
RUN pnpm build --filter=@mediturnos/web...

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files for standalone mode
# Nota: La estructura standalone de Next copia node_modules necesarios dentro de standalone
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/.next/standalone ./

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
