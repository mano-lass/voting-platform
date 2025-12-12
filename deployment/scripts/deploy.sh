#!/bin/bash

# Full Deployment Script for Voting Platform
# This script orchestrates the complete deployment process

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "🗳️  Voting Platform Deployment"
echo "=========================================="
echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Validate environment
echo "Step 1: Validating environment..."
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

echo "✓ Docker and Docker Compose are installed"
echo ""

# Step 2: Build images
echo "Step 2: Building Docker images..."
cd "$PROJECT_ROOT"
docker-compose build --no-cache

echo "✓ Images built successfully"
echo ""

# Step 3: Start services
echo "Step 3: Starting services..."
docker-compose up -d

echo "✓ Services started"
echo ""

# Step 4: Wait for services to be healthy
echo "Step 4: Waiting for services to be healthy..."
sleep 10

# Check database
echo "Checking database..."
until docker-compose exec -T db-primary mysqladmin ping -h localhost -u root -proot_password --silent; do
    echo "Waiting for database..."
    sleep 2
done
echo "✓ Database is healthy"

# Check application servers
echo "Checking application servers..."
for i in 1 2 3; do
    until docker-compose exec -T app-server-$i wget --quiet --tries=1 --spider http://localhost:3000/api/health; do
        echo "Waiting for app-server-$i..."
        sleep 2
    done
    echo "✓ app-server-$i is healthy"
done

# Check load balancer
echo "Checking load balancer..."
until curl -f http://localhost:80/api/health > /dev/null 2>&1; do
    echo "Waiting for load balancer..."
    sleep 2
done
echo "✓ Load balancer is healthy"

echo ""

# Step 5: Setup database replication (if not already configured)
echo "Step 5: Setting up database replication..."
# Note: This needs to be run after initial setup
# docker-compose exec db-primary bash /docker-entrypoint-initdb.d/setup-replication.sh

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Load Balancer: http://localhost:80"
echo "  - HAProxy Stats: http://localhost:8404 (admin/admin)"
echo "  - Frontend: Available through load balancer"
echo "  - API: http://localhost:80/api"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart service: docker-compose restart <service-name>"
echo "  - View stats: docker-compose ps"
echo ""
