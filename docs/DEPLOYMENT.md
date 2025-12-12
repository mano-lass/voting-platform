# Deployment Guide - Voting Platform

Complete guide for deploying the distributed voting platform in various environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Manual VM Deployment](#manual-vm-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Maintenance](#maintenance)

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB disk space

### One-Command Deployment

```bash
cd deployment
./scripts/deploy.sh
```

This will:
1. Validate environment
2. Build images
3. Start all services
4. Run health checks
5. Display access information

## Docker Compose Deployment

### Step-by-Step Deployment

#### 1. Clone and Navigate

```bash
git clone <repository-url>
cd voting-platform
```

#### 2. Configure Environment

```bash
cd backend
cp .env.example .env
nano .env  # or vim, notepad, etc.
```

Update these critical values:
```env
JWT_SECRET=your-very-secret-key-min-32-chars-change-this
DB_PASSWORD=secure-database-password
NODE_ENV=production
```

#### 3. Build Images

```bash
cd ../deployment
docker-compose build
```

#### 4. Start Services

```bash
docker-compose up -d
```

#### 5. Verify Deployment

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test health endpoints
curl http://localhost/api/health
curl http://localhost:8404  # HAProxy stats
```

#### 6. Initialize Database

The database is automatically initialized with schema and sample data. To manually initialize:

```bash
docker-compose exec db-primary mysql -u root -p voting_db < database/schema.sql
docker-compose exec db-primary mysql -u root -p voting_db < database/init-data.sql
```

#### 7. Setup Replication (Optional)

```bash
docker-compose exec db-primary bash
# Inside container:
mysql -u root -p < /docker-entrypoint-initdb.d/setup-replication.sh
```

### Service Endpoints

| Service | Endpoint | Description |
|---------|----------|-------------|
| Frontend | http://localhost | Web interface |
| API | http://localhost/api | REST API |
| HAProxy Stats | http://localhost:8404 | Load balancer statistics |
| Database | localhost:3306 | MySQL (internal only) |

## Manual VM Deployment

For deployment on separate virtual machines without Docker.

### Architecture

- VM1: Load Balancer (HAProxy)
- VM2-4: Application Servers (Node.js)
- VM5: Primary Database (MySQL)
- VM6: Replica Database (MySQL)

### VM1: Load Balancer Setup

```bash
# Install HAProxy
sudo apt update
sudo apt install haproxy -y

# Copy configuration
sudo cp deployment/load-balancer/haproxy.cfg /etc/haproxy/

# Update backend server IPs in haproxy.cfg
sudo nano /etc/haproxy/haproxy.cfg

# Start HAProxy
sudo systemctl enable haproxy
sudo systemctl start haproxy
```

### VM2-4: Application Server Setup

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Clone repository
git clone <repository-url>
cd voting-platform/backend

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env
nano .env

# Update DB_HOST to point to VM5
DB_HOST=<vm5-ip-address>
SERVER_ID=app-server-1  # Change for each VM

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start server.js --name voting-app

# Save PM2 configuration
pm2 save
pm2 startup
```

### VM5: Primary Database Setup

```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server -y

# Secure installation
sudo mysql_secure_installation

# Copy configuration
sudo cp database/mysql-primary.cnf /etc/mysql/conf.d/

# Restart MySQL
sudo systemctl restart mysql

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE voting_db;
CREATE USER 'voting_user'@'%' IDENTIFIED BY 'voting_password';
GRANT ALL PRIVILEGES ON voting_db.* TO 'voting_user'@'%';
CREATE USER 'repl_user'@'%' IDENTIFIED BY 'repl_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u root -p voting_db < database/schema.sql
mysql -u root -p voting_db < database/init-data.sql
```

### VM6: Replica Database Setup

```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server -y

# Copy configuration
sudo cp database/mysql-replica.cnf /etc/mysql/conf.d/

# Restart MySQL
sudo systemctl restart mysql

# Configure replication
sudo mysql -u root -p
```

```sql
CHANGE MASTER TO
  MASTER_HOST='<vm5-ip>',
  MASTER_USER='repl_user',
  MASTER_PASSWORD='repl_password',
  MASTER_AUTO_POSITION=1;

START SLAVE;
SHOW SLAVE STATUS\G
```

## Cloud Deployment

### AWS Deployment

#### Architecture

- Elastic Load Balancer (ALB)
- EC2 Auto Scaling Group (3+ t3.medium instances)
- RDS MySQL with Multi-AZ (Primary + Replica)
- S3 for static assets
- CloudWatch for monitoring

#### Steps

1. **Create RDS Instance**
```bash
aws rds create-db-instance \
  --db-instance-identifier voting-db \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 100 \
  --multi-az
```

2. **Create Launch Template**
```bash
# Create AMI with application code
# Configure user data script to start application
```

3. **Create Auto Scaling Group**
```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name voting-app-asg \
  --launch-template LaunchTemplateId=<template-id> \
  --min-size 3 \
  --max-size 10 \
  --desired-capacity 3 \
  --target-group-arns <target-group-arn>
```

4. **Create Application Load Balancer**
```bash
aws elbv2 create-load-balancer \
  --name voting-app-lb \
  --subnets <subnet-ids> \
  --security-groups <sg-id>
```

### Azure Deployment

Use Azure App Service, Azure Database for MySQL, and Azure Load Balancer.

### Google Cloud Deployment

Use Google Kubernetes Engine (GKE), Cloud SQL, and Cloud Load Balancing.

## Configuration

### Environment Variables

#### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=3000
SERVER_ID=app-server-1

# Database
DB_HOST=db-primary
DB_PORT=3306
DB_USER=voting_user
DB_PASSWORD=secure-password
DB_NAME=voting_db
DB_POOL_SIZE=10

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=30m

# Security
CORS_ORIGIN=https://yourdomain.com
BCRYPT_ROUNDS=10
```

#### HAProxy Configuration

Key settings in `haproxy.cfg`:

```cfg
# Health check interval
default-server inter 5s fall 3 rise 2

# Timeout settings
timeout connect 5000ms
timeout client  50000ms
timeout server  50000ms

# Backend servers
server app-server-1 192.168.1.10:3000 check
server app-server-2 192.168.1.11:3000 check
server app-server-3 192.168.1.12:3000 check
```

#### MySQL Configuration

Key settings for primary:

```ini
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog_format = ROW
gtid_mode = ON
innodb_buffer_pool_size = 1G
```

## Monitoring

### Health Checks

```bash
# Application health
curl http://localhost/api/health

# Detailed health
curl http://localhost/api/health/detailed

# HAProxy stats
curl http://localhost:8404
```

### Log Monitoring

```bash
# Docker Compose logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f app-server-1

# Database logs
docker-compose logs -f db-primary
```

### Metrics to Monitor

- Request rate (requests/second)
- Response time (average, p95, p99)
- Error rate (4xx, 5xx responses)
- Database connections (active, idle)
- Replication lag (seconds behind master)
- Server CPU and memory usage
- Disk I/O

### Monitoring Tools

- **Prometheus + Grafana**: Metrics collection and visualization
- **ELK Stack**: Log aggregation and analysis
- **Datadog**: All-in-one monitoring solution
- **CloudWatch**: For AWS deployments

## Maintenance

### Backup Procedures

#### Database Backup

```bash
# Automated backup
./database/backup.sh

# Manual backup
docker-compose exec db-primary mysqldump -u root -p voting_db > backup.sql
```

#### Restore Database

```bash
docker-compose exec -T db-primary mysql -u root -p voting_db < backup.sql
```

### Updates and Upgrades

#### Update Application Code

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build

# Rolling update
docker-compose up -d --no-deps --build app-server-1
docker-compose up -d --no-deps --build app-server-2
docker-compose up -d --no-deps --build app-server-3
```

#### Update Dependencies

```bash
cd backend
npm update
npm audit fix

# Rebuild and redeploy
```

### Scaling

#### Scale Application Servers

```bash
# Scale up to 5 instances
docker-compose up -d --scale app-server=5

# Scale down to 2 instances
docker-compose up -d --scale app-server=2
```

#### Database Scaling

For read-heavy workloads, add more read replicas:

1. Configure new VM with replica settings
2. Set up replication from primary
3. Update application to use read replicas for SELECT queries

### Troubleshooting

#### Service Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Check resource usage
docker stats

# Restart service
docker-compose restart <service-name>
```

#### Database Connection Issues

```bash
# Test connectivity
docker-compose exec app-server-1 nc -zv db-primary 3306

# Check database status
docker-compose exec db-primary mysqladmin -u root -p status
```

#### High Load

```bash
# Check current load
docker-compose exec app-server-1 top

# Scale up
docker-compose up -d --scale app-server=5
```

## Security Hardening

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (min 32 characters)
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Configure firewall rules
- [ ] Implement rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Penetration testing
- [ ] Secure backup storage
- [ ] Implement intrusion detection

### SSL/TLS Setup

```bash
# Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout cert.key -out cert.crt

# For production, use Let's Encrypt
certbot certonly --standalone -d yourdomain.com
```

## Performance Tuning

### Application Server

```javascript
// Increase cluster workers
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}
```

### Database

```sql
-- Analyze queries
EXPLAIN SELECT * FROM votes WHERE voter_id = 'voter001';

-- Add indexes
CREATE INDEX idx_voter_id ON votes(voter_id);
CREATE INDEX idx_candidate_id ON votes(candidate_id);

-- Optimize tables
OPTIMIZE TABLE votes;
```

### Load Balancer

```cfg
# Enable HTTP/2
bind *:443 ssl crt /path/to/cert.pem alpn h2,http/1.1

# Enable compression
compression algo gzip
compression type text/html text/plain text/css application/javascript
```

---

**Last Updated**: December 2025
