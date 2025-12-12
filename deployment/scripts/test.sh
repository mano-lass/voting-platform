#!/bin/bash

# Testing Script for Voting Platform
# Tests various failure scenarios and system functionality

set -e

API_URL=${API_URL:-"http://localhost:80/api"}

echo "=========================================="
echo "Voting Platform Test Suite"
echo "=========================================="

# Test 1: Health Check
echo ""
echo "Test 1: System Health Check"
echo "------------------------------"
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
echo "$HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed"
    exit 1
fi

# Test 2: Get Candidates
echo ""
echo "Test 2: Get Candidates List"
echo "------------------------------"
CANDIDATES_RESPONSE=$(curl -s "$API_URL/vote/candidates" -H "Authorization: Bearer test-token" || echo "AUTH_REQUIRED")
echo "$CANDIDATES_RESPONSE"

# Test 3: Get Results
echo ""
echo "Test 3: Get Election Results"
echo "------------------------------"
RESULTS_RESPONSE=$(curl -s "$API_URL/results")
echo "$RESULTS_RESPONSE"

if echo "$RESULTS_RESPONSE" | grep -q "results"; then
    echo "✓ Results endpoint working"
else
    echo "✗ Results endpoint failed"
fi

# Test 4: Load Test with Apache Bench
echo ""
echo "Test 4: Load Test (100 requests, 10 concurrent)"
echo "------------------------------"
if command -v ab &> /dev/null; then
    ab -n 100 -c 10 -g results.tsv "$API_URL/health"
    echo "✓ Load test completed"
else
    echo "⚠ Apache Bench (ab) not installed, skipping load test"
fi

# Test 5: Simulate Application Server Failure
echo ""
echo "Test 5: Application Server Failure Test"
echo "------------------------------"
echo "Stopping app-server-1..."
docker-compose stop app-server-1

echo "Waiting 5 seconds..."
sleep 5

echo "Testing if system still responds..."
HEALTH_AFTER_FAILURE=$(curl -s "$API_URL/health" || echo "FAILED")

if echo "$HEALTH_AFTER_FAILURE" | grep -q "healthy"; then
    echo "✓ System still operational after app server failure"
else
    echo "✗ System failed after app server failure"
fi

echo "Restarting app-server-1..."
docker-compose start app-server-1

echo "Waiting for recovery..."
sleep 10

echo "✓ Test completed"

# Test 6: Database Connection Test
echo ""
echo "Test 6: Database Connection Test"
echo "------------------------------"
docker-compose exec -T db-primary mysql -u root -proot_password -e "SELECT 'Database Connected' as status;" voting_db
echo "✓ Database connection successful"

# Test 7: Replication Status
echo ""
echo "Test 7: Database Replication Status"
echo "------------------------------"
echo "Checking replica status..."
REPLICATION_STATUS=$(docker-compose exec -T db-replica mysql -u root -proot_password -e "SHOW SLAVE STATUS\G" || echo "NOT_CONFIGURED")

if echo "$REPLICATION_STATUS" | grep -q "Slave_IO_Running"; then
    echo "$REPLICATION_STATUS" | grep -E "(Slave_IO_Running|Slave_SQL_Running)"
    echo "✓ Replication configured"
else
    echo "⚠ Replication not configured or not running"
fi

echo ""
echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="
