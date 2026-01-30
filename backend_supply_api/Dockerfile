
FROM python:3.11-slim-bookworm

# Configure Python status
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependencies first to leverage cache
COPY pyproject.toml uv.lock ./

# Install dependencies into the system python
RUN uv pip install --system .

# Copy the application code
COPY . .

# Expose the port (Cloud Run sets PORT env var)
ENV PORT=8080
EXPOSE $PORT

# Run the application
# We use 'exec' to ensure uvicorn receives signals correctly
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
