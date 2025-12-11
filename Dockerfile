FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy entire application
COPY . /app/

# Verify frontend/dist exists
RUN echo "Checking for frontend build..." && \
    ls -la /app/frontend/ && \
    ls -la /app/frontend/dist/ && \
    echo "Frontend files found!"

# Set working directory to backend
WORKDIR /app/backend

CMD gunicorn --bind 0.0.0.0:$PORT wsgi:app
