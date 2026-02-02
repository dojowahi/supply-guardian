
FROM python:3.10-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy project definition
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-install-project

# Copy the rest of the source code
COPY . .

# Install the project
RUN uv sync --frozen

# Expose the API port
EXPOSE 9090

# Set default environment variables
ENV HOST=0.0.0.0
ENV PORT=9090

# Run the agent API server
# We use the PORT environment variable for Cloud Run compatibility
CMD uv run adk web --port $PORT --host 0.0.0.0
