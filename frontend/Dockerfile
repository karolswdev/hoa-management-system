# Multi-stage build for React/Vite frontend
# Stage 1: Build the application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Accept Vite build-time env as build args and export to ENV so Vite picks them up
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_APP_VERSION
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with nginx
FROM nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
