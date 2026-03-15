# Multi-stage build for React application

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S lendingui -u 1001

# Set permissions
RUN chown -R lendingui:nginx /usr/share/nginx/html
RUN chown -R lendingui:nginx /var/cache/nginx
RUN chown -R lendingui:nginx /var/log/nginx
RUN chown -R lendingui:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R lendingui:nginx /var/run/nginx.pid

# Switch to non-root user
USER lendingui

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]