# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst (might be already there, but ensuring consistency if using a minimal image)
# The official nginx:alpine image HAS envsubst.

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run requires listening on PORT
ENV PORT=8080
# Default backend (can be overridden)
ENV BACKEND_URL=http://localhost:8000

EXPOSE ${PORT}
