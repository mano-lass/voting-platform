# 🗳️ Distributed Online Voting Platform

A fault-tolerant, distributed voting system built with a multi-tier architecture featuring load balancing, database replication, and automatic failover mechanisms.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This project implements a distributed online voting platform designed for high availability and fault tolerance. The system handles concurrent voting operations across geographically dispersed users while maintaining data consistency and platform availability.

### Key Objectives

- **Fault Tolerance**: Automatic failover for application servers and database
- **Load Balancing**: HAProxy distributes requests across multiple app servers
- **Data Replication**: MySQL master-slave replication for data redundancy
- **Security**: Authentication, authorization, and vote integrity
- **Scalability**: Horizontal scaling of application servers

## 🏗️ Architecture

```
┌─────────────────┐
│  Load Balancer  │  (HAProxy)
│   Port: 80      │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
┌───▼┐ ┌─▼──┐ ┌──▼─┐
│App1│ │App2│ │App3│  (Node.js + Express)
└─┬──┘ └─┬──┘ └──┬─┘
  └──────┼───────┘
         │
    ┌────▼─────┐
    │ Primary  │ ◄──replication──► │ Replica  │
    │   DB     │                   │    DB    │
    └──────────┘                   └──────────┘
        (MySQL)                       (MySQL)
```

### Components

1. **Frontend Layer**: Static HTML/CSS/JS served by Nginx
2. **Load Balancer**: HAProxy with health checks and round-robin distribution
3. **Application Layer**: 3+ Node.js servers (stateless)
4. **Database Layer**: MySQL with master-slave replication

## ✨ Features

- ✅ **User Authentication**: Secure login with JWT tokens
- ✅ **Vote Casting**: One vote per user with duplicate prevention
- ✅ **Real-time Results**: Live vote counting and visualization
- ✅ **Health Monitoring**: Health check endpoints for all services
- ✅ **Automatic Failover**: Failed servers automatically removed from rotation
- ✅ **Database Replication**: Automatic data replication to standby database
- ✅ **Load Distribution**: Even distribution of requests across servers
- ✅ **Session Management**: Stateless authentication with JWT
- ✅ **Audit Trail**: Vote timestamp and anonymity preservation

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript | ES6+ |
| **Web Server** | Nginx | 1.24+ |
| **Load Balancer** | HAProxy | 2.8+ |
| **Application** | Node.js + Express | 18.x LTS |
| **Database** | MySQL | 8.0+ |
| **Containerization** | Docker + Docker Compose | Latest |
| **Authentication** | JWT (jsonwebtoken) | 9.x |
| **Password Hashing** | bcryptjs | 2.x |

## 📦 Prerequisites

Before installing, ensure you have:

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository
- **Port Availability**: Ports 80, 3306, 8404 must be available

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd voting-platform
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and update:
- `JWT_SECRET`: Use a strong random string (min 32 characters)
- `DB_PASSWORD`: Set a secure database password
- Other configuration as needed

### 3. Build and Deploy

```bash
cd deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The deployment script will:
1. Validate Docker installation
2. Build all Docker images
3. Start all services
4. Wait for services to be healthy
5. Display access information

### 4. Access the Application

- **Frontend**: http://localhost
- **API**: http://localhost/api
- **HAProxy Stats**: http://localhost:8404 (admin/admin)

## 💻 Usage

### Demo Credentials

The system comes with pre-configured demo accounts:

- **Voter ID**: `voter001` | **Password**: `password123`
- **Voter ID**: `voter002` | **Password**: `password123`

### Voting Process

1. Navigate to http://localhost
2. Click "Login to Vote"
3. Enter your voter credentials
4. Select a candidate
5. Confirm your vote
6. View real-time results

### Managing Services

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart app-server-1

# View service status
docker-compose ps

# Scale application servers
docker-compose up -d --scale app-server=5
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Authenticate a voter and receive JWT token.

**Request:**
```json
{
  "voterId": "voter001",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "voterName": "John Doe"
}
```

### Voting Endpoints

#### GET /api/vote/candidates
Get list of all candidates. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "candidates": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "party": "Progressive Party"
    }
  ]
}
```

#### GET /api/vote/status
Check if the authenticated voter has already voted.

**Response:**
```json
{
  "hasVoted": false
}
```

#### POST /api/vote/submit
Submit a vote for a candidate.

**Request:**
```json
{
  "candidateId": 1
}
```

**Response:**
```json
{
  "message": "Vote submitted successfully",
  "success": true
}
```

### Results Endpoints

#### GET /api/results
Get current election results (no authentication required).

**Response:**
```json
{
  "results": [
    {
      "candidateName": "Alice Johnson",
      "party": "Progressive Party",
      "voteCount": 42
    }
  ],
  "totalVotes": 100,
  "serverId": "app-server-1",
  "timestamp": "2025-12-12T10:30:00.000Z"
}
```

### Health Check

#### GET /api/health
Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-12T10:30:00.000Z",
  "serverId": "app-server-1",
  "uptime": 3600,
  "database": "connected"
}
```

## 🧪 Testing

### Run Test Suite

```bash
cd deployment
chmod +x scripts/test.sh
./scripts/test.sh
```

The test suite includes:
- Health check verification
- API endpoint testing
- Load testing (with Apache Bench)
- Failover simulation
- Database connectivity tests
- Replication status checks

### Manual Testing

#### Test Load Balancing
```bash
# Make multiple requests and observe server IDs
for i in {1..10}; do
  curl -s http://localhost/api/health | jq .serverId
done
```

#### Test Failover
```bash
# Stop one application server
docker-compose stop app-server-1

# Verify system still responds
curl http://localhost/api/health

# Restart the server
docker-compose start app-server-1
```

## 🌐 Deployment

### Production Deployment Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (min 32 characters)
- [ ] Configure SSL/TLS certificates
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Implement log aggregation
- [ ] Set up firewall rules
- [ ] Enable database replication
- [ ] Configure automated failover
- [ ] Set resource limits (CPU, memory)

### Environment Variables

Key environment variables for production:

```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret-min-32-chars>
DB_PASSWORD=<secure-database-password>
CORS_ORIGIN=https://yourdomain.com
```

## 🔒 Security

### Implemented Security Measures

1. **Authentication**: JWT-based authentication with expiration
2. **Password Hashing**: bcrypt with 10 rounds
3. **SQL Injection Prevention**: Parameterized queries
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **CORS**: Configurable origin restrictions
6. **Security Headers**: Helmet.js for HTTP headers
7. **Input Validation**: Express-validator for all inputs
8. **Vote Integrity**: Database constraints prevent duplicate votes

### Security Best Practices

- Never commit `.env` files
- Rotate JWT secrets regularly
- Use HTTPS in production
- Implement two-factor authentication (future enhancement)
- Regular security audits
- Keep dependencies updated

## 🔧 Troubleshooting

### Common Issues

#### Services won't start
```bash
# Check if ports are in use
netstat -an | findstr "80"
netstat -an | findstr "3306"

# Check Docker logs
docker-compose logs
```

#### Database connection failed
```bash
# Verify database is running
docker-compose ps db-primary

# Check database logs
docker-compose logs db-primary

# Test connection
docker-compose exec db-primary mysql -u root -p
```

#### Application server unhealthy
```bash
# Check application logs
docker-compose logs app-server-1

# Restart the service
docker-compose restart app-server-1
```

## 📄 License

This project is created for academic purposes. MIT License.

## 👥 Contributing

This is an academic project. For educational purposes only.

## 📞 Support

For issues and questions, please refer to the project documentation or create an issue in the repository.

---

**Project Status**: Academic Project - Demonstration Purpose

**Last Updated**: December 2025
