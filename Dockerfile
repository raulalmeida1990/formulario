# Multi-stage production Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --omit=dev

# Imagem de Produção Final
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Criar utilizador não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar dependências do builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copiar código fonte e assets públicos
COPY src ./src
COPY public ./public

# Mudar permissões para utilizador não-root
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Verificação de Saúde
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
