# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN rm package-lock.json && npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run requires listening on PORT
ENV PORT=8080

# Default agent API URL (can be overridden)
ENV AGENT_API_URL=http://localhost:8081
ENV BACKEND_URL=http://localhost:8080

EXPOSE ${PORT}
