FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Accept build arguments for NEXT_PUBLIC_* variables (required at build time)
# Note: Do NOT include /api here - the frontend code adds /api to paths
ARG NEXT_PUBLIC_EXPRESS_API_URL=https://igormraz.com
ARG NEXT_PUBLIC_IMAGE_BASE_URL=https://igormraz.com
ARG NODE_ENV=production

# Set as environment variables for the build
ENV NEXT_PUBLIC_EXPRESS_API_URL=${NEXT_PUBLIC_EXPRESS_API_URL}
ENV NEXT_PUBLIC_IMAGE_BASE_URL=${NEXT_PUBLIC_IMAGE_BASE_URL}
ENV NODE_ENV=${NODE_ENV}

# Build Next.js app
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
# Public directory not needed in standalone mode - static files are in .next/static

# Expose port
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
