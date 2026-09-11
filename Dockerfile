FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirement files first for layer caching
COPY backend/requirements.txt ./backend/
COPY driftguard/package*.json ./driftguard/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Install Node dependencies
RUN cd driftguard && npm ci

# Copy the rest of the source code
COPY . .

# Build the Next.js app
RUN cd driftguard && npm run build

# Add execute permissions to the start script
RUN chmod +x start.sh

# Expose Next.js port
EXPOSE 3000

# Start both backend and frontend
CMD ["./start.sh"]
