
# Stage 1: Build the app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and lock files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all project files
COPY . .

# Build optimized assets
RUN npm run build


# Stage 2: Run with Nginx

FROM nginx:stable-alpine

# Set working directory for nginx
WORKDIR /usr/share/nginx/html

# Copy build output from builder stage
COPY --from=builder /app/dist ./

# Replace default nginx config with custom one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
