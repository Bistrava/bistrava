FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@10.33.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
# Public build configuration only. Never declare bank, SMTP or database secrets as ARG.
ARG NEXT_PUBLIC_SITE_URL=https://bistrava.com
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_GA4_ID
ARG ROBOTS_INDEXING_ENABLED=false
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID \
    ROBOTS_INDEXING_ENABLED=$ROBOTS_INDEXING_ENABLED
COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
# glibc malloc fragments under sharp's image resizing and pushed the 512 MB instance over its limit;
# Next.js and sharp recommend jemalloc on glibc-based Linux. The symlink keeps the path architecture-neutral.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends libjemalloc2 \
  && rm -rf /var/lib/apt/lists/* \
  && ln -s "$(find /usr/lib -name libjemalloc.so.2 | head -n 1)" /usr/local/lib/libjemalloc.so.2
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    LD_PRELOAD=/usr/local/lib/libjemalloc.so.2
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
