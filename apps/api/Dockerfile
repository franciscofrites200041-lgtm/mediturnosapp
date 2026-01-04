FROM node:18-alpine AS base
RUN npm install -g pnpm

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
# Copiar archivos de definición de monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# Copiar package.json de apps (necesario para pnpm install)
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Instalar todas las dependencias (dev incluidas)
RUN pnpm install --no-frozen-lockfile

# Copiar todo el código fuente
COPY . .

# Generar cliente Prisma
RUN pnpm dlx prisma generate --schema=apps/api/prisma/schema.prisma

# Build de la API
RUN pnpm build --filter=@mediturnos/api...

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Copiar dependencias de prod
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Instalar solo prod dependencies
RUN pnpm install --prod --no-frozen-lockfile

# Copiar build desde builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
# Copiar cliente prisma generado (ubicación puede variar con pnpm, pero usualmente está en node_modules principal)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
