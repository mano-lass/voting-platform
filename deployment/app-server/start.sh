#!/bin/bash

# Application Server Startup Script

set -e

echo "=========================================="
echo "Starting Voting Platform Application"
echo "=========================================="
echo "Server ID: $SERVER_ID"
echo "Environment: $NODE_ENV"
echo "Database Host: $DB_HOST"
echo "Port: $PORT"
echo "=========================================="

# Wait for database to be ready
echo "Waiting for database..."
until wget --quiet --spider http://${DB_HOST}:${DB_PORT:-3306} 2>/dev/null || nc -z ${DB_HOST} ${DB_PORT:-3306}; do
    echo "Database is unavailable - sleeping"
    sleep 2
done

echo "Database is up - starting application"

# Start Node.js application
exec node server.js
