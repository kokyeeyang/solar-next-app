# Install dependencies only when needed
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy project files
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# 👇 Inject environment variable at build time
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# ✅ Echo for debug (so you can see in build logs)
RUN echo "Building with NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}"

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set environment and ports
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
