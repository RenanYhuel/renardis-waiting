# Dockerfile optimisé pour Next.js production (standalone)
FROM node:18-alpine AS base

# Dépendances système minimales
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Étape de dépendances
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install

# Étape de build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Log pour debug build context et .env
RUN echo "\n==== CONTENU DU DOSSIER /app ====" && ls -al /app && echo "\n==== CONTENU DU .env ====" && (cat /app/.env || echo "Pas de .env") && echo "\n============================\n"
RUN npm run build

# Image finale production
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Utilisateur non root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copie des assets nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000

# Lancement du serveur Next.js standalone
CMD ["node", "server.js"]
