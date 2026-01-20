#!/bin/bash
# Run Ralph loop inside Docker sandbox
# Usage: ./ralph-docker.sh [plan|auto] [max_iterations]
#
# Examples:
#   ./ralph-docker.sh              # Build mode, unlimited
#   ./ralph-docker.sh plan         # Plan mode, unlimited
#   ./ralph-docker.sh auto         # Auto: 5 plan → 5 build → repeat
#   ./ralph-docker.sh 10           # Build mode, 10 iterations
#
# Set CLAUDE_ACCESS_TOKEN env var or add to .env file

set -e

# Determine docker compose command (docker compose vs docker-compose)
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
elif docker-compose version &> /dev/null; then
    COMPOSE="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found"
    echo "Please install Docker Desktop or Docker Compose"
    exit 1
fi

# Token is hardcoded in docker-compose.yml

# Build if needed (skip .env file - Docker doesn't like its format)
echo "Building Docker image..."
$COMPOSE --env-file /dev/null build

# Run the loop inside container
echo "Starting Ralph loop in Docker sandbox..."
$COMPOSE --env-file /dev/null run --rm ralph ./loop.sh "$@"
