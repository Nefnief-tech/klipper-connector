FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "src/server.js"]
