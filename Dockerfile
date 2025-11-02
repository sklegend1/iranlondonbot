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

    WORKDIR /app

    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    COPY package*.json ./
    COPY prisma ./prisma
    # COPY wait-for-db.sh ./

    RUN npm ci --omit=dev \
        && npx prisma generate 
        # && chmod +x wait-for-db.sh

    EXPOSE 3000

    # CMD ["./wait-for-db.sh"]