#!/bin/bash

# MySQL Replication Setup Script
# This script sets up master-slave replication for the voting platform database

set -e  # Exit on error

echo "=========================================="
echo "MySQL Replication Setup"
echo "=========================================="

# Configuration
PRIMARY_HOST=${PRIMARY_HOST:-"db-primary"}
REPLICA_HOST=${REPLICA_HOST:-"db-replica"}
REPLICATION_USER=${REPLICATION_USER:-"repl_user"}
REPLICATION_PASSWORD=${REPLICATION_PASSWORD:-"repl_password"}
DATABASE_NAME=${DATABASE_NAME:-"voting_db"}

echo "Primary Host: $PRIMARY_HOST"
echo "Replica Host: $REPLICA_HOST"
echo "Database: $DATABASE_NAME"
echo ""

# Step 1: Create replication user on primary
echo "Step 1: Creating replication user on primary..."
mysql -h "$PRIMARY_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE USER IF NOT EXISTS '$REPLICATION_USER'@'%' IDENTIFIED BY '$REPLICATION_PASSWORD';
GRANT REPLICATION SLAVE ON *.* TO '$REPLICATION_USER'@'%';
FLUSH PRIVILEGES;
EOF

echo "✓ Replication user created"
echo ""

# Step 2: Get master status
echo "Step 2: Getting master status..."
MASTER_STATUS=$(mysql -h "$PRIMARY_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW MASTER STATUS\G")
LOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
LOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "Master Log File: $LOG_FILE"
echo "Master Log Position: $LOG_POS"
echo ""

# Step 3: Configure replica
echo "Step 3: Configuring replica..."
mysql -h "$REPLICA_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
STOP SLAVE;

CHANGE MASTER TO
    MASTER_HOST='$PRIMARY_HOST',
    MASTER_USER='$REPLICATION_USER',
    MASTER_PASSWORD='$REPLICATION_PASSWORD',
    MASTER_LOG_FILE='$LOG_FILE',
    MASTER_LOG_POS=$LOG_POS;

START SLAVE;
EOF

echo "✓ Replica configured"
echo ""

# Step 4: Verify replication status
echo "Step 4: Verifying replication status..."
sleep 2

SLAVE_STATUS=$(mysql -h "$REPLICA_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW SLAVE STATUS\G")

IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | awk '{print $2}')
SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | awk '{print $2}')

echo "Slave_IO_Running: $IO_RUNNING"
echo "Slave_SQL_Running: $SQL_RUNNING"
echo ""

if [ "$IO_RUNNING" == "Yes" ] && [ "$SQL_RUNNING" == "Yes" ]; then
    echo "=========================================="
    echo "✓ Replication setup completed successfully!"
    echo "=========================================="
else
    echo "=========================================="
    echo "✗ Replication setup failed!"
    echo "Please check the error logs."
    echo "=========================================="
    echo ""
    echo "Full Slave Status:"
    echo "$SLAVE_STATUS"
    exit 1
fi

# Step 5: Test replication (optional)
echo ""
echo "Testing replication..."
TEST_TABLE="replication_test_$(date +%s)"

mysql -h "$PRIMARY_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" -D "$DATABASE_NAME" <<EOF
CREATE TABLE $TEST_TABLE (id INT PRIMARY KEY, test_data VARCHAR(50));
INSERT INTO $TEST_TABLE VALUES (1, 'Replication Test');
EOF

sleep 2

TEST_RESULT=$(mysql -h "$REPLICA_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" -D "$DATABASE_NAME" -e "SELECT test_data FROM $TEST_TABLE WHERE id = 1" -s -N 2>/dev/null || echo "FAILED")

if [ "$TEST_RESULT" == "Replication Test" ]; then
    echo "✓ Replication test passed!"
    
    # Clean up test table
    mysql -h "$PRIMARY_HOST" -u root -p"$MYSQL_ROOT_PASSWORD" -D "$DATABASE_NAME" -e "DROP TABLE $TEST_TABLE"
else
    echo "✗ Replication test failed!"
fi

echo ""
echo "Setup complete!"
