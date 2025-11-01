# ----------------------------
# Build Stage
# ----------------------------
    FROM node:20-alpine AS builder

    # Set working directory
    WORKDIR /app
    
    # Copy package files and install dependencies
    COPY package*.json ./
    RUN npm ci
    
    # Copy the rest of the application code
    COPY tsconfig.json ./
    COPY src ./src
    COPY prisma ./prisma
    
    # Generate Prisma client and build the TypeScript code
    RUN npx prisma generate
    RUN npm run build
    
    # ----------------------------
    # Runtime Stage
    # ----------------------------
    FROM node:20-alpine
    
    # Set working directory
    WORKDIR /app
    
    # Copy built files and runtime dependencies
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    COPY package*.json ./
    COPY prisma ./prisma
    
    # Install only production dependencies
    RUN npm ci --omit=dev
    
    # # Generate Prisma client for runtime
    # RUN npx prisma generate
    
    # Expose the application port
    EXPOSE 3000
    
    # Default command (can be overridden in docker-compose.yml)
    CMD ["node", "dist/presentation/allBotsRun.js"]