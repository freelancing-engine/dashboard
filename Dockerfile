FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_AGENT_SERVICE_URL=http://localhost:8000
ARG NEXT_PUBLIC_AGENT_SERVICE_TOKEN=
ENV NEXT_PUBLIC_AGENT_SERVICE_URL=$NEXT_PUBLIC_AGENT_SERVICE_URL
ENV NEXT_PUBLIC_AGENT_SERVICE_TOKEN=$NEXT_PUBLIC_AGENT_SERVICE_TOKEN
RUN npx next build --webpack

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
