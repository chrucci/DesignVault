# =============================================================================
# Design Vault Web — Multi-stage Docker build
# Handles pnpm monorepo workspace with standalone Next.js output
# Includes Chromium for Puppeteer-based PDF generation
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:22-slim AS deps

# Enable corepack so pnpm is available at the version declared in package.json
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

WORKDIR /app

# Copy the files pnpm needs to resolve the workspace and install deps.
# Order matters for Docker layer caching — lockfile + manifests first.
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all dependencies (including devDependencies needed for the build)
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Build the Next.js application
# ---------------------------------------------------------------------------
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy the shared package source (needed at build time for transpilation)
COPY packages/shared ./packages/shared

# Copy the web app source
COPY apps/web ./apps/web

# Build the Next.js app with standalone output
# The standalone output includes only the files needed to run in production
RUN pnpm --filter @design-vault/web build

# ---------------------------------------------------------------------------
# Stage 3: Production runner with Chromium for PDF generation
# ---------------------------------------------------------------------------
FROM node:22-slim AS runner

# Install Chromium and fonts for Puppeteer PDF generation.
# --no-install-recommends keeps the image smaller.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer where to find the system Chromium binary
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Skip Puppeteer's bundled Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy the standalone server output from the builder stage.
# Next.js standalone includes a minimal server.js and all required node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets (CSS, JS bundles) — not included in standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public assets (favicon, images, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Run as non-root
USER nextjs

EXPOSE 3000

# Start the standalone Next.js server
CMD ["node", "apps/web/server.js"]
