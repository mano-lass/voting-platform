#!/bin/bash

# Manual Database Failover Script
# This script promotes a replica to become the new primary

set -e

echo "=========================================="
echo "Database Failover Procedure"
echo "=========================================="

REPLICA_HOST=${REPLICA_HOST:-"db-replica"}
OLD_PRIMARY_HOST=${OLD_PRIMARY_HOST:-"db-primary"}

echo "WARNING: This will promote $REPLICA_HOST to primary"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Step 1: Stop replication on replica
echo "Step 1: Stopping replication on replica..."
docker-compose exec -T db-replica mysql -u root -proot_password <<EOF
STOP SLAVE;
RESET SLAVE ALL;
EOF

echo "✓ Replication stopped"

# Step 2: Make replica writable
echo "Step 2: Making replica writable..."
docker-compose exec -T db-replica mysql -u root -proot_password <<EOF
SET GLOBAL read_only = OFF;
SET GLOBAL super_read_only = OFF;
EOF

echo "✓ Replica is now writable"

# Step 3: Update application configuration
echo "Step 3: Update application servers to use new primary..."
echo "NOTE: You need to update DB_HOST environment variable to point to $REPLICA_HOST"
echo "This typically requires restarting application servers with new configuration"

echo ""
echo "=========================================="
echo "✓ Failover Complete"
echo "=========================================="
echo "New Primary: $REPLICA_HOST"
echo ""
echo "Next steps:"
echo "1. Update application configuration to use $REPLICA_HOST as DB_HOST"
echo "2. Restart application servers"
echo "3. Fix the old primary ($OLD_PRIMARY_HOST) and configure it as new replica"
echo ""
