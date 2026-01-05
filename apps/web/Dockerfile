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

# Build con variable de entorno inyectada
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm build --filter=@mediturnos/web...

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files for standalone mode
# Nota: La estructura standalone de Next copia node_modules necesarios dentro de standalone
# Arreglo de estilos: Copiar assets estáticos a la raíz donde corre server.js
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/.next/standalone ./

# Instalar dependencias explicitamente para asegurar que 'next' existe
# (Esto arregla problemas de symlinks con pnpm en standalone)
RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 3000

CMD ["node", "server.js"]
